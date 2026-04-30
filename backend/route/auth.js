const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { OAuth2Client } = require('google-auth-library');

// At the top of auth.js
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

// REGISTER ROUTE
router.post('/register', async (req, res) => {
    const { name, email, password, fitness_goal } = req.body;

    try {
        const [existing] = await db.execute('SELECT email FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: "Email already registered in Vitalis labs." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash(password, salt);

        await db.execute(
            'INSERT INTO users (name, email, password, fitness_goal, is_online) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPw, fitness_goal, 0]
        );

        res.status(201).json({ success: true, message: "Identity created." });
    } catch (err) {
        res.status(500).json({ error: "Database rejection: " + err.message });
    }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        await db.execute('UPDATE users SET is_online = 1 WHERE id = ?', [user.id]);

        // ✅ JWT TOKEN ADDED
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar_url,
            goal: user.fitness_goal,
            token
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error during initialization" });
    }
});

// UPDATED: GOOGLE LOGIN ROUTE with Time Skew Fix
router.post('/google-login', async (req, res) => {
    const { code } = req.body; 

    try {
        // 1. Exchange the code for actual user tokens
        const { tokens } = await googleClient.getToken({
            code: code,
            redirect_uri: 'postmessage' 
        });

        // 2. Extract user info from the identity token
        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
            maxAllowedTimeSkewInSeconds: 50 
        });
        
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        // 3. Check if user exists in database
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        let user;

        if (users.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const randomHashedPw = await bcrypt.hash(Math.random().toString(36).slice(-10), salt);
            const defaultGoal = "Unspecified (Google Auth)";

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

        // ✅ JWT ADDED HERE
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar_url || picture,
            goal: user.fitness_goal,
            token
        });

    } catch (err) {
        console.error("Backend Auth Error:", err);
        res.status(401).json({ message: "Google authentication failed: " + err.message });
    }
});

// LOGOUT ROUTE
router.post('/logout', async (req, res) => {
    const { id } = req.body;

    try {
        await db.execute('UPDATE users SET is_online = 0 WHERE id = ?', [id]);
        res.json({ success: true, message: "User logged out." });
    } catch (err) {
        res.status(500).json({ error: "Logout failed: " + err.message });
    }
});

module.exports = router;