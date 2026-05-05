const express = require('express');
const router  = express.Router();
const { callGeminiWithFallback } = require('../config/gemini'); // adjust path if needed

router.post('/', async (req, res) => {
  const { prompt, system } = req.body;
  try {
    const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;
    const text = await callGeminiWithFallback(fullPrompt);
    res.json({ text: text?.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;