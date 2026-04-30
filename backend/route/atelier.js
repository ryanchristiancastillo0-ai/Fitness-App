const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/summary/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [hrv]   = await db.execute(
            'SELECT hrv_value as bpm FROM biometric_logs WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 1',
            [userId]
        );
        const [stats] = await db.execute(
            'SELECT workout_duration_mins as sleep_mins FROM daily_stats WHERE user_id = ? AND stat_date = CURDATE()',
            [userId]
        );
        res.json({ bpm: hrv[0]?.bpm || 0, sleepMins: stats[0]?.sleep_mins || 462, isOnline: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;