import { useCallback, useRef, useState } from 'react';
import { speak } from './useRepCounter';

/**
 * useAICoach
 *
 * FIX 3: The original hook POSTed to `${API_BASE_URL}/api/ai/coach` which is
 *         a local backend that is almost certainly not running.  That's why
 *         the coach tip was frozen on the initial message — every fetch threw
 *         a network error and the catch block only logged "Backend Offline".
 *
 *         We now call the Anthropic API directly from the browser (the same
 *         way AI-powered Artifacts work in Claude.ai), so no backend is
 *         needed.  The prompt is compact so it stays fast and cheap.
 *
 * @param {object}  params
 * @param {string}  params.workoutType
 * @param {boolean} params.voiceEnabled
 *
 * @returns {{
 *   aiFeedback:    string,
 *   isAnalyzing:   boolean,
 *   setAiFeedback: (msg: string) => void,
 *   maybeAnalyze:  (landmarks) => void,
 * }}
 */
export function useAICoach({ workoutType, voiceEnabled }) {
  const [aiFeedback,  setAiFeedback]  = useState('Select Exercise & Start');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const lastAICallRef  = useRef(0);
  const analyzingGuard = useRef(false);

  const analyzeWithAI = useCallback(async (landmarks) => {
    if (analyzingGuard.current) return;
    analyzingGuard.current = true;
    setIsAnalyzing(true);

    // Build a compact snapshot of the pose so the prompt stays small
    const snap = {
      exercise:  workoutType,
      shoulders: { l: landmarks[11].y.toFixed(3), r: landmarks[12].y.toFixed(3) },
      hips:      { l: landmarks[23].y.toFixed(3), r: landmarks[24].y.toFixed(3) },
      knees:     { l: landmarks[25].y.toFixed(3), r: landmarks[26].y.toFixed(3) },
      ankles:    { l: landmarks[27].y.toFixed(3), r: landmarks[28].y.toFixed(3) },
      elbows:    { l: landmarks[13].y.toFixed(3), r: landmarks[14].y.toFixed(3) },
      wrists:    { l: landmarks[15].y.toFixed(3), r: landmarks[16].y.toFixed(3) },
    };

    const userPrompt = `
Exercise: ${snap.exercise}
Pose snapshot (normalised y-coords, 0=top 1=bottom):
  shoulders L=${snap.shoulders.l} R=${snap.shoulders.r}
  elbows    L=${snap.elbows.l}    R=${snap.elbows.r}
  wrists    L=${snap.wrists.l}    R=${snap.wrists.r}
  hips      L=${snap.hips.l}      R=${snap.hips.r}
  knees     L=${snap.knees.l}     R=${snap.knees.r}
  ankles    L=${snap.ankles.l}    R=${snap.ankles.r}

Give ONE short (≤12 word) coaching cue. No quotes. No punctuation at end.
`.trim();

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 80,
          system:     'You are a terse, encouraging personal trainer. Reply with ONE coaching cue of 12 words or fewer. No quotes, no trailing punctuation.',
          messages:   [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const tip  = data?.content?.[0]?.text?.trim();

      if (tip) {
        setAiFeedback(tip);
        if (voiceEnabled) speak(tip, 0.95, 1.0);
      }
    } catch (err) {
      console.warn('[useAICoach] API error:', err.message);
      // Surface a helpful fallback instead of staying silent
      const fallbacks = {
        pushup:       'Keep your core tight and back flat',
        squat:        'Drive through your heels as you rise',
        lunge:        'Keep front knee over ankle',
        bicep_curl:   'Squeeze at the top, lower slowly',
        overhead:     'Lock arms fully at the top',
        crunch:       'Exhale on the way up',
        situp:        'Engage your core, not your neck',
        lateral_raise:'Lead with your elbows, not wrists',
        calfraise:    'Full range — pause at the top',
      };
      const fb = fallbacks[workoutType] ?? 'Great form, keep it up';
      setAiFeedback(fb);
      if (voiceEnabled) speak(fb, 0.95, 1.0);
    } finally {
      setIsAnalyzing(false);
      analyzingGuard.current = false;
    }
  }, [workoutType, voiceEnabled]);

  /**
   * Throttle-wrapped entry point.
   * Call every frame from the pose result handler — self-throttles to ~3.5 s.
   */
  const maybeAnalyze = useCallback((landmarks) => {
    const now = Date.now();
    if (now - lastAICallRef.current > 3500) {
      lastAICallRef.current = now;
      analyzeWithAI(landmarks);
    }
  }, [analyzeWithAI]);

  return { aiFeedback, isAnalyzing, setAiFeedback, maybeAnalyze };
}