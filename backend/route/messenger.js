const express = require('express');
const router = express.Router();
const db = require('../config/db');

// --- FETCH ONLY FRIENDS ---
router.get('/contacts/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT u.id, u.name, u.avatar_url, u.is_online, u.fitness_goal
            FROM users u
            INNER JOIN friendships f ON (f.friend_id = u.id OR f.user_id = u.id)
            WHERE (f.user_id = ? OR f.friend_id = ?) 
            AND u.id != ?
        `;
        const [rows] = await db.execute(query, [userId, userId, userId]);
        res.json(rows);
    } catch (err) {
        console.error("Contacts Error:", err);
        res.status(500).json({ error: "Database Error fetching contacts" });
    }
});

// --- FETCH MESSAGE HISTORY ---
router.get('/messages/:userId/:contactId', async (req, res) => {
    const { userId, contactId } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT id, sender_id, receiver_id, content, latitude, longitude, is_read,
             DATE_FORMAT(sent_at, '%H:%i') as time,
             IF(sender_id = ?, 1, 0) as isMe
             FROM messages 
             WHERE (sender_id = ? AND receiver_id = ?) 
                OR (sender_id = ? AND receiver_id = ?)
             ORDER BY sent_at ASC`,
            [userId, userId, contactId, contactId, userId]
        );
        res.json(rows);
    } catch (err) {
        console.error("History Error:", err);
        res.status(500).json({ error: "Database Error fetching history" });
    }
});

// --- SEND MESSAGE (THIS WAS MISSING — caused the 404) ---
router.post('/messages', async (req, res) => {
    const { sender_id, receiver_id, content } = req.body;
    if (!sender_id || !receiver_id || !content?.trim()) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const [result] = await db.execute(
            `INSERT INTO messages (sender_id, receiver_id, content, sent_at, is_read)
             VALUES (?, ?, ?, NOW(), 0)`,
            [sender_id, receiver_id, content.trim()]
        );
        // Return the saved row so the frontend can replace the optimistic message
        const [rows] = await db.execute(
            `SELECT id, sender_id, receiver_id, content,
             DATE_FORMAT(sent_at, '%H:%i') as time,
             IF(sender_id = ?, 1, 0) as isMe
             FROM messages WHERE id = ?`,
            [sender_id, result.insertId]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error("Send Message Error:", err);
        res.status(500).json({ error: "Could not save message" });
    }
});

// --- SEARCH USERS ---
router.get('/users/search', async (req, res) => {
    const { query, excludeId } = req.query;
    if (!query?.trim()) return res.json([]);
    try {
        const [rows] = await db.execute(
            'SELECT id, name, avatar_url, is_online FROM users WHERE name LIKE ? AND id != ? LIMIT 10',
            [`%${query}%`, excludeId]
        );
        res.json(rows);
    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ error: "Search failed" });
    }
});

// --- ADD FRIEND ---
router.post('/friends/add', async (req, res) => {
    const { userId, friendId } = req.body;
    if (!userId || !friendId) {
        return res.status(400).json({ error: "Missing userId or friendId" });
    }
    try {
        await db.execute(
            'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, "close_friend") ON DUPLICATE KEY UPDATE status="close_friend"',
            [userId, friendId]
        );
        res.json({ success: true, message: "Added to Close Friends" });
    } catch (err) {
        console.error("Add Friend Error:", err);
        res.status(500).json({ error: "Could not add friend" });
    }
});

// --- AI CHAT (THIS WAS MISSING — caused the 404) ---
// NOTE: If your route/ai.js already has POST /api/ai-chat, delete this block
// and point the frontend to whichever URL that file exposes instead.
router.post('/ai-chat', async (req, res) => {
    const { message, userId } = req.body;
    if (!message?.trim()) {
        return res.status(400).json({ error: "Message is required" });
    }
    try {
        // Pull user context for a personalised system prompt
        let userContext = '';
        if (userId) {
            const [rows] = await db.execute(
                'SELECT name, fitness_goal FROM users WHERE id = ? LIMIT 1',
                [userId]
            );
            if (rows[0]) {
                userContext = `The user's name is ${rows[0].name}.`;
                if (rows[0].fitness_goal) {
                    userContext += ` Their fitness goal is: ${rows[0].fitness_goal}.`;
                }
            }
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-opus-4-5',
                max_tokens: 512,
                system: `You are Vitalis AI, an expert clinical and fitness advisor embedded in a health platform called Vitalis. You help users achieve their health and fitness goals with evidence-based, concise, motivating advice. ${userContext} Keep replies under 3 sentences unless the user explicitly asks for more detail. Be warm, professional, and direct.`,
                messages: [{ role: 'user', content: message.trim() }],
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Anthropic API error:', errText);
            return res.status(502).json({
                error: 'AI service unavailable',
                reply: 'Sorry, I am temporarily unavailable. Please try again shortly.',
            });
        }

        const data = await response.json();
        const reply = data?.content?.[0]?.text || 'I could not generate a response.';
        res.json({ reply });
    } catch (err) {
        console.error("AI Chat Error:", err);
        res.status(500).json({
            error: "AI pipeline failed",
            reply: "System Error: Unable to reach AI pipeline.",
        });
    }
});

module.exports = router;