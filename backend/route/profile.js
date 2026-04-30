const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT 
                u.name AS fullName, 
                u.email, 
                u.user_type,
                p.contact, 
                p.bio 
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE u.id = ?
        `;
        const [rows] = await db.execute(query, [userId]);
        if (rows.length === 0) return res.status(404).json({ error: "User not found" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Database fetch failed" });
    }
});

router.put('/update/:userId', async (req, res) => {
    const { userId } = req.params;
    const { fullName, contact, bio } = req.body;

    try {
        await db.execute('UPDATE users SET name = ? WHERE id = ?', [fullName, userId]);

        const profileQuery = `
            INSERT INTO user_profiles (user_id, contact, bio)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                contact = VALUES(contact), 
                bio = VALUES(bio)
        `;
        await db.execute(profileQuery, [userId, contact, bio]);

        res.json({ success: true, message: "Profile Synchronized" });
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
});

module.exports = router;