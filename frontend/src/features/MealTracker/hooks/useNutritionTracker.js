import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../../config/port";


// ─────────────────────────────────────────────
// API FUNCTIONS (moved here)
// ─────────────────────────────────────────────

async function compressImageToBase64(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX_WIDTH = 512;
      const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const compressed = canvas.toDataURL("image/jpeg", 0.7);
      resolve(compressed.split(",")[1]);
    };
    img.onerror = () => reject(new Error("Image compression failed"));
    img.src = dataUrl;
  });
}

async function apiAnalyzeFoodImage(dataUrl) {
  const base64 = await compressImageToBase64(dataUrl);

  const res = await fetch(`${API_BASE_URL}/api/food-logs/analyze-pic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image: base64 }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Analysis failed");
  return data;
}

async function apiSaveFoodLog(userId, meal) {
  const res = await fetch(`${API_BASE_URL}/api/food-logs/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      food_name: meal.food_name,
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      image_url: meal.image_url || null,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Save failed");
  return data;
}

async function apiFetchFoodLogs(userId) {
  const res = await fetch(`${API_BASE_URL}/api/food-logs/${userId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Fetch failed");
  return data;
}

// ─────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────

export function useNutritionTracker(USER_ID) {
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [summarySeed, setSummarySeed] = useState(0);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const loadHistory = async () => {
    if (!USER_ID) return;
    setHistoryLoading(true);
    try {
      const data = await apiFetchFoodLogs(USER_ID);
      if (data.records) setHistory(data.records);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [USER_ID]);

  const handleAnalyze = async (dataUrl) => {
    setIsAnalyzing(true);
    setResult(null);
    try {
      const data = await apiAnalyzeFoodImage(dataUrl);
      setResult(data);
    } catch (err) {
      showToast("❌ " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLog = async (meal) => {
    setIsLogging(true);
    try {
      await apiSaveFoodLog(USER_ID, meal);
      showToast(`✓ ${meal.food_name} saved!`);
      setResult(null);
      await loadHistory();
      setSummarySeed((s) => s + 1);
    } catch (err) {
      showToast("❌ " + err.message);
    } finally {
      setIsLogging(false);
    }
  };

  return {
    result,
    isAnalyzing,
    isLogging,
    history,
    historyLoading,
    toast,
    summarySeed,
    handleAnalyze,
    handleLog,
    setToast,
  };
}