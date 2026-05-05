const express = require('express');
const router = express.Router();
const db = require('../config/db');

const clients = new Map();

// ✅ SSE stream route MUST be before /:userId or Express hijacks it
router.get('/stream/:userId', (req, res) => {
  const { userId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.set(String(userId), res);
  console.log(`User Connected: ${userId}`);

  req.on('close', () => {
    clients.delete(String(userId));
    console.log(`User Disconnected: ${userId}`);
  });
});

// GET notifications + count
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [[result]] = await db.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    const [notifications] = await db.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [userId]
    );
   
    res.json({ count: result.count, notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// CREATE notification
router.post('/', async (req, res) => {
  const { user_id, message, type = 'info' } = req.body;

  try {
    await db.execute(
      'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
      [user_id, message]
    );

    const client = clients.get(String(user_id));
    if (client) {
      client.write(`data: ${JSON.stringify({ message, type })}\n\n`);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark single notification as read
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all as read for a user
router.put('/read-all/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    await db.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.clients = clients;
module.exports = router;