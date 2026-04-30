const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ── IMPORTANT: Run this SQL once before using:
//   ALTER TABLE daily_stats ADD UNIQUE KEY unique_user_date (user_id, stat_date);
router.post('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { calories, steps, minutes } = req.body;

    console.log(`[LOGS] Received — userId:${userId} calories:${calories} steps:${steps} minutes:${minutes}`);

    try {
        const [result] = await db.execute(
            `INSERT INTO daily_stats (user_id, stat_date, calories_burned, steps, workout_duration_mins)
             VALUES (?, CURDATE(), ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
                 calories_burned       = calories_burned       + VALUES(calories_burned),
                 steps                 = steps                 + VALUES(steps),
                 workout_duration_mins = workout_duration_mins + VALUES(workout_duration_mins)`,
            [userId, parseInt(calories) || 0, parseInt(steps) || 0, parseInt(minutes) || 0]
        );
        console.log(`[LOGS] OK — affectedRows:${result.affectedRows}`);
        res.status(200).json({ message: "Activity logged successfully" });
    } catch (err) {
        console.error("[LOGS] DB Error:", err.message);
        res.status(500).json({ error: err.message });
    }
});


router.get('/history/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Fetching data from your existing 'workout_sessions' table
        const [rows] = await db.execute(
            `SELECT id, start_time, end_time, status 
             FROM workout_sessions 
             WHERE user_id = ? 
             ORDER BY start_time DESC 
             LIMIT 50`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error("History fetch error:", err.message);
        res.status(500).json({ error: "Failed to retrieve archives" });
    }
});

module.exports = router;