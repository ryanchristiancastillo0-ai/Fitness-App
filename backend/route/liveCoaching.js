const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ── POST /api/live-coaching/sessions/:userId ─ Start / save a session ────────
// Body: { exercise_type, started_at }
router.post('/sessions/:userId', async (req, res) => {
    const { userId } = req.params;
    const { exercise_type, started_at } = req.body;

    if (!exercise_type) return res.status(400).json({ error: 'exercise_type is required' });

    try {
        const [result] = await db.execute(
            `INSERT INTO coaching_sessions (user_id, exercise_type, started_at)
             VALUES (?, ?, ?)`,
            [userId, exercise_type, started_at || new Date()]
        );
        res.status(201).json({ message: 'Session started', session_id: result.insertId });
    } catch (err) {
        console.error('[COACHING] Start session error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── PATCH /api/live-coaching/sessions/:sessionId/end ─ End a session ─────────
// Body: { ended_at, total_reps, avg_alignment, avg_velocity, avg_symmetry }
router.patch('/sessions/:sessionId/end', async (req, res) => {
    const { sessionId } = req.params;
    const { ended_at, total_reps, avg_alignment, avg_velocity, avg_symmetry } = req.body;

    try {
        const [result] = await db.execute(
            `UPDATE coaching_sessions
             SET ended_at      = ?,
                 total_reps    = ?,
                 avg_alignment = ?,
                 avg_velocity  = ?,
                 avg_symmetry  = ?,
                 duration_secs = TIMESTAMPDIFF(SECOND, started_at, ?)
             WHERE id = ?`,
            [
                ended_at    || new Date(),
                total_reps  || 0,
                avg_alignment ?? null,
                avg_velocity  ?? null,
                avg_symmetry  ?? null,
                ended_at    || new Date(),
                sessionId,
            ]
        );

        if (result.affectedRows === 0)
            return res.status(404).json({ error: 'Session not found' });

        res.json({ message: 'Session ended', session_id: Number(sessionId) });
    } catch (err) {
        console.error('[COACHING] End session error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/live-coaching/sessions/:sessionId/reps ─ Log a single rep ──────
// Body: { rep_number, feedback_text, alignment, velocity, symmetry }
router.post('/sessions/:sessionId/reps', async (req, res) => {
    const { sessionId } = req.params;
    const { rep_number, feedback_text, alignment, velocity, symmetry } = req.body;

    try {
        const [result] = await db.execute(
            `INSERT INTO coaching_reps
                 (session_id, rep_number, feedback_text, alignment, velocity, symmetry, logged_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
                sessionId,
                rep_number   || 0,
                feedback_text || null,
                alignment     ?? null,
                velocity      ?? null,
                symmetry      ?? null,
            ]
        );
        res.status(201).json({ message: 'Rep logged', rep_id: result.insertId });
    } catch (err) {
        console.error('[COACHING] Log rep error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/live-coaching/sessions/:userId ─ All sessions for a user ─────────
// Query params: ?limit=10&offset=0
router.get('/sessions/:userId', async (req, res) => {
    const { userId } = req.params;
    const limit  = parseInt(req.query.limit)  || 10;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const [rows] = await db.execute(
            `SELECT
                 id,
                 exercise_type,
                 started_at,
                 ended_at,
                 duration_secs,
                 total_reps,
                 avg_alignment,
                 avg_velocity,
                 avg_symmetry,
                 DATE_FORMAT(started_at, '%Y-%m-%d %H:%i') AS started_label
             FROM coaching_sessions
             WHERE user_id = ?
             ORDER BY started_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [[{ total }]] = await db.execute(
            `SELECT COUNT(*) AS total FROM coaching_sessions WHERE user_id = ?`,
            [userId]
        );

        res.json({ records: rows, total });
    } catch (err) {
        console.error('[COACHING] Fetch sessions error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/live-coaching/sessions/:sessionId/reps ─ Reps for a session ──────
router.get('/sessions/:sessionId/reps', async (req, res) => {
    const { sessionId } = req.params;

    try {
        const [rows] = await db.execute(
            `SELECT
                 id,
                 rep_number,
                 feedback_text,
                 alignment,
                 velocity,
                 symmetry,
                 DATE_FORMAT(logged_at, '%H:%i:%s') AS logged_at
             FROM coaching_reps
             WHERE session_id = ?
             ORDER BY rep_number ASC`,
            [sessionId]
        );
        res.json({ reps: rows, total: rows.length });
    } catch (err) {
        console.error('[COACHING] Fetch reps error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/live-coaching/summary/:userId/:date ─ Daily coaching summary ─────
router.get('/summary/:userId/:date', async (req, res) => {
    const { userId, date } = req.params;

    try {
        const [rows] = await db.execute(
            `SELECT
                 COUNT(*)            AS total_sessions,
                 SUM(total_reps)     AS total_reps,
                 SUM(duration_secs)  AS total_duration_secs,
                 AVG(avg_alignment)  AS avg_alignment,
                 AVG(avg_velocity)   AS avg_velocity,
                 AVG(avg_symmetry)   AS avg_symmetry
             FROM coaching_sessions
             WHERE user_id = ? AND DATE(started_at) = ?`,
            [userId, date]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error('[COACHING] Daily summary error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;