const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { genAI, callGeminiWithFallback } = require('../config/gemini');

// --- POSE ANALYSIS ---
router.post('/analyze-pose', async (req, res) => {
    try {
        const { image, metadata } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            Context: The user is exercising. 
            Skeletal Data: ${metadata}
            Task: Using the image and the skeletal data, give a 1-sentence coach's correction. 
            If the form is perfect, say something encouraging. 
            Be very concise.
        `;
        const imageParts = [{ inlineData: { data: image.split(',')[1], mimeType: "image/jpeg" } }];
        const result = await model.generateContent([prompt, ...imageParts]);
        res.json({ suggestion: result.response.text() });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: "AI Pipeline Offline" });
    }
});

// --- AI CHATBOT ---
router.post('/ai-chat', async (req, res) => {
    const { message, userId } = req.body;
    if (!message?.trim()) {
        return res.status(400).json({ reply: "Message cannot be empty." });
    }
    const systemPrompt = `
        Identity: You are Vitalis AI, a specialized Fitness and Health Assistant.
        Rules: 
        1. ONLY discuss fitness, health, and nutrition.
        2. Answer general greetings (Hi, Hello) and the date briefly.
        3. REJECT any questions about CODING, PROGRAMMING, or MATH.
        4. Keep replies concise (2-4 sentences) unless asked for detail.
        5. Use an encouraging, professional tone like a knowledgeable personal trainer.
        Current Date: ${new Date().toLocaleDateString()}
        User message: "${message}"
    `;
    try {
        const reply = await callGeminiWithFallback(systemPrompt);
        res.json({ reply });
    } catch (err) {
        console.error("[/api/ai-chat] Fatal:", err.message);
        res.status(500).json({ reply: "All clinical modules are offline. Please check your internet or API quota." });
    }
});

// --- CLINICAL ANALYSIS ---
router.post('/ai/clinical-analysis', async (req, res) => {
    const { userId, stats } = req.body;

    try {
        // 1. Fetch User Profile (name + fitness goal for personalization)
        const [userRows] = await db.execute(
            'SELECT name, fitness_goal FROM users WHERE id = ? LIMIT 1',
            [userId]
        );
        const user = userRows[0] || { name: 'Athlete', fitness_goal: 'general fitness' };
        const firstName = user.name ? user.name.split(' ')[0] : 'Athlete';

        // 2. Fetch Sleep Data
        const [sleepRows] = await db.execute(
            'SELECT sleep_duration, sleep_quality, water_intake_ml FROM sleep_logs WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 1',
            [userId]
        );
        const sleep = sleepRows[0] || { sleep_duration: 0, sleep_quality: 0, water_intake_ml: 0 };

        // 3. Fallback Logic: Use fresh stats from frontend, else hit DB
        const activity = {
            calories_burned:       stats?.calories_burned       ?? 0,
            steps:                 stats?.steps                 ?? 0,
            workout_duration_mins: stats?.workout_duration_mins ?? 0,
        };

        if (!stats || Object.keys(stats).length === 0) {
            const [activityRows] = await db.execute(
                'SELECT calories_burned, steps, workout_duration_mins FROM daily_stats WHERE user_id = ? ORDER BY stat_date DESC LIMIT 1',
                [userId]
            );
            if (activityRows[0]) {
                activity.calories_burned       = activityRows[0].calories_burned;
                activity.steps                 = activityRows[0].steps;
                activity.workout_duration_mins = activityRows[0].workout_duration_mins;
            }
        }

        // 4. Generate Signature (include firstName so cache is user-specific)
        const signature = `s${sleep.sleep_duration}-q${sleep.sleep_quality}-w${sleep.water_intake_ml}-c${activity.calories_burned}-st${activity.steps}-m${activity.workout_duration_mins}-u${userId}`;

        // 5. Check Cache
        const [cached] = await db.execute(
            'SELECT sleep_suggestion, activity_suggestion FROM ai_insight_cache WHERE user_id = ? AND data_signature = ? LIMIT 1',
            [userId, signature]
        );

        if (cached.length > 0) {
            console.log(`[VITALIS AI] Cache HIT for user ${userId}`);
            return res.json({
                insights: [
                    { id: `sleep-${Date.now()}`,    ...JSON.parse(cached[0].sleep_suggestion) },
                    { id: `activity-${Date.now()}`, ...JSON.parse(cached[0].activity_suggestion) }
                ],
                fromCache: true
            });
        }

        console.log(`[VITALIS AI] Cache MISS for user ${userId} — calling Gemini`);

        // 6. Derive contextual flags for richer prompting
        const waterGlass        = Math.round(sleep.water_intake_ml / 250);  // ~250ml per glass
        const sleepStatus       = sleep.sleep_duration >= 7 ? 'adequate' : sleep.sleep_duration >= 5 ? 'below optimal' : 'critically low';
        const qualityStatus     = sleep.sleep_quality  >= 7 ? 'excellent' : sleep.sleep_quality  >= 5 ? 'fair' : 'poor';
        const stepGoalPercent   = Math.round((activity.steps / 10000) * 100);
        const calorieStatus     = activity.calories_burned >= 500 ? 'strong' : activity.calories_burned >= 200 ? 'moderate' : 'low';
        const workoutStatus     = activity.workout_duration_mins >= 45 ? 'solid session' : activity.workout_duration_mins >= 20 ? 'light session' : 'minimal activity';
        const hydrationStatus   = sleep.water_intake_ml >= 2500 ? 'well-hydrated' : sleep.water_intake_ml >= 1500 ? 'approaching goal' : 'under-hydrated';
        const todayDate         = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

        // 7. Prompt Construction — detailed, personalized, clinical tone
        const prompt = `
You are Vitalis AI, a professional health intelligence assistant embedded in a fitness dashboard.
Your job is to give ${firstName} a personalized, specific, and motivating clinical insight — not generic advice.

PATIENT PROFILE:
- Name: ${firstName}
- Fitness Goal: ${user.fitness_goal || 'general fitness'}
- Date: ${todayDate}

BIOMETRIC DATA:
Sleep & Recovery:
  - Sleep Duration:  ${sleep.sleep_duration} hours (${sleepStatus})
  - Sleep Quality:   ${sleep.sleep_quality}/10 (${qualityStatus})
  - Water Intake:    ${sleep.water_intake_ml} ml (~${waterGlass} glasses, ${hydrationStatus})

Daily Activity:
  - Calories Burned: ${activity.calories_burned} kcal (${calorieStatus} output)
  - Steps:           ${activity.steps} steps (${stepGoalPercent}% of 10,000 goal)
  - Workout:         ${activity.workout_duration_mins} mins (${workoutStatus})

INSTRUCTIONS:
1. Address ${firstName} by name naturally in each message — not robotically.
2. Reference their EXACT numbers in the advice (e.g., "your ${sleep.sleep_duration} hours", "those ${activity.steps} steps").
3. Each message must be 2–3 sentences. Be specific, clinical, and actionable — never vague.
4. Choose the trend ("up", "down", "stable") based on whether the metric is improving, declining, or neutral.
5. For sleep_suggestion: focus on sleep quality, recovery, and hydration relative to their numbers.
6. For activity_suggestion: focus on workout output, step count, and calorie burn relative to their goal.
7. Tone: professional health coach — warm but data-driven. Like a doctor who actually cares.
8. NEVER say "great job" or "keep it up" as opening words. Start with ${firstName}'s name or an observation.

RESPONSE FORMAT (strict JSON only, no markdown, no extra text):
{
  "sleep_suggestion": {
    "message": "...",
    "category": "Rest Advisory",
    "trend": "up|down|stable"
  },
  "activity_suggestion": {
    "message": "...",
    "category": "Performance Tip",
    "trend": "up|down|stable"
  }
}`.trim();

        const raw = await callGeminiWithFallback(prompt);

        if (!raw || typeof raw !== 'string') {
            throw new Error("Invalid or empty response from AI Fallback Engine");
        }

        const cleaned  = raw.replace(/```json|```/gi, '').trim();
        const aiResult = JSON.parse(cleaned);

        // 8. Update Cache
        if (aiResult?.sleep_suggestion && aiResult?.activity_suggestion) {
            await db.execute(
                `INSERT INTO ai_insight_cache (user_id, data_signature, sleep_suggestion, activity_suggestion)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   sleep_suggestion    = VALUES(sleep_suggestion),
                   activity_suggestion = VALUES(activity_suggestion),
                   created_at          = NOW()`,
                [userId, signature, JSON.stringify(aiResult.sleep_suggestion), JSON.stringify(aiResult.activity_suggestion)]
            );
        }

        res.json({
            insights: [
                { id: `sleep-${Date.now()}`,    ...aiResult.sleep_suggestion },
                { id: `activity-${Date.now()}`, ...aiResult.activity_suggestion }
            ],
            fromCache: false
        });

    } catch (err) {
        console.error("AI Logic Error:", err);
        res.status(500).json({ error: "AI calculation failed" });
    }
});
// --- AI WORKOUT COACH ---
router.post('/ai/coach', async (req, res) => {
    const { landmarks, workoutType } = req.body;
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
        const prompt = `
            You are a real-time gym coach. Analyze these landmarks for a ${workoutType.toUpperCase()} set.
            Landmarks: ${JSON.stringify(landmarks)}
            Give ONE technical tip (max 10 words). 
            - If PUSHUP: focus on "flat back" or "elbow angle".
            - If SQUAT: focus on "depth" or "weight on heels".
            - If PLANK: focus on "hips height".
            Strict Rule: Only reply with the coaching tip text. No conversational filler.
        `;
        const result = await model.generateContent(prompt);
        const tip = result.response.text().trim();
        res.json({ tip });
    } catch (error) {
        console.error("Coach Error:", error);
        res.status(500).json({ tip: "Keep your form tight and stay focused." });
    }
});

// --- AI INSIGHT HISTORY ---
router.get('/ai/history/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT sleep_suggestion, activity_suggestion, created_at 
             FROM ai_insight_cache 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 20`,
            [userId]
        );
        const history = rows.map(row => ([
            { ...JSON.parse(row.sleep_suggestion),    id: `sleep-${row.created_at}`,    timestamp: new Date(row.created_at).toLocaleString() },
            { ...JSON.parse(row.activity_suggestion), id: `activity-${row.created_at}`, timestamp: new Date(row.created_at).toLocaleString() },
        ])).flat();
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// GET latest activity logs for a specific user
router.get('/logs/latest/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Query to get the most recent log entry for this user
        // Adjust 'logs' to your actual table name
        const [latestLog] = await db.execute(
            'SELECT * FROM logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        // Query to get the most recent water/sleep entry
        const [latestSleep] = await db.execute(
            'SELECT * FROM sleep_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );

        if (!latestLog && !latestSleep) {
            return res.status(404).json({ message: "No historical data found for this user." });
        }

        res.json({
            stats: {
                calories_burned: latestLog?.calories || 0,
                steps: latestLog?.steps || 0,
                workout_duration_mins: latestLog?.minutes || 0,
                water_intake_ml: latestSleep?.water_intake_ml || 0,
                sleep_duration: latestSleep?.sleep_duration || 0,
                sleep_quality: latestSleep?.sleep_quality || 0,
            },
            last_updated: latestLog?.created_at || latestSleep?.created_at
        });

    } catch (error) {
        console.error("Error fetching latest logs:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;