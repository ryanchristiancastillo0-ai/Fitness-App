// routes/workout.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/save-session/:userId', async (req, res) => {
    const { userId } = req.params;
    const { 
        reps, 
        alignment, 
        velocity, 
        symmetry 
    } = req.body;

    try {
        const [result] = await db.execute(
            `INSERT INTO workout_sessions 
            (user_id, workout_label, reps, alignment, velocity, symmetry, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
                userId, 
                'Live Coached Session', // Generic label since coach chooses workout
                reps || 0, 
                alignment || 0, 
                velocity || 0, 
                symmetry || 0
            ]
        );

        res.status(201).json({ 
            message: 'Coaching session saved successfully', 
            sessionId: result.insertId 
        });
    } catch (err) {
        console.error('Error saving coaching session:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;