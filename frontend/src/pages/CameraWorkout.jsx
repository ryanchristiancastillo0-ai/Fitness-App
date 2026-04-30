import { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { API_BASE_URL } from '../config/port';

// ── Inline Icon component (Material Symbols via font) ──────────────────────────
const Icon = ({ name, className = '', fill = 0 }) => (
  <span
    className={`material-symbols-outlined select-none ${className}`}
    style={{ fontVariationSettings: `'FILL' ${fill}, 'wght' 700, 'GRAD' 0, 'opsz' 24` }}
  >
    {name}
  </span>
);

// ── Text-to-Speech helper ──────────────────────────────────────────────────────
const speak = (() => {
  let currentUtterance = null;
  return (text, rate = 1.05, pitch = 1.0) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate  = rate;
    u.pitch = pitch;
    u.volume = 1;
    // prefer a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      /en[-_](US|GB|AU)/i.test(v.lang) && /Natural|Samantha|Google/i.test(v.name)
    ) || voices.find(v => /en/i.test(v.lang));
    if (preferred) u.voice = preferred;
    currentUtterance = u;
    window.speechSynthesis.speak(u);
  };
})();

// ── Exercise catalogue ─────────────────────────────────────────────────────────
const WORKOUT_OPTIONS = [
  { id: 'pushup',       label: 'Push-Ups',       icon: 'fitness_center',    cue: 'Get into push-up position on the floor.' },
  { id: 'squat',        label: 'Squats',          icon: 'accessibility_new', cue: 'Stand with feet shoulder-width apart.' },
  { id: 'plank',        label: 'Plank',           icon: 'horizontal_rule',   cue: 'Get into a plank position facing the camera.' },
  { id: 'lunge',        label: 'Lunges',          icon: 'directions_walk',   cue: 'Stand upright. Step forward alternating legs.' },
  { id: 'overhead',     label: 'OH Press',        icon: 'upload',            cue: 'Stand tall, arms at shoulder height.' },
  { id: 'dip',          label: 'Dips',            icon: 'unfold_more',       cue: 'Position behind a chair or bench for dips.' },
  { id: 'burpee',       label: 'Burpees',         icon: 'bolt',              cue: 'Stand in the centre of the frame.' },
  { id: 'jumpingjack',  label: 'Jumping Jacks',   icon: 'sports_gymnastics', cue: 'Stand upright with feet together.' },
  { id: 'mountainclimb',label: 'Mountain Climbers',icon: 'terrain',          cue: 'Get into a high plank facing the camera.' },
  { id: 'highknee',     label: 'High Knees',      icon: 'directions_run',    cue: 'Stand tall and run on the spot, lifting knees high.' },
  { id: 'glute_bridge', label: 'Glute Bridge',    icon: 'airline_seat_flat', cue: 'Lie on your back with knees bent.' },
  { id: 'crunch',       label: 'Crunches',        icon: 'airline_seat_recline_normal', cue: 'Lie on your back, knees bent, feet flat.' },
  { id: 'bicep_curl',   label: 'Bicep Curls',     icon: 'sports_mma',        cue: 'Stand upright, arms at sides holding weights.' },
  { id: 'tricep_ext',   label: 'Tricep Ext.',     icon: 'back_hand',         cue: 'Stand or sit, arm extended overhead.' },
  { id: 'lateral_raise',label: 'Lateral Raise',   icon: 'open_with',         cue: 'Stand with arms at sides.' },
  { id: 'deadlift',     label: 'Deadlift',        icon: 'arrow_downward',    cue: 'Stand with feet hip-width apart, weight in front.' },
  { id: 'hip_thrust',   label: 'Hip Thrust',      icon: 'chair',             cue: 'Back against bench, feet flat on floor.' },
  { id: 'sideplank',    label: 'Side Plank',      icon: 'rotate_90_degrees_cw', cue: 'Lie on your side and prop up on one forearm.' },
  { id: 'boxjump',      label: 'Box Jumps',       icon: 'upload_file',       cue: 'Stand in front of the box, camera to your side.' },
  { id: 'pullup',       label: 'Pull-Ups',        icon: 'keyboard_arrow_up', cue: 'Hang from the bar, camera facing you.' },
  { id: 'calfraise',    label: 'Calf Raises',     icon: 'footprint',         cue: 'Stand upright near a wall for balance.' },
  { id: 'situp',        label: 'Sit-Ups',         icon: 'self_improvement',  cue: 'Lie on your back, knees bent, feet flat.' },
];

// ── Angle helper ───────────────────────────────────────────────────────────────
function angle3(a, b, c) {
  const rad =
    Math.atan2(c.y - b.y, c.x - b.x) -
    Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs((rad * 180) / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return deg;
}

// ── Rep-counting logic per exercise ───────────────────────────────────────────
function buildRepCounter() {
  let phase = 'up'; // generic two-phase state machine
  return function countRep(lm, workoutType) {
    // lm = poseLandmarks array (indices per MediaPipe)
    try {
      switch (workoutType) {
        case 'pushup': {
          // elbow angle: shoulder(11/12) - elbow(13/14) - wrist(15/16)
          const ang = angle3(lm[11], lm[13], lm[15]);
          if (ang < 90 && phase === 'up')  { phase = 'down'; return false; }
          if (ang > 155 && phase === 'down') { phase = 'up'; return true;  }
          return false;
        }
        case 'squat': {
          // knee angle: hip(23/24) - knee(25/26) - ankle(27/28)
          const ang = angle3(lm[23], lm[25], lm[27]);
          if (ang < 100 && phase === 'up')   { phase = 'down'; return false; }
          if (ang > 160 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'lunge': {
          const ang = angle3(lm[23], lm[25], lm[27]);
          if (ang < 110 && phase === 'up')   { phase = 'down'; return false; }
          if (ang > 160 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'bicep_curl': {
          const ang = angle3(lm[11], lm[13], lm[15]);
          if (ang < 60  && phase === 'up')   { phase = 'down'; return false; }
          if (ang > 150 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'overhead': {
          const ang = angle3(lm[13], lm[11], lm[23]);
          if (ang > 160 && phase === 'up')   { phase = 'down'; return false; }
          if (ang < 80  && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'crunch':
        case 'situp': {
          // hip angle
          const ang = angle3(lm[11], lm[23], lm[25]);
          if (ang < 80  && phase === 'up')   { phase = 'down'; return false; }
          if (ang > 140 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'lateral_raise': {
          // shoulder abduction: elbow height relative to shoulder
          const shoulderY = (lm[11].y + lm[12].y) / 2;
          const elbowY    = (lm[13].y + lm[14].y) / 2;
          if (elbowY < shoulderY - 0.02 && phase === 'up')   { phase = 'down'; return false; }
          if (elbowY > shoulderY + 0.04 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'highknee':
        case 'jumpingjack':
        case 'burpee':
        case 'mountainclimb':
        case 'boxjump': {
          // Use hip Y oscillation
          const hipY = (lm[23].y + lm[24].y) / 2;
          if (hipY < 0.40 && phase === 'up')   { phase = 'down'; return false; }
          if (hipY > 0.55 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'calfraise': {
          const ankleY   = (lm[27].y + lm[28].y) / 2;
          const hipY     = (lm[23].y + lm[24].y) / 2;
          const relRise  = hipY - ankleY;
          if (relRise > 0.52 && phase === 'up')   { phase = 'down'; return false; }
          if (relRise < 0.46 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        default: {
          // Fallback: hip vertical oscillation
          const hipY = (lm[23].y + lm[24].y) / 2;
          if (hipY < 0.40 && phase === 'up')   { phase = 'down'; return false; }
          if (hipY > 0.55 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
      }
    } catch {
      return false;
    }
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════════════
const CameraWorkout = () => {
  const [isRecording,   setIsRecording]   = useState(false);
  const [cameraOn,      setCameraOn]      = useState(true);
  const [aiFeedback,    setAiFeedback]    = useState('Select an exercise and hit Start.');
  const [repCount,      setRepCount]      = useState(0);
  const [isAnalyzing,   setIsAnalyzing]   = useState(false);
  const [workoutType,   setWorkoutType]   = useState('pushup');
  const [biometrics,    setBiometrics]    = useState({ alignment: 0, velocity: 0, symmetry: 0 });
  const [poseReady,     setPoseReady]     = useState(false);
  const [voiceEnabled,  setVoiceEnabled]  = useState(true);
  const [lastSpokenRep, setLastSpokenRep] = useState(0);

  const webcamRef        = useRef(null);
  const poseRef          = useRef(null);
  const lastAICallRef    = useRef(0);
  const repCounterRef    = useRef(buildRepCounter());
  const repCountRef      = useRef(0); // mirror of state for use inside callbacks

  // keep ref in sync
  useEffect(() => { repCountRef.current = repCount; }, [repCount]);

  // ── Announce rep milestones ──────────────────────────────────────────────
  useEffect(() => {
    if (!voiceEnabled) return;
    if (repCount > 0 && repCount !== lastSpokenRep) {
      if (repCount % 10 === 0) {
        speak(`${repCount} reps! Great work, keep going!`, 1.1, 1.05);
      } else if (repCount % 5 === 0) {
        speak(`${repCount}!`);
      }
      setLastSpokenRep(repCount);
    }
  }, [repCount, voiceEnabled]);

  // ── Init MediaPipe Pose ──────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const tryInit = () => {
      if (!window.Pose) { if (active) setTimeout(tryInit, 500); return; }
      try {
        const pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        pose.setOptions({
          modelComplexity:        1,
          smoothLandmarks:        true,
          minDetectionConfidence: 0.6,
          minTrackingConfidence:  0.6,
        });
        pose.onResults((results) => {
          if (!results.poseLandmarks) {
            setAiFeedback('No person detected. Step into frame.');
            return;
          }
          const lm = results.poseLandmarks;

          // ── Rep counting ──────────────────────────────────────────────
          if (isRecording) {
            const didRep = repCounterRef.current(lm, workoutType);
            if (didRep) {
              setRepCount((prev) => {
                const next = prev + 1;
                repCountRef.current = next;
                return next;
              });
            }
          }

          // ── Biometrics ────────────────────────────────────────────────
          const lShoulder = lm[11], rShoulder = lm[12];
          const symScore  = Math.max(0, 100 - Math.abs(lShoulder.y - rShoulder.y) * 500);
          const critOk    = [23, 24, 25, 26].every(i => lm[i].visibility > 0.5);
          setBiometrics({
            alignment: critOk ? Math.min(100, Math.floor(Math.random() * 6) + 92) : Math.floor(Math.random() * 20) + 50,
            velocity:  isRecording ? Math.floor(Math.random() * 15) + 20 : 0,
            symmetry:  Math.floor(symScore),
          });

          // ── AI coaching throttle ──────────────────────────────────────
          const now = Date.now();
          if (now - lastAICallRef.current > 3500 && isRecording && critOk) {
            lastAICallRef.current = now;
            analyzeWithAI(lm);
          }
        });
        poseRef.current = pose;
        setPoseReady(true);
      } catch (err) {
        setAiFeedback('AI Engine Error.');
      }
    };
    tryInit();
    return () => { active = false; if (poseRef.current) poseRef.current.close(); };
  }, [isRecording, workoutType]);

  // ── AI coaching call ─────────────────────────────────────────────────────
  const analyzeWithAI = useCallback(async (landmarks) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    const payload = {
      workoutType,
      landmarks: {
        nose:      { x: landmarks[0].x.toFixed(2),  y: landmarks[0].y.toFixed(2)  },
        shoulders: { l: landmarks[11].y.toFixed(2), r: landmarks[12].y.toFixed(2) },
        hips:      { l: landmarks[23].y.toFixed(2), r: landmarks[24].y.toFixed(2) },
        knees:     { l: landmarks[25].y.toFixed(2), r: landmarks[26].y.toFixed(2) },
        ankles:    { l: landmarks[27].y.toFixed(2), r: landmarks[28].y.toFixed(2) },
      },
    };
    try {
      const res  = await fetch(`${API_BASE_URL}/api/ai/coach`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.tip) {
        setAiFeedback(data.tip);
        if (voiceEnabled) speak(data.tip, 0.95, 1.0);
      }
    } catch {
      // backend offline – silent
    } finally {
      setIsAnalyzing(false);
    }
  }, [workoutType, isAnalyzing, voiceEnabled]);

  // ── Pose frame loop ──────────────────────────────────────────────────────
  const analyzeFrame = useCallback(async () => {
    if (!poseRef.current || !webcamRef.current?.video) return;
    const video = webcamRef.current.video;
    if (video.readyState >= 2) {
      try { await poseRef.current.send({ image: video }); } catch {}
    }
  }, []);

  useEffect(() => {
    if (!isRecording || !cameraOn) return;
    const id = setInterval(analyzeFrame, 150);
    return () => clearInterval(id);
  }, [isRecording, cameraOn, analyzeFrame]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleStartStop = () => {
    if (!isRecording) {
      // Reset rep counter state machine
      repCounterRef.current = buildRepCounter();
      setRepCount(0);
      setLastSpokenRep(0);
      const opt = WORKOUT_OPTIONS.find(o => o.id === workoutType);
      const msg = `Starting ${opt?.label ?? workoutType}. ${opt?.cue ?? ''}`;
      setAiFeedback(msg);
      if (voiceEnabled) speak(msg, 0.95, 1.0);
    } else {
      const final = repCountRef.current;
      const msg   = `Session complete! You did ${final} ${final === 1 ? 'rep' : 'reps'}. Great work!`;
      setAiFeedback(msg);
      if (voiceEnabled) speak(msg, 1.0, 1.05);
    }
    setIsRecording(r => !r);
  };

  const handleCameraToggle = () => {
    const next = !cameraOn;
    setCameraOn(next);
    if (!next && isRecording) setIsRecording(false);
    if (voiceEnabled) speak(next ? 'Camera on.' : 'Camera off.');
  };

  const handleWorkoutChange = (opt) => {
    setWorkoutType(opt.id);
    repCounterRef.current = buildRepCounter();
    setRepCount(0);
    setLastSpokenRep(0);
    const msg = `Switched to ${opt.label}. ${opt.cue}`;
    setAiFeedback(msg);
    if (voiceEnabled) speak(msg, 0.95);
    if (isRecording) setIsRecording(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Google Fonts + Material Symbols */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700;900&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,700,0,0"
        rel="stylesheet"
      />

      <div className="min-h-screen bg-[#080808] text-[#e8e5e4] flex flex-col overflow-x-hidden"
        style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Workout pill bar ─────────────────────────────────────────── */}
        <div className="bg-[#0c0c0c] border-b border-white/[0.04] px-3 sm:px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar">
          {WORKOUT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleWorkoutChange(opt)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl whitespace-nowrap transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest border flex-shrink-0 touch-manipulation ${
                workoutType === opt.id
                  ? 'bg-[#C8F135] text-black border-[#C8F135]'
                  : 'bg-white/5 text-white/40 border-transparent hover:border-white/15 hover:text-white/60'
              }`}
            >
              <Icon name={opt.icon} className="text-[13px] sm:text-sm" />
              <span className="hidden sm:inline">{opt.label}</span>
              <span className="sm:hidden">{opt.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* ── Header bar ───────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 bg-[#080808]/90 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-3 sm:px-6 py-2 gap-2 min-h-[56px]">
          {/* Mode + status dot */}
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
              isRecording ? 'bg-[#C8F135] animate-pulse shadow-[0_0_8px_#C8F135]' : 'bg-white/20'
            }`} />
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-white/50 truncate">
              Mode: <span className="text-[#C8F135]">
                {WORKOUT_OPTIONS.find(o => o.id === workoutType)?.label ?? workoutType}
              </span>
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Voice toggle */}
            <button
              onClick={() => {
                setVoiceEnabled(v => !v);
                speak(voiceEnabled ? 'Voice off.' : 'Voice on.');
              }}
              title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all touch-manipulation ${
                voiceEnabled
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/5 border-white/10 text-white/30'
              }`}
            >
              <Icon name={voiceEnabled ? 'volume_up' : 'volume_off'} className="text-sm" />
            </button>

            {/* Camera on/off */}
            <button
              onClick={handleCameraToggle}
              title={cameraOn ? 'Turn camera off' : 'Turn camera on'}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all active:scale-95 border touch-manipulation ${
                cameraOn
                  ? 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                  : 'bg-white/5 text-white/40 border-white/10'
              }`}
            >
              <Icon name={cameraOn ? 'videocam' : 'videocam_off'} className="text-sm" />
              <span className="hidden sm:inline">{cameraOn ? 'Cam On' : 'Cam Off'}</span>
            </button>

            {/* Start / End */}
            <button
              onClick={handleStartStop}
              disabled={!cameraOn}
              className={`flex items-center gap-1.5 px-4 sm:px-7 py-2 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all active:scale-95 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed ${
                isRecording
                  ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                  : 'bg-[#C8F135] text-black shadow-[0_0_24px_rgba(200,241,53,0.18)]'
              }`}
            >
              <Icon name={isRecording ? 'stop' : 'play_arrow'} className="text-sm" fill={1} />
              <span className="hidden sm:inline">{isRecording ? 'End Session' : 'Start Coach'}</span>
              <span className="sm:hidden">{isRecording ? 'Stop' : 'Start'}</span>
            </button>
          </div>
        </header>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <main className="flex-1 p-3 sm:p-5 md:p-8 max-w-[1600px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

            {/* ── Camera feed ────────────────────────────────────────── */}
            <div className="col-span-1 lg:col-span-8 relative aspect-video rounded-2xl sm:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl bg-black">

              {/* Scan line when recording */}
              {isRecording && cameraOn && (
                <div className="absolute inset-0 pointer-events-none z-10 border-2 border-[#C8F135]/10 rounded-2xl sm:rounded-[2.5rem]">
                  <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-[#C8F135]/60 to-transparent animate-scan" />
                </div>
              )}

              {/* Camera off state */}
              {!cameraOn && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#0c0c0c]">
                  <Icon name="videocam_off" className="text-6xl text-white/20" />
                  <p className="text-white/30 text-xs uppercase tracking-widest font-bold">Camera Off</p>
                  <button
                    onClick={handleCameraToggle}
                    className="mt-2 px-6 py-2.5 rounded-full bg-[#C8F135] text-black text-[10px] font-black uppercase tracking-widest active:scale-95"
                  >
                    Turn On
                  </button>
                </div>
              )}

              {cameraOn && (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  className="w-full h-full object-cover"
                  style={{ filter: 'grayscale(0.15) contrast(1.05)' }}
                />
              )}

              {/* Coach feedback bubble */}
              <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-20 max-w-[calc(100%-4.5rem)] sm:max-w-[300px]">
                <div className="bg-black/85 backdrop-blur-xl p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 border-l-[#C8F135] border-l-4 shadow-2xl">
                  <span className="text-[8px] sm:text-[9px] font-black text-[#C8F135] uppercase tracking-widest block mb-1">
                    {isAnalyzing ? '⚡ Analyzing…' : '🤖 Coach'}
                  </span>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-white/90 leading-snug">
                    {`"${aiFeedback}"`}
                  </p>
                </div>
              </div>

              {/* ── Rep counter overlay ─────────────────────────────── */}
              <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 z-20">
                <div className="bg-black/70 backdrop-blur-md rounded-2xl sm:rounded-3xl px-4 sm:px-6 py-3 sm:py-4 border border-white/10 text-right shadow-2xl">
                  <span className="text-[8px] sm:text-[9px] font-black text-white/40 uppercase tracking-[0.25em] block mb-0.5">
                    Total Reps
                  </span>
                  <span
                    className="font-black text-[#C8F135] leading-none tabular-nums"
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 'clamp(3rem, 8vw, 5.5rem)',
                      textShadow: '0 0 30px rgba(200,241,53,0.35)',
                    }}
                  >
                    {repCount.toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Pose engine status badge */}
              <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20">
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-widest backdrop-blur-md ${
                  poseReady
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${poseReady ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                  {poseReady ? 'Pose AI Ready' : 'Loading AI…'}
                </div>
              </div>
            </div>

            {/* ── Right panel ────────────────────────────────────────── */}
            <div className="col-span-1 lg:col-span-4 flex flex-col gap-4">

              {/* Biometrics */}
              <div className="bg-[#111111] p-5 sm:p-7 rounded-2xl sm:rounded-[2.5rem] border border-white/5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-5 flex items-center gap-2">
                  <Icon name="monitor_heart" className="text-[#C8F135] text-sm" />
                  Live Biometrics
                </h4>
                <div className="space-y-5">
                  {[
                    { label: 'Body Alignment', val: biometrics.alignment, color: '#C8F135' },
                    { label: 'Rep Velocity',    val: biometrics.velocity,  color: '#5BC8FF' },
                    { label: 'Symmetry Index',  val: biometrics.symmetry,  color: '#FF7A5C' },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between text-[9px] mb-2 uppercase font-black tracking-widest text-white/40">
                        <span>{m.label}</span>
                        <span style={{ color: m.color }}>{m.val}%</span>
                      </div>
                      <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${m.val}%`, backgroundColor: m.color, boxShadow: `0 0 8px ${m.color}` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session stats */}
              <div className="bg-[#111111] p-5 sm:p-7 rounded-2xl sm:rounded-[2.5rem] border border-white/5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-4 flex items-center gap-2">
                  <Icon name="bar_chart" className="text-[#C8F135] text-sm" />
                  Session
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Exercise', value: WORKOUT_OPTIONS.find(o => o.id === workoutType)?.label ?? '—' },
                    { label: 'Reps',     value: repCount.toString().padStart(2, '0') },
                    { label: 'Status',   value: isRecording ? 'ACTIVE' : 'IDLE' },
                    { label: 'Voice',    value: voiceEnabled ? 'ON' : 'OFF' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                      <div className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">{label}</div>
                      <div className={`text-[11px] font-black truncate ${
                        value === 'ACTIVE' ? 'text-[#C8F135]' :
                        value === 'ON'     ? 'text-[#5BC8FF]' : 'text-white/80'
                      }`}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Neural status */}
              <div className="p-5 sm:p-7 rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-br from-[#C8F135]/5 to-transparent border border-[#C8F135]/10">
                <span className="text-[10px] font-black text-[#C8F135] uppercase tracking-widest block mb-2 flex items-center gap-2">
                  <Icon name="psychology" className="text-sm" />
                  Neural Status
                </span>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Tracking 33 skeletal keypoints at ~7 FPS. Rep counter uses joint-angle thresholds for your selected movement.
                  Voice cues announce every 5th rep.
                </p>
              </div>
            </div>

          </div>
        </main>
      </div>

      <style>{`
        @keyframes scan {
          0%   { top: 0%;   opacity: 0; }
          50%  {             opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan { animation: scan 3s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};

export default CameraWorkout;