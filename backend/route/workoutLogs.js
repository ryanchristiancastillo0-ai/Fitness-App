const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');

const COOKIE_NAME = 'vitalis_session';

function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.clearCookie(COOKIE_NAME);
    return res.status(401).json({ message: 'Session expired' });
  }
}

router.post('/start', requireAuth, async (req, res) => {
  const { workout_type } = req.body;
  try {
    const [result] = await db.execute(
      `INSERT INTO workout_logs (user_id, workout_type, status)
       VALUES (?, ?, 'active')`,
      [req.user.id, workout_type ?? 'unknown']
    );
    const [[log]] = await db.execute(
      `SELECT id, start_time FROM workout_logs WHERE id = ?`,
      [result.insertId]
    );
    res.status(201).json({ session_id: log.id, start_time: log.start_time });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/end', requireAuth, async (req, res) => {
  const logId = parseInt(req.params.id, 10);
  const { status = 'completed', rep_count = 0 } = req.body;
  try {
    const [[existing]] = await db.execute(
      `SELECT id, status FROM workout_logs WHERE id = ? AND user_id = ?`,
      [logId, req.user.id]
    );
    if (!existing) return res.status(404).json({ message: 'Log not found' });
    if (existing.status !== 'active') return res.status(409).json({ message: `Already ${existing.status}` });

    await db.execute(
      `UPDATE workout_logs
          SET end_time = NOW(),
              status = ?,
              rep_count = ?,
              duration_seconds = TIMESTAMPDIFF(SECOND, start_time, NOW())
        WHERE id = ?`,
      [status, rep_count, logId]
    );

    const [[updated]] = await db.execute(
      `SELECT id, workout_type, rep_count, start_time, end_time, status, duration_seconds
         FROM workout_logs WHERE id = ?`,
      [logId]
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const [logs] = await db.execute(
      `SELECT id, workout_type, rep_count, start_time, end_time, status, duration_seconds
         FROM workout_logs
        WHERE user_id = ?
        ORDER BY start_time DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;