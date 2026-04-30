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

// --- SEARCH USERS ---
router.get('/users/search', async (req, res) => {
    const { query, excludeId } = req.query;
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

module.exports = router;