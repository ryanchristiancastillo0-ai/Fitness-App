const express = require('express');
const router = express.Router();
const db = require('../config/db');

// --- WRITE SLEEP LOG ---
router.post('/:userId', async (req, res) => {
  const { userId } = req.params;

  let {
    sleep_duration,
    sleep_quality,
    recovery_score,
    water_intake_ml
  } = req.body;

  try {
    await db.execute(
      `INSERT INTO sleep_logs 
      (user_id, sleep_duration, sleep_quality, recovery_score, water_intake_ml)
      VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        Number(sleep_duration) || 0,
        Number(sleep_quality) || 0,
        Number(recovery_score) || 0,
        Number(water_intake_ml) || 0
      ]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- GET TODAY'S LATEST SLEEP LOG ---
router.get('/:userId/today', async (req, res) => {
    const { userId } = req.params;

    try {
    const [rows] = await db.execute(
    `SELECT sleep_duration, sleep_quality, recovery_score, water_intake_ml, recorded_at
     FROM sleep_logs
     WHERE user_id = ?
     AND sleep_duration > 0
     ORDER BY recorded_at DESC
     LIMIT 1`,
    [userId]
);

        res.json(rows[0] || null);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// --- SLEEP DATA GRAPH ---
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { range = 'D', metric = 'duration' } = req.query;
    const interval = range === 'W' ? '7 DAY' : range === 'M' ? '30 DAY' : '1 DAY';
    const METRIC_MAP = { duration: 'sleep_duration', quality: 'sleep_quality', recovery: 'recovery_score' };
    const column = METRIC_MAP[metric] ?? 'sleep_duration';

    try {
        const isDaily = range === 'D';
        const labelFormat   = isDaily ? '%H:%i' : '%m/%d';
        const groupByClause = isDaily ? 'recorded_at' : 'DATE(recorded_at)';

        const [rows] = await db.execute(
            `SELECT DATE_FORMAT(recorded_at, '${labelFormat}') AS label, 
                    ${isDaily ? `${column}` : `AVG(${column})`} AS value
             FROM sleep_logs
             WHERE user_id = ? 
               AND recorded_at >= DATE_SUB(NOW(), INTERVAL ${interval})
               AND ${column} > 0
             GROUP BY ${groupByClause}
             ORDER BY recorded_at ASC`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SLEEP ANALYSIS GRAPH ENDPOINT ---
router.get('/:userId/analysis', async (req, res) => {
    const { userId } = req.params;
    const { range = 'D', metric = 'sleep_hours' } = req.query;

    const ANALYSIS_MAP = {
        sleep_hours:    'sleep_duration',
        recovery_score: 'recovery_score',
        efficiency:     'sleep_quality',
    };

    const column   = ANALYSIS_MAP[metric] || 'sleep_duration';
    const interval = range === 'W' ? '7 DAY' : range === 'M' ? '30 DAY' : '1 DAY';

    try {
        const isDaily     = range === 'D';
        const labelFormat = isDaily ? '%H:%i' : (range === 'W' ? '%a' : '%m/%d');

        const [rows] = await db.execute(
            `SELECT DATE_FORMAT(recorded_at, '${labelFormat}') AS label, 
                    AVG(${column}) AS value
             FROM sleep_logs
             WHERE user_id = ? 
               AND recorded_at >= DATE_SUB(NOW(), INTERVAL ${interval})
             GROUP BY ${isDaily ? 'HOUR(recorded_at)' : 'DATE(recorded_at)'}
             ORDER BY recorded_at ASC`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('[Analysis Graph] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- SCATTER: Sleep Duration vs Quality ---
router.get('/:userId/scatter', async (req, res) => {
    const { userId } = req.params;
    const { timeframe = 'weekly' } = req.query;

    const intervalMap = {
        weekly:    '7 DAY',
        monthly:   '30 DAY',
        quarterly: '90 DAY',
    };
    const interval = intervalMap[timeframe] || '7 DAY';

    try {
        const [rows] = await db.execute(
            `SELECT 
               sleep_duration,
               sleep_quality,
               recovery_score,
               DATE_FORMAT(recorded_at, '%Y-%m-%d %H:%i') AS recorded_at
             FROM sleep_logs
             WHERE user_id = ?
               AND recorded_at >= DATE_SUB(NOW(), INTERVAL ${interval})
               AND sleep_duration > 0
               AND sleep_quality  > 0
             ORDER BY recorded_at ASC`,
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('[Scatter] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;