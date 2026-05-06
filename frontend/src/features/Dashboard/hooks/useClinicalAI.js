import { useState, useRef, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../../../config/port';

export const useClinicalAI = (USER_ID, setInsights) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const isAnalyzingRef = useRef(false);

  useEffect(() => {
    isAnalyzingRef.current = isAnalyzing;
  }, [isAnalyzing]);

  const generateClinicalInsight = useCallback(async (currentBiometrics, currentStats) => {
    if (isAnalyzingRef.current) return;

    setIsAnalyzing(true);
    isAnalyzingRef.current = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/clinical-analysis`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: USER_ID,
          ...(currentBiometrics.length > 0 && { biometrics: currentBiometrics }),
          stats: {
            calories_burned:       currentStats?.calories_burned       || 0,
            steps:                 currentStats?.steps                 || 0,
            workout_duration_mins: currentStats?.workout_duration_mins || 0,
            sleep_duration:        currentStats?.sleep_duration        || 0,
            sleep_quality:         currentStats?.sleep_quality         || 0,
            water_intake_ml:       currentStats?.water_intake_ml       || 0,
          },
        }),
      });

      const result = await response.json();

      if (result.insights && Array.isArray(result.insights)) {
        const formattedInsights = result.insights.map((item, index) => ({
          ...item,
          id:        `insight-${Date.now()}-${index}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setInsights(formattedInsights);

        // ✅ Build a single combined summary from both insights
        const restInsight      = result.insights.find(i => i.category === 'Rest Advisory');
        const performInsight   = result.insights.find(i => i.category === 'Performance Tip');

        const restMsg    = restInsight?.message    || '';
        const performMsg = performInsight?.message || '';

        const combinedMessage = [restMsg, performMsg].filter(Boolean).join(' ');

        if (combinedMessage && USER_ID) {
          await fetch(`${API_BASE_URL}/api/notifications`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              user_id: USER_ID,
              message: combinedMessage,
              type:    'info',
            }),
          });
        }
      }
    } catch (err) {
      console.error('Clinical Engine Error:', err);
    } finally {
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
    }
  }, [USER_ID, setInsights]);

  return { isAnalyzing, generateClinicalInsight };
};