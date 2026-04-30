const express = require('express');
const router = express.Router();
const db = require('../config/db');
// Import both functions
const { callGeminiWithFallback, analyzeFoodImage } = require('../config/gemini');

// ── NEW ROUTE: POST /api/food-logs/analyze-pic ──────────────────────────
router.post('/analyze-pic', async (req, res) => {
    const { base64Image } = req.body; // Expecting base64 string from frontend

    if (!base64Image) {
        return res.status(400).json({ error: "No image provided" });
    }

    try {
        const aiRawResponse = await analyzeFoodImage(base64Image);
        
        // Clean and parse the JSON response
        const cleanJson = aiRawResponse.replace(/```json|```/g, "").trim();
        const data = JSON.parse(cleanJson);

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "AI failed to see the image" });
    }
});

// ── POST /api/food-logs/:userId ─ Save meal (YOUR EXISTING CODE) ────────
router.post('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { food_name, calories, protein, carbs, fat, image_url } = req.body;

    if (!food_name) return res.status(400).json({ error: 'food_name is required' });

    try {
        const [result] = await db.execute(
            `INSERT INTO food_logs (user_id, food_name, calories, protein, carbs, fat, image_url, logged_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [userId, food_name, calories || 0, protein || 0, carbs || 0, fat || 0, image_url || null]
        );
        res.status(200).json({ message: 'Food log saved', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// ── GET /api/food-logs/:userId ─ Fetch meals (YOUR EXISTING CODE) ───────
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const [rows] = await db.execute(
            `SELECT id, food_name, calories, protein, carbs, fat, image_url,
                    DATE_FORMAT(logged_at, '%Y-%m-%d %H:%i') AS logged_at
             FROM food_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );
        const [[{ total }]] = await db.execute(`SELECT COUNT(*) AS total FROM food_logs WHERE user_id = ?`, [userId]);
        res.json({ records: rows, total });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;