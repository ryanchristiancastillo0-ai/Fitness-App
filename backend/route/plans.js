const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/enroll', async (req, res) => {
    const { userId, planId } = req.body;
    try {
        await db.execute(
            `INSERT INTO user_plans (user_id, plan_id, enrolled_at) VALUES (?, ?, NOW())`,
            [userId, planId]
        );
        res.json({ success: true, message: "Blueprint added to your library" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "You already own this blueprint" });
        console.error("Enrollment Error:", err);
        res.status(500).json({ error: "Transaction failed" });
    }
});

router.post('/progress/complete', async (req, res) => {
    const { userId, planId, dayNumber } = req.body;
    try {
        await db.execute(
            `INSERT INTO user_plan_progress (user_id, plan_id, day_number, is_completed, completed_at)
             VALUES (?, ?, ?, 1, NOW())
             ON DUPLICATE KEY UPDATE is_completed = 1, completed_at = NOW()`,
            [userId, planId, dayNumber]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Complete Day Error:", err);
        res.status(500).json({ error: "Could not save progress" });
    }
});

router.get('/progress/:userId/:planId', async (req, res) => {
    const { userId, planId } = req.params;
    try {
        const [rows] = await db.execute(
            'SELECT day_number, is_completed FROM user_plan_progress WHERE user_id = ? AND plan_id = ?',
            [userId, planId]
        );
        res.json(rows);
    } catch (err) {
        console.error("Progress Fetch Error:", err);
        res.status(500).json({ error: "Could not fetch progress" });
    }
});

router.get('/content/:planId', async (req, res) => {
    const { planId } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT day_number, title, activity_type, description, duration_mins 
             FROM plan_contents WHERE plan_id = ? ORDER BY day_number ASC`,
            [planId]
        );
        res.json(rows);
    } catch (err) {
        console.error("Plan Content Error:", err);
        res.status(500).json({ error: "Failed to load plan schedule" });
    }
});

router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT p.*, IF(up.user_id IS NULL, 0, 1) as is_enrolled
             FROM plans p
             LEFT JOIN user_plans up ON p.id = up.plan_id AND up.user_id = ?
             ORDER BY p.id ASC`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error("Marketplace Fetch Error:", err);
        res.status(500).json({ error: "Failed to load blueprints" });
    }
});

module.exports = router;