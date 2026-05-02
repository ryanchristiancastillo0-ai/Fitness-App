const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callGeminiWithFallback(prompt) {
  // 1. Try Gemini models first
 const models = [
    "gemini-3-flash-preview",
    "gemini-1.5-flash-latest"
  ];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text) {
        console.log(`[VITALIS AI] Success using ${modelName}`);
        return text;
      }
    } catch (error) {
      console.warn(`[VITALIS AI] ${modelName} failed, trying next...`);
    }
  }

  // 2. Gemini exhausted — try Groq (free, fast, no quota issues)
  console.warn("[VITALIS AI] All Gemini models failed. Trying Groq fallback...");
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const text = response.choices[0]?.message?.content;
    if (text) {
      console.log("[VITALIS AI] Success using Groq llama-3.3-70b-versatile");
      return text;
    }
  } catch (groqError) {
    console.error("[VITALIS AI] Groq fallback also failed:", groqError.message);
  }

  // 3. Everything failed — return static fallback
  console.warn("[VITALIS AI] All models failed. Using Local Fallback Engine.");
  return JSON.stringify({
    sleep_suggestion: {
      message:
        "AI is currently recalibrating. Stay consistent with your 7-8 hour sleep target and keep hydration above 2000ml daily.",
      category: "Rest Advisory",
      trend: "stable",
    },
    activity_suggestion: {
      message:
        "System is under high demand. Keep hitting your activity targets while we sync your latest stats.",
      category: "Performance Tip",
      trend: "stable",
    },
  });
}

async function analyzeFoodImage(base64Data, mimeType = "image/jpeg") {
  console.log("[VITALIS IMAGE] Using Groq LLaMA vision...");

  try {
    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this food image for Vitalis Labs.
Identify the food and estimate: calories, protein, carbs, and fat.
Return ONLY a raw JSON object with no markdown, no backticks, no explanation:
{"food_name": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "suggestion": "..."}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error("Empty response from Groq");

    console.log("[VITALIS IMAGE] Groq response:", text.slice(0, 100));
    return text;
  } catch (error) {
    console.error("[VITALIS IMAGE] Groq failed:", error.message);
    throw error;
  }
}

module.exports = { genAI, callGeminiWithFallback, analyzeFoodImage };