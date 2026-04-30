const express = require('express');
const router = express.Router();
const db = require('../config/db');

// --- WRITE SLEEP LOG ---
router.post('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { sleep_duration, sleep_quality, recovery_score, water_intake_ml } = req.body;

    console.log(`[SLEEP] Received — userId:${userId} water:${water_intake_ml} sleep:${sleep_duration}`);

    try {
        const [result] = await db.execute(
            `INSERT INTO sleep_logs (user_id, sleep_duration, sleep_quality, recovery_score, water_intake_ml, recorded_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [
                userId,
                parseFloat(sleep_duration) || 0,
                parseInt(sleep_quality)    || 0,
                parseInt(recovery_score)   || 0,
                parseInt(water_intake_ml)  || 0
            ]
        );
        console.log(`[SLEEP] OK — insertId:${result.insertId}`);
        res.status(200).json({ message: 'Log saved successfully', id: result.insertId });
    } catch (err) {
        console.error('[SLEEP] Insert Error:', err.message);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// --- GET TODAY'S LATEST SLEEP LOG ---
router.get('/:userId/today', async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT sleep_duration, sleep_quality, recovery_score, water_intake_ml, recorded_at
             FROM sleep_logs
             WHERE user_id = ? AND DATE(recorded_at) = CURDATE()
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
        const labelFormat   = isDaily ? '%H:%i'   : '%m/%d';
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


// ==========================================
// ACTIVITY GRAPH ENDPOINT
// Serves calories/steps/workout data for the chart.
// Add this to server.js BEFORE the wildcard /api/plans/:userId route.
//
// Metric keys match what SleepHoursGraph sends:
//   calories_burned | steps | workout_duration_mins
//
// Range:
//   D = today's rows grouped by hour
//   W = last 7 days grouped by date
//   M = last 30 days grouped by date
// ==========================================
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { range = 'D', metric = 'calories_burned' } = req.query;

    const ALLOWED_METRICS = ['calories_burned', 'steps', 'workout_duration_mins'];
    if (!ALLOWED_METRICS.includes(metric)) {
        return res.status(400).json({ error: 'Invalid metric' });
    }

    try {
        let query;

        if (range === 'D') {
            // Today — group by hour
            query = `
                SELECT
                    DATE_FORMAT(CONCAT(stat_date, ' 00:00:00'), '%H:%i') AS label,
                    ${metric} AS value
                FROM daily_stats
                WHERE user_id = ? AND stat_date = CURDATE()
                ORDER BY stat_date ASC
            `;
        } else if (range === 'W') {
            // Last 7 days — one row per day
            query = `
                SELECT
                    DATE_FORMAT(stat_date, '%a') AS label,
                    SUM(${metric})               AS value
                FROM daily_stats
                WHERE user_id = ? AND stat_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY stat_date
                ORDER BY stat_date ASC
            `;
        } else {
            // Last 30 days — one row per day
            query = `
                SELECT
                    DATE_FORMAT(stat_date, '%m/%d') AS label,
                    SUM(${metric})                  AS value
                FROM daily_stats
                WHERE user_id = ? AND stat_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY stat_date
                ORDER BY stat_date ASC
            `;
        }

        const [rows] = await db.execute(query, [userId]);
        res.json(rows);
    } catch (err) {
        console.error('[Activity Graph] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});


// --- NEW: SLEEP ANALYSIS GRAPH ENDPOINT ---
// Used for the second card (Sleep Analysis)
router.get('/:userId/analysis', async (req, res) => {
    const { userId } = req.params;
    const { range = 'D', metric = 'sleep_hours' } = req.query;
    
    // Map metric keys to database columns
    const ANALYSIS_MAP = {
        sleep_hours: 'sleep_duration',
        recovery_score: 'recovery_score',
        efficiency: 'sleep_quality' // Mapping efficiency to quality for analysis logic
    };
    
    const column = ANALYSIS_MAP[metric] || 'sleep_duration';
    const interval = range === 'W' ? '7 DAY' : range === 'M' ? '30 DAY' : '1 DAY';

    try {
        const isDaily = range === 'D';
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

// --- SCATTER: Sleep Duration vs Quality (for scatter chart) ---
router.get('/:userId/scatter', async (req, res) => {
  const { userId } = req.params;
  const { timeframe = 'weekly' } = req.query;

  const intervalMap = {
    weekly: '7 DAY',
    monthly: '30 DAY',
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
         AND sleep_quality > 0
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