import { useCallback, useRef, useState } from 'react';
import { API_BASE_URL } from '../../../config/port';

const API_BASE = `${API_BASE_URL}/api/workout-logs`; // ✅ hits your actual backend

export function useWorkoutSession() {
  const [sessionId,     setSessionId]     = useState(null);
  const [isActive,      setIsActive]      = useState(false);
  const [sessionResult, setSessionResult] = useState(null);
  const [sessionError,  setSessionError]  = useState(null);

  const sessionIdRef = useRef(null);

  const startSession = useCallback(async (workoutType) => {
    setSessionError(null);
    setSessionResult(null);

    try {
      const res = await fetch(`${API_BASE}/start`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ workout_type: workoutType }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      sessionIdRef.current = data.session_id;
      setSessionId(data.session_id);
      setIsActive(true);
      console.info('[useWorkoutSession] started → id:', data.session_id);
    } catch (err) {
      console.error('[useWorkoutSession] startSession failed:', err.message);
      setSessionError(err.message);
      // Don't rethrow — caller is fire-and-forget
    }
  }, []);

  const endSession = useCallback(async (status = 'completed', repCount = 0) => {
    const id = sessionIdRef.current;
    if (!id) {
      console.warn('[useWorkoutSession] endSession called with no active session');
      return;
    }

    setSessionError(null);

    try {
      const res = await fetch(`${API_BASE}/${id}/end`, {
        method:      'PATCH',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ status, rep_count: repCount }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setSessionResult(data);
      console.info('[useWorkoutSession] ended → duration:', data.duration_seconds, 's');
    } catch (err) {
      console.error('[useWorkoutSession] endSession failed:', err.message);
      setSessionError(err.message);
      // Don't rethrow — caller is fire-and-forget
    } finally {
      sessionIdRef.current = null;
      setSessionId(null);
      setIsActive(false);
    }
  }, []);

  return { sessionId, isActive, startSession, endSession, sessionResult, sessionError };
}