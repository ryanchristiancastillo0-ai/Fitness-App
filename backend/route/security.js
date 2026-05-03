const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyUser = require('../middleware/verifyUser');

/* ─────────────────────────────────────────────
   GET ALL SECURITY SESSIONS (FOR UI)
──────────────────────────────────────────── */
console.log("verifyUser type:", typeof verifyUser);
router.get('/', verifyUser, async (req, res) => {
    const userId = req.user.id;

    try {
        const [rows] = await db.execute(`
            SELECT 
                id,
                device,
                browser,
                os,
                ip_address,
                location,
                last_active,
                is_current
            FROM user_sessions
            WHERE user_id = ?
            ORDER BY last_active DESC
        `, [userId]);

        res.json(rows);

    } catch (err) {
        console.error("❌ FETCH SESSIONS ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});


/* ─────────────────────────────────────────────
   DELETE A SPECIFIC SESSION
──────────────────────────────────────────── */
router.delete('/:sessionId', verifyUser, async (req, res) => {
    const userId = req.user.id;
    const sessionId = req.params.sessionId;

    try {
        await db.execute(`
            DELETE FROM user_sessions 
            WHERE id = ? AND user_id = ?
        `, [sessionId, userId]);

        res.json({
            success: true,
            message: "Session removed"
        });

    } catch (err) {
        console.error("❌ DELETE SESSION ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;