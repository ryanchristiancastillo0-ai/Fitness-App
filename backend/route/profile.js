const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ─────────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────────
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    // Basic validation
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
        const query = `
            SELECT 
                u.name AS fullName, 
                u.email,
                p.contact, 
                p.bio 
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE u.id = ?
        `;

        const [rows] = await db.execute(query, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(rows[0]);

    } catch (err) {
        console.error("❌ PROFILE FETCH ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────
router.put('/update/:userId', async (req, res) => {
    const { userId } = req.params;
    const { fullName, contact, bio } = req.body;

    // Validation
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    if (!fullName) {
        return res.status(400).json({ error: "Full name is required" });
    }

    try {
        // Update users table
        await db.execute(
            'UPDATE users SET name = ? WHERE id = ?',
            [fullName, userId]
        );

        // Insert or update profile
        const profileQuery = `
            INSERT INTO user_profiles (user_id, contact, bio)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                contact = VALUES(contact), 
                bio = VALUES(bio)
        `;

        await db.execute(profileQuery, [
            userId,
            contact || null,
            bio || null
        ]);

        res.json({
            success: true,
            message: "Profile Synchronized"
        });

    } catch (err) {
        console.error("❌ PROFILE UPDATE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;