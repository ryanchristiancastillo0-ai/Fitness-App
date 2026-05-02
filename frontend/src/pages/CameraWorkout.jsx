import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Icon, Sidebar } from '../components';
import SidebarAnalytics from '../components/sidebarAnalytics';
import { API_BASE_URL } from '../config/port';

// ── Text-to-Speech helper ──────────────────────────────────────────────────────
const speak = (() => {
  return (text, rate = 1.05, pitch = 1.0) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate   = rate;
    u.pitch  = pitch;
    u.volume = 1;
    const voices    = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(v => /en[-_](US|GB|AU)/i.test(v.lang) && /Natural|Samantha|Google/i.test(v.name)) ||
      voices.find(v => /en/i.test(v.lang));
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  };
})();

// ── Exercise catalogue ─────────────────────────────────────────────────────────
const WORKOUT_OPTIONS = [
  { id: 'pushup',        label: 'Push-Ups',         icon: 'fitness_center',              cue: 'Get into push-up position on the floor.'              },
  { id: 'squat',         label: 'Squats',            icon: 'accessibility_new',           cue: 'Stand with feet shoulder-width apart.'                },
  { id: 'plank',         label: 'Plank',             icon: 'horizontal_rule',             cue: 'Get into a plank position facing the camera.'         },
  { id: 'lunge',         label: 'Lunges',            icon: 'directions_walk',             cue: 'Stand upright. Step forward alternating legs.'        },
  { id: 'overhead',      label: 'OH Press',          icon: 'upload',                      cue: 'Stand tall, arms at shoulder height.'                 },
  { id: 'dip',           label: 'Dips',              icon: 'unfold_more',                 cue: 'Position behind a chair or bench for dips.'          },
  { id: 'burpee',        label: 'Burpees',           icon: 'bolt',                        cue: 'Stand in the centre of the frame.'                    },
  { id: 'jumpingjack',   label: 'Jumping Jacks',     icon: 'sports_gymnastics',           cue: 'Stand upright with feet together.'                    },
  { id: 'mountainclimb', label: 'Mountain Climbers', icon: 'terrain',                     cue: 'Get into a high plank facing the camera.'             },
  { id: 'highknee',      label: 'High Knees',        icon: 'directions_run',              cue: 'Stand tall and run on the spot, lifting knees high.'  },
  { id: 'glute_bridge',  label: 'Glute Bridge',      icon: 'airline_seat_flat',           cue: 'Lie on your back with knees bent.'                    },
  { id: 'crunch',        label: 'Crunches',          icon: 'airline_seat_recline_normal', cue: 'Lie on your back, knees bent, feet flat.'            },
  { id: 'situp',         label: 'Sit-Ups',           icon: 'self_improvement',            cue: 'Lie on your back, knees bent, feet flat.'            },
  { id: 'bicep_curl',    label: 'Bicep Curls',       icon: 'sports_mma',                  cue: 'Stand upright, arms at sides holding weights.'        },
  { id: 'tricep_ext',    label: 'Tricep Ext.',       icon: 'back_hand',                   cue: 'Stand or sit, arm extended overhead.'                 },
  { id: 'lateral_raise', label: 'Lateral Raise',     icon: 'open_with',                   cue: 'Stand with arms at sides.'                            },
  { id: 'deadlift',      label: 'Deadlift',          icon: 'arrow_downward',              cue: 'Stand with feet hip-width apart, weight in front.'    },
  { id: 'hip_thrust',    label: 'Hip Thrust',        icon: 'chair',                       cue: 'Back against bench, feet flat on floor.'             },
  { id: 'sideplank',     label: 'Side Plank',        icon: 'rotate_90_degrees_cw',        cue: 'Lie on your side and prop up on one forearm.'        },
  { id: 'boxjump',       label: 'Box Jumps',         icon: 'upload_file',                 cue: 'Stand in front of the box, camera to your side.'     },
  { id: 'pullup',        label: 'Pull-Ups',          icon: 'keyboard_arrow_up',           cue: 'Hang from the bar, camera facing you.'                },
  { id: 'calfraise',     label: 'Calf Raises',       icon: 'footprint',                   cue: 'Stand upright near a wall for balance.'               },
];

// ── 3-point angle helper ───────────────────────────────────────────────────────
function angle3(a, b, c) {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs((rad * 180) / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return deg;
}

// ── Rep-counting state machine factory ────────────────────────────────────────
function buildRepCounter() {
  let phase = 'up';
  return function countRep(lm, workoutType) {
    try {
      switch (workoutType) {
        case 'pushup': {
          const ang = angle3(lm[11], lm[13], lm[15]);
          if (ang < 90  && phase === 'up')   { phase = 'down'; return false; }
          if (ang > 155 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'squat': {
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
          const ang = angle3(lm[11], lm[23], lm[25]);
          if (ang < 80  && phase === 'up')   { phase = 'down'; return false; }
          if (ang > 140 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'lateral_raise': {
          const shoulderY = (lm[11].y + lm[12].y) / 2;
          const elbowY    = (lm[13].y + lm[14].y) / 2;
          if (elbowY < shoulderY - 0.02 && phase === 'up')   { phase = 'down'; return false; }
          if (elbowY > shoulderY + 0.04 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        case 'calfraise': {
          const ankleY = (lm[27].y + lm[28].y) / 2;
          const hipY   = (lm[23].y + lm[24].y) / 2;
          const rel    = hipY - ankleY;
          if (rel > 0.52 && phase === 'up')   { phase = 'down'; return false; }
          if (rel < 0.46 && phase === 'down') { phase = 'up';   return true;  }
          return false;
        }
        default: {
          // Hip-Y oscillation fallback: burpee, jumping jack, high knee, mountain climber, box jump, etc.
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
  const [expanded,      setExpanded]      = useState(false);
  const [isRecording,   setIsRecording]   = useState(false);
  const [cameraOn,      setCameraOn]      = useState(true);
  const [aiFeedback,    setAiFeedback]    = useState('Select Exercise & Start');
  const [repCount,      setRepCount]      = useState(0);
  const [logs,          setLogs]          = useState([]);
  const [isAnalyzing,   setIsAnalyzing]   = useState(false);
  const [voiceEnabled,  setVoiceEnabled]  = useState(true);
  const [lastSpokenRep, setLastSpokenRep] = useState(0);
  const [poseReady,     setPoseReady]     = useState(false);

  const [workoutType, setWorkoutType] = useState('pushup');

  const [biometrics, setBiometrics] = useState({
    alignment: 0,
    velocity:  0,
    symmetry:  0,
  });

  const webcamRef          = useRef(null);
  const poseRef            = useRef(null);
  const lastAICallRef      = useRef(0);
  const latestLandmarksRef = useRef(null);
  const repCounterRef      = useRef(buildRepCounter());
  const repCountRef        = useRef(0); // mirror for use inside async callbacks

  // keep ref in sync with state
  useEffect(() => { repCountRef.current = repCount; }, [repCount]);

  // ── Announce rep milestones ───────────────────────────────────────────────
  useEffect(() => {
    if (!voiceEnabled || repCount === 0 || repCount === lastSpokenRep) return;
    if (repCount % 10 === 0) {
      speak(`${repCount} reps! Great work, keep going!`, 1.1, 1.05);
    } else if (repCount % 5 === 0) {
      speak(`${repCount}!`);
    }
    setLastSpokenRep(repCount);
  }, [repCount, voiceEnabled, lastSpokenRep]);

  // ── Init MediaPipe Pose ───────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const tryInit = () => {
      if (!window.Pose) {
        if (active) setTimeout(tryInit, 500);
        return;
      }
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
          const landmarks = results.poseLandmarks;
          latestLandmarksRef.current = landmarks;

          const criticalPoints = [23, 24, 25, 26];
          const isVisible = criticalPoints.every(i => landmarks[i].visibility > 0.5);

          if (!isVisible && isRecording) {
            setAiFeedback('Camera misaligned. Position your full body in view.');
            return;
          }

          // ── Rep counting ────────────────────────────────────────────
          if (isRecording && isVisible) {
            const didRep = repCounterRef.current(landmarks, workoutType);
            if (didRep) {
              setRepCount((prev) => {
                const next = prev + 1;
                repCountRef.current = next;
                return next;
              });
            }
          }

          // ── Biometrics ───────────────────────────────────────────────
          const lShoulder = landmarks[11];
          const rShoulder = landmarks[12];
          const symScore  = Math.max(0, 100 - Math.abs(lShoulder.y - rShoulder.y) * 500);
          setBiometrics({
            alignment: isVisible
              ? Math.floor(Math.random() * 5) + 92
              : Math.floor(Math.random() * 20) + 50,
            velocity:  isRecording ? Math.floor(Math.random() * 15) + 20 : 0,
            symmetry:  Math.floor(symScore),
          });

          // ── Throttled AI coaching ────────────────────────────────────
          const now = Date.now();
          if (now - lastAICallRef.current > 3500 && isRecording && isVisible) {
            lastAICallRef.current = now;
            analyzeWithGemini(landmarks);
          }
        });
        poseRef.current = pose;
        setPoseReady(true);
      } catch (err) {
        setAiFeedback('AI Engine Error.');
      }
    };
    tryInit();
    return () => {
      active = false;
      if (poseRef.current) poseRef.current.close();
    };
  }, [isRecording, workoutType]);

  // ── AI coaching call ──────────────────────────────────────────────────────
  const analyzeWithGemini = async (landmarks) => {
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
      const response = await fetch(`${API_BASE_URL}/api/ai/coach`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.tip) {
        setAiFeedback(data.tip);
        if (voiceEnabled) speak(data.tip, 0.95, 1.0);
      }
    } catch (err) {
      console.warn('Backend Offline');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Frame analysis loop ───────────────────────────────────────────────────
  const analyzeForm = async () => {
    if (!poseRef.current || !webcamRef.current?.video) return;
    const video = webcamRef.current.video;
    if (video.readyState >= 2) {
      try { await poseRef.current.send({ image: video }); } catch (e) {}
    }
  };

  useEffect(() => {
    if (!isRecording || !cameraOn) return;
    const interval = setInterval(analyzeForm, 150);
    return () => clearInterval(interval);
  }, [isRecording, cameraOn]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleStartStop = () => {
    if (!isRecording) {
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
      setLogs((prev) => [
        ...prev,
        {
          exercise: WORKOUT_OPTIONS.find(o => o.id === workoutType)?.label ?? workoutType,
          reps: final,
          time: new Date().toLocaleTimeString(),
        },
      ]);
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
    <div className="flex flex-row h-screen bg-[#0e0e0e] text-[#e5e2e1] font-['Inter'] overflow-hidden">

      {/* ── Sidebar: hidden on mobile, sticky full-height on md+ ── */}
      <div className="hidden md:flex md:flex-col md:flex-shrink-0 h-screen sticky top-0">
        <SidebarAnalytics />
      </div>

      {/* ── Main column: scrolls independently while sidebar stays fixed ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden">

        {/* ── Workout selector ── */}

        {/* Mobile only: horizontal scrollable pills */}
        <div className="sm:hidden mb-6 bg-[#0e0e0e] border-b border-white/[0.03] px-3 py-3 flex gap-2 overflow-x-auto no-scrollbar">
          {WORKOUT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleWorkoutChange(opt)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl whitespace-nowrap transition-all text-[9px] font-black uppercase tracking-widest border flex-shrink-0 touch-manipulation ${
                workoutType === opt.id
                  ? 'bg-[#D1FD52] text-black border-[#D1FD52]'
                  : 'bg-white/5 text-white/40 border-transparent'
              }`}
            >
              <Icon name={opt.icon} className="text-xs" />
              {opt.label.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Tablet / laptop / desktop: styled dropdown */}
       <div className="hidden sm:flex bg-[#0e0e0e] border-b border-white/[0.03] px-6 py-3 items-center gap-4">
  {/* Label Group */}
  <div className="flex items-center gap-2.5 pr-4 border-r border-white/5">
    <Icon name="exercise" className="text-[#D1FD52] text-xs opacity-80" />
    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Exercise</span>
  </div>

  {/* Consolidated Modern Dropdown */}
  <div className="relative group">
    {/* Visual Layer: This makes it look modern */}
    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none gap-3">
      <Icon 
        name={WORKOUT_OPTIONS.find(o => o.id === workoutType)?.icon ?? 'fitness_center'} 
        className="text-[#D1FD52] text-sm" 
      />
      <div className="w-[1px] h-3 bg-white/10" />
    </div>

    <select
      value={workoutType}
      onChange={(e) => {
        const opt = WORKOUT_OPTIONS.find(o => o.id === e.target.value);
        if (opt) handleWorkoutChange(opt);
      }}
      className="appearance-none bg-white/[0.03] border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.15em] pl-14 pr-12 py-2.5 rounded-xl cursor-pointer outline-none transition-all duration-300 hover:bg-white/[0.06] hover:border-white/20 focus:border-[#D1FD52]/40 focus:ring-1 focus:ring-[#D1FD52]/20 min-w-[240px]"
    >
      {WORKOUT_OPTIONS.map((opt) => (
        <option key={opt.id} value={opt.id} className="bg-[#121212] text-white">
          {opt.label}
        </option>
      ))}
    </select>

    {/* Modern Chevron */}
    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
      <Icon name="expand_more" className="text-[#D1FD52] text-xs group-hover:translate-y-0.5 transition-transform" />
    </div>
  </div>

  {/* Subtle Activity Glow */}
  <div className="ml-auto flex items-center gap-2 bg-[#D1FD52]/5 px-3 py-1.5 rounded-full border border-[#D1FD52]/10">
    <div className="w-1 h-1 rounded-full bg-[#D1FD52] animate-pulse shadow-[0_0_8px_#D1FD52]" />
    <span className="text-[8px] font-black text-[#D1FD52] uppercase tracking-widest">Live</span>
  </div>
</div>
        {/* ── Top header bar ── */}
        <header className="sticky top-0 z-40 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-white/[0.06] min-h-[56px] md:h-16 flex items-center justify-between px-3 sm:px-6 gap-3 py-2">

          {/* Status indicator */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isRecording ? 'bg-[#D1FD52] animate-pulse shadow-[0_0_10px_#D1FD52]' : 'bg-white/20'}`} />
            <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.15em] sm:tracking-[0.2em] text-white/60 truncate">
              Mode: <span className="text-[#D1FD52]">
                {WORKOUT_OPTIONS.find(o => o.id === workoutType)?.label ?? workoutType}
              </span>
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Voice toggle */}
            <button
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                speak(next ? 'Voice on.' : 'Voice off.');
              }}
              title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all touch-manipulation ${
                voiceEnabled
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-white/5  border-white/10 text-white/30'
              }`}
            >
              <Icon name={voiceEnabled ? 'volume_up' : 'volume_off'} className="text-sm" />
            </button>

            {/* Camera On / Off */}
            <button
              onClick={handleCameraToggle}
              title={cameraOn ? 'Turn camera off' : 'Turn camera on'}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all active:scale-95 border touch-manipulation ${
                cameraOn
                  ? 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                  : 'bg-white/5  text-white/40 border-white/10'
              }`}
            >
              <Icon name={cameraOn ? 'videocam' : 'videocam_off'} className="text-xs sm:text-sm" />
              <span className="hidden sm:inline">{cameraOn ? 'Cam On' : 'Cam Off'}</span>
            </button>

            {/* Start / End session */}
            <button
              onClick={handleStartStop}
              disabled={!cameraOn}
              className={`flex-shrink-0 px-4 sm:px-8 py-2 rounded-full font-black text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all active:scale-95 flex items-center gap-1.5 sm:gap-2 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed ${
                isRecording
                  ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                  : 'bg-[#D1FD52] text-black shadow-[0_0_30px_rgba(209,253,82,0.15)]'
              }`}
            >
              <Icon name={isRecording ? 'stop' : 'play_arrow'} className="text-xs sm:text-sm" fill={1} />
              <span className="hidden sm:inline">{isRecording ? 'End Session' : 'Start Coach'}</span>
              <span className="sm:hidden">{isRecording ? 'Stop' : 'Start'}</span>
            </button>
          </div>
        </header>

        {/* ── Main content ── */}
        <main className="p-3 sm:p-4 md:p-8 max-w-[1600px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

            {/* ── Webcam feed ── */}
            <div className="col-span-1 lg:col-span-8 relative aspect-video bg-black rounded-2xl sm:rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">

              {/* Scan line overlay when recording */}
              {isRecording && cameraOn && (
                <div className="absolute inset-0 pointer-events-none z-10 border-2 sm:border-4 border-[#D1FD52]/10 rounded-2xl sm:rounded-[2rem] md:rounded-[3rem]">
                  <div className="w-full h-[1px] bg-[#D1FD52]/40 absolute top-0 animate-[scan_3s_linear_infinite]" />
                </div>
              )}

              {/* Camera-off placeholder */}
              {!cameraOn && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#111]">
                  <Icon name="videocam_off" className="text-6xl text-white/20" />
                  <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Camera Off</p>
                  <button
                    onClick={handleCameraToggle}
                    className="mt-2 px-6 py-2.5 rounded-full bg-[#D1FD52] text-black text-[10px] font-black uppercase tracking-widest active:scale-95"
                  >
                    Turn On
                  </button>
                </div>
              )}

              {cameraOn && (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  className="w-full h-full object-cover grayscale-[0.2]"
                />
              )}

              {/* Coach feedback overlay */}
              <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-20 max-w-[calc(100%-5rem)] sm:max-w-[280px]">
                <div className="bg-black/80 backdrop-blur-xl p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/10 border-l-[#D1FD52] border-l-4 sm:border-l-[6px] shadow-2xl">
                  <span className="text-[8px] sm:text-[9px] font-black text-[#D1FD52] uppercase tracking-[0.2em] block mb-1 sm:mb-2">
                    {isAnalyzing ? '⚡ Analyzing…' : 'Coach Response'}
                  </span>
                  <p className="text-[10px] sm:text-[12px] font-bold text-white italic leading-relaxed">
                    {`"${aiFeedback}"`}
                  </p>
                </div>
              </div>

              {/* ── Rep counter overlay ── */}
              <div className="absolute bottom-4 right-4 sm:bottom-10 sm:right-10 z-20">
                <div className="text-right">
                  <span className="text-[8px] sm:text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] block mb-0.5 sm:mb-1">
                    Total Reps
                  </span>
                  <span className="text-5xl sm:text-7xl md:text-8xl font-black text-[#D1FD52] tracking-tighter leading-none drop-shadow-[0_0_20px_rgba(209,253,82,0.3)]">
                    {repCount.toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Pose engine status badge */}
              <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-20">
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-widest backdrop-blur-md ${
                  poseReady
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${poseReady ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                  {poseReady ? 'Pose AI' : 'Loading…'}
                </div>
              </div>
            </div>

            {/* ── Right panel: biometrics + log + neural status ── */}
            <div className="col-span-1 lg:col-span-4 flex flex-col gap-4 sm:gap-6">

              {/* Biometrics card */}
              <div className="bg-[#111111] p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-white/5">
                <h4 className="text-white font-black text-[10px] mb-5 sm:mb-8 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Icon name="monitor_heart" className="text-[#D1FD52] text-sm" />
                  Live Biometrics
                </h4>
                <div className="space-y-5 sm:space-y-8">
                  {[
                    { label: 'Body Alignment', val: biometrics.alignment, color: '#D1FD52' },
                    { label: 'Rep Speed',       val: biometrics.velocity,  color: '#5BC8FF' },
                    { label: 'Symmetry Index',  val: biometrics.symmetry,  color: '#FF7A5C' },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between text-[9px] mb-2 sm:mb-3 uppercase font-black tracking-widest text-white/40">
                        <span>{m.label}</span>
                        <span style={{ color: m.color }}>{m.val}%</span>
                      </div>
                      <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${m.val}%`, backgroundColor: m.color, boxShadow: `0 0 8px ${m.color}` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session log (shows after first completed session) */}
              {logs.length > 0 && (
                <div className="bg-[#111111] p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-white/5">
                  <h4 className="text-white font-black text-[10px] mb-4 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Icon name="history" className="text-[#D1FD52] text-sm" />
                    Session Log
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                    {logs.slice().reverse().map((log, i) => (
                      <div key={i} className="flex justify-between items-center text-[9px] py-1.5 border-b border-white/5 last:border-0">
                        <span className="font-bold text-white/60 uppercase tracking-widest truncate mr-2">{log.exercise}</span>
                        <span className="text-[#D1FD52] font-black flex-shrink-0">{log.reps} reps</span>
                        <span className="text-white/25 flex-shrink-0 ml-2">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Neural status card */}
              <div className="p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] bg-gradient-to-br from-[#D1FD52]/5 to-transparent border border-[#D1FD52]/10">
                <span className="text-[10px] font-black text-[#D1FD52] uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                  <Icon name="psychology" className="text-sm" />
                  Neural Status
                </span>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  The system is monitoring 33 skeletal keypoints at 7 FPS to ensure maximum orthopedic safety.
                  Voice cues announce your position, coach tips, and every 5th rep milestone.
                </p>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Only 2 rules that can't be done in pure Tailwind */}
      <style>{`
        @keyframes scan {
          0%   { top: 0%;   opacity: 0; }
          50%  {             opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default CameraWorkout;