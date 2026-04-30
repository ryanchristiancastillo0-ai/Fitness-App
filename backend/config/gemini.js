const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function callGeminiWithFallback(prompt) {
  // Array of models to try in order
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
        return text; // ✅ CRITICAL: Must return the text here!
      }
    } catch (error) {
      console.warn(`[VITALIS AI] ${modelName} failed, trying next...`);
    }
  }

  // FALLBACK: If all models above fail, return this mock string
  console.warn("[VITALIS AI] All models failed. Using Local Fallback Engine.");
  return JSON.stringify({
    "sleep_suggestion": { 
      "message": "AI is currently recalibrating, but stay consistent with your 7-8 hour sleep target.", 
      "category": "Rest Advisory", 
      "trend": "stable" 
    },
    "activity_suggestion": { 
      "message": "System high demand. Keep hitting your activity targets while we sync your latest stats.", 
      "category": "Performance Tip", 
      "trend": "up" 
    }
  });
}


async function analyzeFoodImage(base64Data, mimeType = "image/jpeg") {
  // Vision works best on Flash 1.5
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this food image for Vitalis Labs. 
    Identify the food and estimate: calories, protein, carbs, and fat.
    Return ONLY a JSON object:
    {"food_name": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "suggestion": "..."}
  `;

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType
    }
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("[VITALIS IMAGE] Error:", error.message);
    throw error;
  }
}

module.exports = { genAI, callGeminiWithFallback, analyzeFoodImage };