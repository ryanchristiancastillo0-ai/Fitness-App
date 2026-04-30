const express = require('express');
const router = express.Router();
const db = require('../config/db');

// --- YOUR ORIGINAL DASHBOARD ROUTE ---
router.get('/dashboard/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [stats] = await db.execute(
            `SELECT calories_burned, steps, workout_duration_mins, water_intake_ml 
             FROM daily_stats 
             WHERE user_id = ? AND stat_date = CURDATE()`,
            [userId]
        );
        const [user] = await db.execute(
            `SELECT u.name, u.fitness_goal, u.avatar_url, s.dark_mode 
             FROM users u 
             LEFT JOIN user_settings s ON u.id = s.user_id 
             WHERE u.id = ?`,
            [userId]
        );
        const [sleepData] = await db.execute(
            `SELECT DATE_FORMAT(recorded_at, '%H:%i') AS label, AVG(sleep_duration) AS value
             FROM sleep_logs
             WHERE user_id = ? AND DATE(recorded_at) = CURDATE()
             GROUP BY label ORDER BY label ASC LIMIT 20`,
            [userId]
        );
        res.json({
            stats:    stats[0]  || { calories_burned: 0, steps: 0, workout_duration_mins: 0, water_intake_ml: 0 },
            profile:  user[0]   || { name: "Guest" },
            hrv_data: sleepData || []
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- NEW: SEARCH ROUTE (For Topbar Search) ---
router.get('/search', async (req, res) => {
    const { q } = req.query; // Search term
    try {
        // Search for other users or fitness goals
        const [results] = await db.execute(
            'SELECT name, avatar_url FROM users WHERE name LIKE ? LIMIT 5',
            [`%${q}%`]
        );
        res.json(results);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- NEW: NOTIFICATIONS ROUTE ---
router.get('/notifications/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Just getting a count for the Topbar badge for now
        const [notifs] = await db.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        res.json({ count: notifs[0].count });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;