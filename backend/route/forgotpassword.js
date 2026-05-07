const express    = require('express');
const router     = express.Router();
const bcrypt     = require('bcryptjs');
const crypto     = require('crypto');
const nodemailer = require('nodemailer');
const db         = require('../config/db');

// ─────────────────────────────────────────────
//  EMAIL TRANSPORTER
//  Add to .env:
//    EMAIL_USER=yourgmail@gmail.com
//    EMAIL_PASS=your_gmail_app_password
//
//  Get app password:
//  Google Account → Security → 2-Step Verification → App Passwords
// ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─────────────────────────────────────────────
//  Run this SQL once in your database:
//
//  CREATE TABLE IF NOT EXISTS password_reset_otps (
//    id          INT AUTO_INCREMENT PRIMARY KEY,
//    user_id     INT NOT NULL,
//    otp_hash    VARCHAR(255) NOT NULL,
//    expires_at  DATETIME NOT NULL,
//    used        TINYINT(1) DEFAULT 0,
//    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
//    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
//  );
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
//  POST /api/forgot-password/send-otp
//  Step 1: User submits email → generate & send OTP
// ─────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const [users] = await db.execute(
      'SELECT id, name FROM users WHERE email = ?',
      [email]
    );

    // Always return success — never reveal if email exists
    if (users.length === 0) {
      return res.json({ success: true, message: 'If that email exists, a code was sent.' });
    }

    const user = users[0];

    // Invalidate any existing unused OTPs for this user
    await db.execute(
      'UPDATE password_reset_otps SET used = 1 WHERE user_id = ? AND used = 0',
      [user.id]
    );

    // Generate 6-digit OTP
    const otp       = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash   = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.execute(
      'INSERT INTO password_reset_otps (user_id, otp_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, otpHash, expiresAt]
    );

    // Send email
    await transporter.sendMail({
      from:    `"Vitalis" <${process.env.EMAIL_USER}>`,
      to:      email,
      subject: 'Your Vitalis Password Reset Code',
      html: `
        <div style="background:#0e0e0e;padding:40px 32px;font-family:'DM Sans',Arial,sans-serif;max-width:480px;margin:0 auto;border-radius:16px;border:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
            <div style="width:34px;height:34px;background:#c7f248;border-radius:8px;display:flex;align-items:center;justify-content:center;">
              <span style="color:#161f00;font-weight:900;font-size:16px;">V</span>
            </div>
            <span style="color:#e5e2e1;font-size:18px;font-weight:700;letter-spacing:0.1em;">VITALIS</span>
          </div>
          <h2 style="color:#e5e2e1;font-size:22px;margin:0 0 8px;font-weight:700;">Password Reset</h2>
          <p style="color:rgba(196,201,176,0.5);font-size:13px;margin:0 0 28px;line-height:1.6;">
            Hey ${user.name}, use the code below to reset your password. It expires in <strong style="color:#c7f248;">10 minutes</strong>.
          </p>
          <div style="background:rgba(199,242,72,0.06);border:1px solid rgba(199,242,72,0.15);border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
            <span style="font-size:42px;font-weight:900;letter-spacing:0.3em;color:#c7f248;">${otp}</span>
          </div>
          <p style="color:rgba(196,201,176,0.35);font-size:11px;text-align:center;margin:0;line-height:1.6;">
            If you didn't request this, you can safely ignore this email.<br/>
            Never share this code with anyone.
          </p>
        </div>
      `,
    });

    res.json({ success: true, message: 'If that email exists, a code was sent.' });

  } catch (err) {
    console.error('SEND OTP ERROR:', err);
    res.status(500).json({ message: 'Failed to send reset code.' });
  }
});

// ─────────────────────────────────────────────
//  POST /api/forgot-password/verify-otp
//  Step 2: Verify the 6-digit code
// ─────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and code are required.' });
  }

  try {
    const [users] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid code.' });
    }

    const user    = users[0];
    const otpHash = crypto.createHash('sha256').update(otp.toString()).digest('hex');

    const [otps] = await db.execute(
      `SELECT id FROM password_reset_otps
       WHERE user_id = ? AND otp_hash = ? AND used = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, otpHash]
    );

    if (otps.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired code.' });
    }

    // OTP is valid — swap it for a short-lived reset token (5 min)
    const resetToken     = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpiry    = new Date(Date.now() + 5 * 60 * 1000);

    await db.execute(
      'UPDATE password_reset_otps SET otp_hash = ?, expires_at = ? WHERE id = ?',
      [resetTokenHash, resetExpiry, otps[0].id]
    );

    res.json({ success: true, resetToken });

  } catch (err) {
    console.error('VERIFY OTP ERROR:', err);
    res.status(500).json({ message: 'Verification failed.' });
  }
});

// ─────────────────────────────────────────────
//  POST /api/forgot-password/reset-password
//  Step 3: Submit new password using reset token
// ─────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { email, resetToken, newPassword } = req.body;

  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  try {
    const [users] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid request.' });
    }

    const user      = users[0];
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const [otps] = await db.execute(
      `SELECT id FROM password_reset_otps
       WHERE user_id = ? AND otp_hash = ? AND used = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, tokenHash]
    );

    if (otps.length === 0) {
      return res.status(400).json({ message: 'Reset session expired. Please start over.' });
    }

    // Hash and update the new password
    const salt   = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id]);

    // Consume the reset token
    await db.execute(
      'UPDATE password_reset_otps SET used = 1 WHERE id = ?',
      [otps[0].id]
    );

    // Invalidate all active sessions — force re-login everywhere
    await db.execute(
      'UPDATE user_sessions SET is_current = 0 WHERE user_id = ?',
      [user.id]
    );

    res.json({ success: true, message: 'Password updated successfully.' });

  } catch (err) {
    console.error('RESET PASSWORD ERROR:', err);
    res.status(500).json({ message: 'Failed to reset password.' });
  }
});

module.exports = router;