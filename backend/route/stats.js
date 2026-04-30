const express = require('express');
const router = express.Router();
const db = require('../db');

// GET DAILY STATS
router.get('/daily/:userId', async (req, res) => {
  const { userId } = req.params;
  const today = new Date().toISOString().slice(0, 10);

  try {
    const [stats] = await db.execute(
      'SELECT * FROM daily_stats WHERE user_id = ? AND stat_date = ?',
      [userId, today]
    );

    if (stats.length === 0) {
      // Return empty defaults if no data for today yet
      return res.json({ calories_burned: 0, steps: 0, workout_duration_mins: 0 });
    }

    res.json(stats[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;