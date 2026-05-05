import { useEffect, useRef, useState } from 'react';

function loadMediaPipe() {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (window.Pose) { resolve(); return; }

    const scripts = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js',
    ];

    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded === scripts.length) {
        // Wait a tick for window.Pose to be defined
        setTimeout(() => {
          if (window.Pose) resolve();
          else reject(new Error('window.Pose not found after script load'));
        }, 300);
      }
    };

    scripts.forEach((src) => {
      // Don't double-inject
      if (document.querySelector(`script[src="${src}"]`)) { onLoad(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.crossOrigin = 'anonymous';
      s.onload = onLoad;
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });
  });
}

export function usePoseEngine({
  isRecording,
  cameraOn,
  webcamRef,
  onPoseResult,
  workoutType,
}) {
  const [poseReady, setPoseReady]     = useState(false);
  const [loadError, setLoadError]     = useState(false);
  const poseRef         = useRef(null);
  const onPoseResultRef = useRef(onPoseResult);
  const workoutTypeRef  = useRef(workoutType);
  const noDetectRef     = useRef(0); // frames with no pose

  useEffect(() => { onPoseResultRef.current = onPoseResult; }, [onPoseResult]);
  useEffect(() => { workoutTypeRef.current  = workoutType;  }, [workoutType]);

  // ── Init MediaPipe once ─────────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        await loadMediaPipe();
        if (!active) return;

        const pose = new window.Pose({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
          modelComplexity:        1,
          smoothLandmarks:        true,
          enableSegmentation:     false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence:  0.5,
        });

        pose.onResults((results) => {
          if (!active) return;

          if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
            // No body detected — increment counter, caller handles it
            noDetectRef.current += 1;
            onPoseResultRef.current(null, workoutTypeRef.current, noDetectRef.current);
            return;
          }

          noDetectRef.current = 0;
          onPoseResultRef.current(results.poseLandmarks, workoutTypeRef.current, 0);
        });

        // Warm up the model
        await pose.initialize();

        poseRef.current = pose;
        if (active) setPoseReady(true);
      } catch (err) {
        console.error('[usePoseEngine] init failed:', err);
        if (active) setLoadError(true);
      }
    };

    init();

    return () => {
      active = false;
      poseRef.current?.close?.();
      poseRef.current = null;
      setPoseReady(false);
    };
  }, []);

  // ── Frame loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRecording || !cameraOn) return;

    const sendFrame = async () => {
      const video = webcamRef.current?.video;
      if (!poseRef.current || !video) return;
      if (video.readyState < 2 || video.paused) return;
      try {
        await poseRef.current.send({ image: video });
      } catch {
        /* ignore single-frame errors */
      }
    };

    const id = setInterval(sendFrame, 150); // ~7 FPS
    return () => clearInterval(id);
  }, [isRecording, cameraOn, webcamRef]);

  return { poseReady, loadError };
}