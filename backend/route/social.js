const express = require('express');
const router = express.Router();
const db = require('../db');

// GET CHAT HISTORY
router.get('/messages/:userId/:friendId', async (req, res) => {
  const { userId, friendId } = req.params;
  try {
    const [messages] = await db.execute(
      `SELECT * FROM messages 
       WHERE (sender_id = ? AND receiver_id = ?) 
       OR (sender_id = ? AND receiver_id = ?) 
       ORDER BY sent_at ASC`,
      [userId, friendId, friendId, userId]
    );
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;