import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * usePoseEngine
 *
 * FIX 1: workoutType is no longer in the useEffect dependency array that
 *         initialises MediaPipe. Previously every exercise-switch tore down
 *         and rebuilt the pose engine, losing ~2-3 s of warmup time and
 *         silently dropping frames during the transition.
 *
 * FIX 2: onPoseResult is stored in a ref so the results callback always
 *         calls the *current* version of the function without needing it in
 *         the dependency array (avoids the stale-closure bug that caused the
 *         wrong workoutType to be used for angle detection after switching).
 *
 * @param {object}   params
 * @param {boolean}  params.isRecording
 * @param {boolean}  params.cameraOn
 * @param {React.RefObject} params.webcamRef
 * @param {function} params.onPoseResult   – (landmarks) => void
 * @param {string}   params.workoutType    – kept as param for external use,
 *                                           but NOT used as an effect dep
 * @returns {{ poseReady: boolean }}
 */
export function usePoseEngine({
  isRecording,
  cameraOn,
  webcamRef,
  onPoseResult,
  workoutType, // still accepted so callers don't need to change their API
}) {
  const [poseReady, setPoseReady] = useState(false);
  const poseRef          = useRef(null);
  const onPoseResultRef  = useRef(onPoseResult);
  const workoutTypeRef   = useRef(workoutType);

  // Keep refs in sync on every render (no re-init triggered)
  useEffect(() => { onPoseResultRef.current = onPoseResult; }, [onPoseResult]);
  useEffect(() => { workoutTypeRef.current  = workoutType;  }, [workoutType]);

  // ── Init MediaPipe Pose ONCE ────────────────────────────────────────────
  // workoutType intentionally omitted from deps — we want a single long-lived
  // instance, not one per exercise.
  useEffect(() => {
    let active = true;

    const tryInit = () => {
      if (!window.Pose) {
        if (active) setTimeout(tryInit, 500);
        return;
      }
      try {
        const pose = new window.Pose({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
          modelComplexity:        1,
          smoothLandmarks:        true,
          minDetectionConfidence: 0.6,
          minTrackingConfidence:  0.6,
        });

        // Use the ref so we always call the current handler with the current
        // workoutType — no stale closure, no engine reinit needed.
        pose.onResults((results) => {
          if (!results.poseLandmarks) return;
          onPoseResultRef.current(results.poseLandmarks, workoutTypeRef.current);
        });

        poseRef.current = pose;
        if (active) setPoseReady(true);
      } catch (err) {
        console.error('[usePoseEngine] init failed:', err);
      }
    };

    tryInit();

    return () => {
      active = false;
      poseRef.current?.close();
      poseRef.current = null;
      setPoseReady(false);
    };
  }, []); // ← empty array: init once, never reinit

  // ── Frame-analysis loop ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isRecording || !cameraOn) return;

    const sendFrame = async () => {
      if (!poseRef.current || !webcamRef.current?.video) return;
      const video = webcamRef.current.video;
      if (video.readyState >= 2) {
        try {
          await poseRef.current.send({ image: video });
        } catch {
          /* ignore single-frame errors */
        }
      }
    };

    const interval = setInterval(sendFrame, 150); // ~7 FPS
    return () => clearInterval(interval);
  }, [isRecording, cameraOn, webcamRef]);

  return { poseReady };
}