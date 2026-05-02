const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ==============================
// 1. GET DOCTORS BY CATEGORY
// ==============================
router.get('/doctors/:category', async (req, res) => {
    const { category } = req.params;

    try {
        const [rows] = await db.execute(
            'SELECT * FROM doctors WHERE category = ?',
            [category]
        );

        res.json(rows);
    } catch (err) {
        console.error("Doctors error:", err.message);
        res.status(500).json({ error: err.message });
    }
});


// ==============================
// 2. CREATE / GET SESSION
// ==============================
router.post('/session', async (req, res) => {
    const { userId, doctorId } = req.body;

    try {
        // check if session already exists
        const [existing] = await db.execute(
            'SELECT id FROM chat_sessions WHERE user_id = ? AND doctor_id = ? ORDER BY id DESC LIMIT 1',
            [userId, doctorId]
        );

        if (existing.length > 0) {
            return res.json({ sessionId: existing[0].id });
        }

        // create new session
        const [result] = await db.execute(
            'INSERT INTO chat_sessions (user_id, doctor_id) VALUES (?, ?)',
            [userId, doctorId]
        );

        res.json({ sessionId: result.insertId });

    } catch (err) {
        console.error("Session error:", err.message);
        res.status(500).json({ error: err.message });
    }
});


// ==============================
// 3. SEND MESSAGE
// ==============================
router.post('/message', async (req, res) => {
    const { sessionId, message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        // save USER message
        await db.execute(
            'INSERT INTO clinic_messages (session_id, sender, message) VALUES (?, "user", ?)',
            [sessionId, message]
        );

        // 🔥 SIMPLE AI RESPONSE (replace later with Gemini)
        const aiReply = `Based on your input, I recommend monitoring your symptoms and maintaining a healthy routine.`;

        // save AI message
        await db.execute(
            'INSERT INTO clinic_messages (session_id, sender, message) VALUES (?, "ai", ?)',
            [sessionId, aiReply]
        );

        res.json({ reply: aiReply });

    } catch (err) {
        console.error("Message error:", err.message);
        res.status(500).json({ error: err.message });
    }
});


// ==============================
// 4. GET MESSAGES (CHAT HISTORY)
// ==============================
router.get('/messages/:sessionId', async (req, res) => {
    const { sessionId } = req.params;

    try {
        const [rows] = await db.execute(
            `SELECT sender, message, created_at 
             FROM clinic_messages 
             WHERE session_id = ? 
             ORDER BY created_at ASC`,
            [sessionId]
        );

        res.json(rows);

    } catch (err) {
        console.error("Fetch messages error:", err.message);
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;