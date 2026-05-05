const express = require('express');
const router = express.Router();
const db = require('../config/db');
const notificationRouter = require('./notification');
const clients = notificationRouter.clients;
// Import both functions
const { callGeminiWithFallback, analyzeFoodImage } = require('../config/gemini');
   const { sendMealSummaryEmail } = require('../config/mailer');
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
        
        

        const [userRows] = await db.execute(
  'SELECT email FROM users WHERE id = ?',
  [userId]
  
);

const user = userRows[0];

const [summaryRows] = await db.execute(
  `SELECT 
    COALESCE(SUM(calories),0) as calories,
    COALESCE(SUM(protein),0) as protein,
    COALESCE(SUM(carbs),0) as carbs,
    COALESCE(SUM(fat),0) as fat
   FROM food_logs
   WHERE user_id = ? AND DATE(logged_at) = CURDATE()`,
  [userId]
);

const summary = summaryRows[0];

// Test 1 - email
if (user?.email) {
  try {
    await sendMealSummaryEmail(user.email, summary);
  } catch (mailErr) {
    console.error('❌ MAILER FAILED:', mailErr.message);
  }
}

// Test 2 - notification insert
try {
  const notifMessage = `Meal logged! Today: ${Math.round(summary.calories)} kcal | P: ${Math.round(summary.protein)}g | C: ${Math.round(summary.carbs)}g | F: ${Math.round(summary.fat)}g`;
  await db.execute(
    'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
    [userId, notifMessage]
  );

  // Test 3 - SSE push
  const client = clients.get(String(userId));
  if (client) {
    client.write(`data: ${JSON.stringify({ message: notifMessage, type: 'success' })}\n\n`);
  }
} catch (notifErr) {
  console.error('❌ NOTIFICATION FAILED:', notifErr.message);
}

res.status(200).json({ message: 'Food log saved', id: result.insertId });
        
    } catch (err) {
        console.error('FOOD LOG ERROR:', err.message);
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
        console.error('FOOD LOG ERROR:', err.message);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

module.exports = router;