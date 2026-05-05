import { useCallback, useRef, useState } from 'react';
import { speak } from './useRepCounter';

export function useAICoach({ workoutType, voiceEnabled }) {
  const [aiFeedback,  setAiFeedback]  = useState('Select Exercise & Start');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const lastAICallRef  = useRef(0);
  const analyzingGuard = useRef(false);

  const analyzeWithAI = useCallback(async (landmarks) => {
    if (analyzingGuard.current) return;
    analyzingGuard.current = true;
    setIsAnalyzing(true);

    // landmarks is null when camera is blocked / no body detected
    const isBlocked = !landmarks;

    const userPrompt = isBlocked
      ? `Exercise: ${workoutType}\nThe camera is completely blocked or the athlete is out of frame. Give ONE short (≤10 word) instruction to fix their position. No quotes.`
      : `
Exercise: ${workoutType}
Pose snapshot (normalised y-coords, 0=top 1=bottom):
  shoulders L=${landmarks[11].y.toFixed(3)} R=${landmarks[12].y.toFixed(3)}
  elbows    L=${landmarks[13].y.toFixed(3)} R=${landmarks[14].y.toFixed(3)}
  wrists    L=${landmarks[15].y.toFixed(3)} R=${landmarks[16].y.toFixed(3)}
  hips      L=${landmarks[23].y.toFixed(3)} R=${landmarks[24].y.toFixed(3)}
  knees     L=${landmarks[25].y.toFixed(3)} R=${landmarks[26].y.toFixed(3)}
  ankles    L=${landmarks[27].y.toFixed(3)} R=${landmarks[28].y.toFixed(3)}

Give ONE short (≤12 word) coaching cue. No quotes. No punctuation at end.
`.trim();

    try {
  const response = await fetch('/api/coach', {
  method:      'POST',
  credentials: 'include',
  headers:     { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    system: 'You are a terse, encouraging personal trainer. Reply with ONE coaching cue of 12 words or fewer. No quotes, no trailing punctuation.',
    prompt: userPrompt,
  }),
});

if (!response.ok) throw new Error(`HTTP ${response.status}`);
const data = await response.json();
const tip  = data?.text?.trim();

      if (tip) {
        setAiFeedback(tip);
        if (voiceEnabled) speak(tip, 0.95, 1.0);
      }
    } catch (err) {
      console.warn('[useAICoach] API error:', err.message);
      const blockedFallbacks = [
        'Step back so your full body is visible',
        'Position yourself in frame and try again',
        'Camera blocked — adjust your position',
      ];
      const exerciseFallbacks = {
        pushup:        'Keep your core tight and back flat',
        squat:         'Drive through your heels as you rise',
        lunge:         'Keep front knee over ankle',
        bicep_curl:    'Squeeze at the top, lower slowly',
        overhead:      'Lock arms fully at the top',
        crunch:        'Exhale on the way up',
        situp:         'Engage your core, not your neck',
        lateral_raise: 'Lead with your elbows, not wrists',
        calfraise:     'Full range — pause at the top',
      };
      const fb = isBlocked
        ? blockedFallbacks[Math.floor(Math.random() * blockedFallbacks.length)]
        : (exerciseFallbacks[workoutType] ?? 'Great form, keep it up');
      setAiFeedback(fb);
      if (voiceEnabled) speak(fb, 0.95, 1.0);
    } finally {
      setIsAnalyzing(false);
      analyzingGuard.current = false;
    }
  }, [workoutType, voiceEnabled]);

  const maybeAnalyze = useCallback((landmarks) => {
    const now = Date.now();
    // Blocked camera fires faster (every 2s) vs normal pose (every 3.5s)
    const throttle = landmarks ? 3500 : 2000;
    if (now - lastAICallRef.current > throttle) {
      lastAICallRef.current = now;
      analyzeWithAI(landmarks);
    }
  }, [analyzeWithAI]);

  return { aiFeedback, isAnalyzing, setAiFeedback, maybeAnalyze };
}