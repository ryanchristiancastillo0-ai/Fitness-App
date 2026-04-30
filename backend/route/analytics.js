const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/summary/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT 
                (SELECT score FROM performance_logs WHERE user_id = ? AND metric_type = 'vo2_max' ORDER BY recorded_at DESC LIMIT 1) as vo2_max,
                (SELECT score FROM performance_logs WHERE user_id = ? AND metric_type = 'hrv' ORDER BY recorded_at DESC LIMIT 1) as hrv,
                (SELECT score FROM performance_logs WHERE user_id = ? AND metric_type = 'metabolic_stress' ORDER BY recorded_at DESC LIMIT 1) as stress`,
            [userId, userId, userId]
        );
        res.json(rows[0] || { vo2_max: 0, hrv: 0, stress: 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/zones/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT 
                CASE 
                    WHEN hrv_value >= 160 THEN 'Zone 5 (Anaerobic)'
                    WHEN hrv_value >= 140 THEN 'Zone 4 (Threshold)'
                    ELSE 'Zone 2 (Aerobic Base)'
                END as label,
                COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as value
            FROM biometric_logs 
            WHERE user_id = ? AND recorded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY label`, [userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/vo2/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT score as value, DATE_FORMAT(recorded_at, '%m/%d') as date 
             FROM performance_logs 
             WHERE user_id = ? AND metric_type = 'vo2_max' 
             ORDER BY recorded_at ASC LIMIT 7`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;