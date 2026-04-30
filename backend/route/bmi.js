const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ── BMI category helper ────────────────────────────────────────────────────
const getBmiCategory = (bmi) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25.0) return 'Normal';
    if (bmi < 30.0) return 'Overweight';
    return 'Obese';
};

// ── POST  /api/bmi/:userId  ─  Save a new BMI record ──────────────────────
router.post('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { weight_kg, height_cm } = req.body;

    if (!weight_kg || !height_cm) {
        return res.status(400).json({ error: 'weight_kg and height_cm are required' });
    }

    const heightM = parseFloat(height_cm) / 100;
    const bmi     = parseFloat((parseFloat(weight_kg) / (heightM * heightM)).toFixed(2));
    const category = getBmiCategory(bmi);

    try {
        const [result] = await db.execute(
            `INSERT INTO bmi_records (user_id, weight_kg, height_cm, bmi, bmi_category, recorded_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [userId, parseFloat(weight_kg), parseFloat(height_cm), bmi, category]
        );
        console.log(`[BMI] Saved — userId:${userId} bmi:${bmi} category:${category}`);
        res.status(200).json({ message: 'BMI saved', id: result.insertId, bmi, category });
    } catch (err) {
        console.error('[BMI] Insert Error:', err.message);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// ── GET  /api/bmi/:userId  ─  Fetch BMI history (paginated) ───────────────
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    const limit  = parseInt(req.query.limit)  || 10;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const [rows] = await db.execute(
            `SELECT id, weight_kg, height_cm, bmi, bmi_category,
                    DATE_FORMAT(recorded_at, '%Y-%m-%d %H:%i') AS recorded_at
             FROM bmi_records
             WHERE user_id = ?
             ORDER BY recorded_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );

        const [[{ total }]] = await db.execute(
            `SELECT COUNT(*) AS total FROM bmi_records WHERE user_id = ?`,
            [userId]
        );

        res.json({ records: rows, total });
    } catch (err) {
        console.error('[BMI] Fetch Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;