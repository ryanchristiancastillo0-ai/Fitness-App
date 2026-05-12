const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const UAParser = require('ua-parser-js');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// ─────────────────────────────────────────────
//  RATE LIMITER (in-memory, per email)
//  10 wrong attempts  → locked 30 seconds
//  20 wrong attempts  → locked 30 minutes
// ─────────────────────────────────────────────
const loginAttempts = new Map(); // key: email, value: { count, lockedUntil }

function getRateLimit(email) {
  if (!loginAttempts.has(email)) return { count: 0, lockedUntil: null };
  return loginAttempts.get(email);
}

function recordFailedAttempt(email) {
  const record = getRateLimit(email);
  const count  = record.count + 1;

  let lockedUntil = null;
  if (count >= 20) {
    lockedUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
  } else if (count >= 10) {
    lockedUntil = Date.now() + 30 * 1000;       // 30 seconds
  }

  loginAttempts.set(email, { count, lockedUntil });
  return count;
}

function clearAttempts(email) {
  loginAttempts.delete(email);
}

function checkRateLimit(email) {
  const record = getRateLimit(email);
  if (!record.lockedUntil) return null; // not locked

  const remaining = record.lockedUntil - Date.now();
  if (remaining <= 0) {
    loginAttempts.set(email, { count: 0, lockedUntil: null });
    return null;
  }

  if (record.count >= 20) {
    const mins = Math.ceil(remaining / 60000);
    return {
      message: `Too many failed attempts. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`,
      retryAfter: Math.ceil(remaining / 1000),
    };
  } else {
    const secs = Math.ceil(remaining / 1000);
    return {
      message: `Too many failed attempts. Try again in ${secs} second${secs !== 1 ? 's' : ''}.`,
      retryAfter: Math.ceil(remaining / 1000),
    };
  }
}

// ─────────────────────────────────────────────
//  COOKIE HELPER — works for localhost AND dev tunnels
// ─────────────────────────────────────────────
const COOKIE_NAME = 'vitalis_session';

function getCookieOptions(req) {
  // Dev tunnels use HTTPS even in dev, so check the actual request protocol
  // not just NODE_ENV. req.secure works because we set 'trust proxy' = 1 in server.js
  const isSecure =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isSecure,
    // 'none' required for cross-origin cookies (tunnel URL ≠ backend URL)
    // 'lax' is fine only when frontend and backend are same origin (localhost dev)
    sameSite: isSecure ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
}

function setSessionCookie(res, userId, email, req) {
  const token = jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.cookie(COOKIE_NAME, token, getCookieOptions(req));
  return token;
}

// ─────────────────────────────────────────────
//  GET /api/auth/me  — validate cookie session
// ─────────────────────────────────────────────
router.get('/me', (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
    
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ id: decoded.id, email: decoded.email });
  } catch (err) {
    res.clearCookie(COOKIE_NAME, getCookieOptions(req)); // ✅ dynamic options
    return res.status(401).json({ message: 'Session expired' });
  }
});

// ─────────────────────────────────────────────
//  POST /api/auth/register
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, fitness_goal } = req.body;

  try {
    const [existing] = await db.execute('SELECT email FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered in Vitalis labs.' });
    }

    const salt     = await bcrypt.genSalt(10);
    const hashedPw = await bcrypt.hash(password, salt);

    await db.execute(
      'INSERT INTO users (name, email, password, fitness_goal, is_online) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPw, fitness_goal, 0]
    );

    res.status(201).json({ success: true, message: 'Identity created.' });
  } catch (err) {
    res.status(500).json({ error: 'Database rejection: ' + err.message });
  }
});

// ─────────────────────────────────────────────
//  SESSION LOGGER
// ─────────────────────────────────────────────
const logUserSession = async (req, userId) => {
  try {
    const parser = new UAParser(req.headers['user-agent']);
    const result = parser.getResult();

    const device  = result.device.type || 'Desktop';
    const browser = result.browser.name || 'Unknown';
    const os      = result.os.name || 'Unknown';

    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket?.remoteAddress ||
      req.ip ||
      'Unknown';

    const location = 'Unknown';

    await db.execute(
      'UPDATE user_sessions SET is_current = false WHERE user_id = ?',
      [userId]
    );

    await db.execute(
      `INSERT INTO user_sessions
       (user_id, device, browser, os, ip_address, location, is_current)
       VALUES (?, ?, ?, ?, ?, ?, true)`,
      [userId, device, browser, os, ip, location]
    );
  } catch (err) {
    console.error('SESSION LOG ERROR:', err);
  }
};

// ─────────────────────────────────────────────
//  POST /api/auth/login
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // 1. Check rate limit BEFORE hitting the database
  const lockStatus = checkRateLimit(email);
  if (lockStatus) {
    return res.status(429).json({
      message:    lockStatus.message,
      retryAfter: lockStatus.retryAfter,
    });
  }

  try {
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      // Don't reveal whether email exists — treat same as wrong password
      recordFailedAttempt(email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user    = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const attempts = recordFailedAttempt(email);

      let hint = 'Invalid credentials';
      if (attempts >= 20) {
        hint = 'Too many failed attempts. Try again in 30 minutes.';
      } else if (attempts >= 10) {
        hint = 'Too many failed attempts. Try again in 30 seconds.';
      }

      return res.status(401).json({ message: hint });
    }

    // ✅ Success — clear failed attempts, set cookie
    clearAttempts(email);
    await db.execute('UPDATE users SET is_online = 1 WHERE id = ?', [user.id]);

    setSessionCookie(res, user.id, user.email, req); // ✅ pass req
    await logUserSession(req, user.id);

    // Return user info (NO token in body — it lives in the HttpOnly cookie)
    res.json({
      id:     user.id,
      name:   user.name,
      email:  user.email,
      avatar: user.avatar_url,
      goal:   user.fitness_goal,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during initialization' });
  }
});

// ─────────────────────────────────────────────
//  POST /api/auth/google-login
// ─────────────────────────────────────────────
router.post('/google-login', async (req, res) => {
  const { code } = req.body;

  try {
    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri: 'postmessage',
    });

    const ticket = await googleClient.verifyIdToken({
      idToken:                     tokens.id_token,
      audience:                    process.env.GOOGLE_CLIENT_ID,
      maxAllowedTimeSkewInSeconds: 50,
    });

    const payload                  = ticket.getPayload();
    const { email, name, picture } = payload;

    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    let user;

    if (users.length === 0) {
      const salt           = await bcrypt.genSalt(10);
      const randomHashedPw = await bcrypt.hash(Math.random().toString(36).slice(-10), salt);
      const defaultGoal    = 'Unspecified (Google Auth)';

      const [insertResult] = await db.execute(
        'INSERT INTO users (name, email, password, fitness_goal, is_online, avatar_url) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, randomHashedPw, defaultGoal, 1, picture]
      );

      const [newUsers] = await db.execute('SELECT * FROM users WHERE id = ?', [insertResult.insertId]);
      user = newUsers[0];
    } else {
      user = users[0];
      await db.execute('UPDATE users SET is_online = 1 WHERE id = ?', [user.id]);
    }

    setSessionCookie(res, user.id, user.email, req); // ✅ pass req

    res.json({
      id:     user.id,
      name:   user.name,
      email:  user.email,
      avatar: user.avatar_url || picture,
      goal:   user.fitness_goal,
    });
  } catch (err) {
    console.error('Backend Auth Error:', err);
    res.status(401).json({ message: 'Google authentication failed: ' + err.message });
  }
});

// ─────────────────────────────────────────────
//  POST /api/auth/logout
// ─────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await db.execute('UPDATE users SET is_online = 0 WHERE id = ?', [decoded.id]);
    } catch (_) {
      // Token invalid — still clear the cookie
    }
  }

  res.clearCookie(COOKIE_NAME, getCookieOptions(req)); // ✅ dynamic options, matches set
  res.json({ success: true, message: 'User logged out.' });
});

module.exports = router;