const express = require('express');
const router = express.Router();
const db = require('../config/db');


// ======================================
// 🟢 SAVE ACTIVITY (FINISH RUN)
// ======================================
router.post('/save', async (req, res) => {
    const {
        userId,
        duration,
        distance,
        pace,
        calories,
        route
    } = req.body;

    try {
        await db.execute(
            `INSERT INTO activity_logs 
            (user_id, duration, distance, pace, calories, route)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                duration,
                distance,
                pace,
                calories,
                JSON.stringify(route)
            ]
        );

        res.json({
            success: true,
            message: 'Activity saved successfully'
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});


// ======================================
// 📊 GET USER SUMMARY STATS
// ✅ MUST be before /:userId — otherwise Express matches
//    /stats/1 as userId="stats" and this route never runs.
// ======================================
router.get('/stats/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const [rows] = await db.execute(
            `SELECT 
                COUNT(*)        AS totalRuns,
                SUM(distance)   AS totalDistance,
                SUM(duration)   AS totalDuration,
                SUM(calories)   AS totalCalories
             FROM activity_logs
             WHERE user_id = ?`,
            [userId]
        );

        res.json(rows[0]);

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});


// ======================================
// 📍 GET SINGLE ACTIVITY (DETAIL VIEW)
// ✅ Also before /:userId — same reason: /detail/5 would
//    match /:userId with userId="detail" if placed after.
// ======================================
router.get('/detail/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.execute(
            `SELECT * FROM activity_logs WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        const activity = rows[0];

        res.json({
            ...activity,
            route: JSON.parse(activity.route)
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});


// ======================================
// 📥 GET ALL ACTIVITIES (HISTORY)
// ✅ Kept last among GETs — it's a wildcard /:userId
//    and would swallow /stats and /detail if placed first.
// ======================================
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const [rows] = await db.execute(
            `SELECT * FROM activity_logs 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [userId]
        );

        const activities = rows.map(activity => ({
            ...activity,
            route: JSON.parse(activity.route)
        }));

        res.json(activities);

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});


// ======================================
// 🗑️ DELETE ACTIVITY
// ======================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await db.execute(
            `DELETE FROM activity_logs WHERE id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: 'Activity deleted'
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});


module.exports = router;