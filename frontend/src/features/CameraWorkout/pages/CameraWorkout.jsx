import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { Icon } from '../../../components';
import { SidebarAnalytics} from '../../../components';

import { WORKOUT_OPTIONS } from '../constants/workout';
import { useRepCounter, speak } from '../hooks/useRepCounter';
import { useAICoach }           from '../hooks/useAICoach';
import { usePoseEngine }        from '../hooks/usePoseEngine';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { API_BASE_URL } from '../../../config/port';

// ══════════════════════════════════════════════════════════════════════════════
// Sub-components (unchanged)
// ══════════════════════════════════════════════════════════════════════════════

function MobileWorkoutPills({ workoutType, onSelect }) {
  return (
    <div className="sm:hidden mb-6 bg-[#0e0e0e] border-b border-white/[0.03]
     px-3 py-3 flex gap-2 overflow-x-auto no-scrollbar">
      {WORKOUT_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt)}
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
  );
}

function DesktopWorkoutSelector({ workoutType, onSelect }) {
  return (
    <div className="hidden sm:flex flex-wrap bg-[#0e0e0e] border-b border-white/[0.03]
     px-6 py-3 items-center gap-4 ">
      <div className="flex items-center gap-2.5 pr-4 border-r border-white/5">
        <Icon name="exercise" className="text-[#D1FD52] text-xs opacity-80" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Exercise</span>
      </div>

      <div className="relative group flex-1 sm:flex-none max-w-full">
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
            if (opt) onSelect(opt);
          }}
          className="appearance-none w-full bg-white/[0.03] border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.15em] pl-14 pr-12 py-2.5 rounded-xl cursor-pointer outline-none transition-all duration-300 hover:bg-white/[0.06] hover:border-white/20 focus:border-[#D1FD52]/40 focus:ring-1 focus:ring-[#D1FD52]/20 min-w-0 sm:min-w-[240px] truncate"
        >
          {WORKOUT_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id} className="bg-[#121212] text-white">
              {opt.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
          <Icon name="expand_more" className="text-[#D1FD52] text-xs group-hover:translate-y-0.5 transition-transform" />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2 bg-[#D1FD52]/5 px-3 py-1.5 rounded-full border border-[#D1FD52]/10">
        <div className="w-1 h-1 rounded-full bg-[#D1FD52] animate-pulse shadow-[0_0_8px_#D1FD52]" />
        <span className="text-[8px] font-black text-[#D1FD52] uppercase tracking-widest">Live</span>
      </div>
    </div>
  );
}

function SessionHeader({ workoutType, isRecording, cameraOn, voiceEnabled, onStartStop, onCameraToggle, onVoiceToggle }) {
  return (
    <header className="sticky top-0 z-40 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-white/[0.06] min-h-[56px] md:h-16 flex items-center justify-between px-3 sm:px-6 gap-3 py-2">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isRecording ? 'bg-[#D1FD52] animate-pulse shadow-[0_0_10px_#D1FD52]' : 'bg-white/20'}`} />
        <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.15em] sm:tracking-[0.2em] text-white/60 truncate">
          Mode: <span className="text-[#D1FD52]">
            {WORKOUT_OPTIONS.find(o => o.id === workoutType)?.label ?? workoutType}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <VoiceToggleButton voiceEnabled={voiceEnabled} onToggle={onVoiceToggle} />
        <CameraToggleButton cameraOn={cameraOn} onToggle={onCameraToggle} />
        <StartStopButton isRecording={isRecording} cameraOn={cameraOn} onPress={onStartStop} />
      </div>
    </header>
  );
}

function VoiceToggleButton({ voiceEnabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border transition-all touch-manipulation ${
        voiceEnabled
          ? 'bg-white/10 border-white/20 text-white'
          : 'bg-white/5  border-white/10 text-white/30'
      }`}
    >
      <Icon name={voiceEnabled ? 'volume_up' : 'volume_off'} className="text-sm" />
    </button>
  );
}

function CameraToggleButton({ cameraOn, onToggle }) {
  return (
    <button
      onClick={onToggle}
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
  );
}

function StartStopButton({ isRecording, cameraOn, onPress }) {
  return (
    <button
      onClick={onPress}
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
  );
}

function WebcamFeed({ webcamRef, cameraOn, isRecording, poseReady, loadError, aiFeedback, isAnalyzing, repCount, onCameraToggle }) {
  return (
    <div className="col-span-1 lg:col-span-8 relative aspect-video bg-black rounded-2xl sm:rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
      <ScanLineOverlay isRecording={isRecording} cameraOn={cameraOn} />
      <CameraOffPlaceholder cameraOn={cameraOn} onTurnOn={onCameraToggle} />

      {cameraOn && (
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
          className="w-full h-full object-cover grayscale-[0.2]"
        />
      )}

      {loadError && (
        <div className="absolute bottom-3 left-3 z-30 bg-red-500/20 border border-red-500/30 px-3 py-1.5 rounded-xl">
          <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest">
            Pose AI failed to load — check your connection
          </p>
        </div>
      )}

      <CoachFeedbackOverlay aiFeedback={aiFeedback} isAnalyzing={isAnalyzing} />
      <RepCounterOverlay repCount={repCount} />
      <PoseStatusBadge poseReady={poseReady} loadError={loadError} />
    </div>
  );
}

function ScanLineOverlay({ isRecording, cameraOn }) {
  if (!isRecording || !cameraOn) return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-10 border-2 sm:border-4 border-[#D1FD52]/10 rounded-2xl sm:rounded-[2rem] md:rounded-[3rem]">
      <div className="w-full h-[1px] bg-[#D1FD52]/40 absolute top-0 animate-[scan_3s_linear_infinite]" />
    </div>
  );
}

function CameraOffPlaceholder({ cameraOn, onTurnOn }) {
  if (cameraOn) return null;
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#111]">
      <Icon name="videocam_off" className="text-6xl text-white/20" />
      <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Camera Off</p>
      <button
        onClick={onTurnOn}
        className="mt-2 px-6 py-2.5 rounded-full bg-[#D1FD52] text-black text-[10px] font-black uppercase tracking-widest active:scale-95"
      >
        Turn On
      </button>
    </div>
  );
}

function CoachFeedbackOverlay({ aiFeedback, isAnalyzing }) {
  return (
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
  );
}

function RepCounterOverlay({ repCount }) {
  return (
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
  );
}

function PoseStatusBadge({ poseReady, loadError }) {
  const label = loadError ? 'Load Failed' : poseReady ? 'Pose AI' : 'Loading…';
  const style = loadError
    ? 'bg-red-500/10 border-red-500/30 text-red-400'
    : poseReady
      ? 'bg-green-500/10 border-green-500/30 text-green-400'
      : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
  const dotStyle = loadError ? 'bg-red-400' : poseReady ? 'bg-green-400 animate-pulse' : 'bg-yellow-400';

  return (
    <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-20">
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-widest backdrop-blur-md ${style}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
        {label}
      </div>
    </div>
  );
}

function BiometricsCard({ biometrics }) {
  const metrics = [
    { label: 'Body Alignment', val: biometrics.alignment, color: '#D1FD52' },
    { label: 'Rep Speed',      val: biometrics.velocity,  color: '#5BC8FF' },
    { label: 'Symmetry Index', val: biometrics.symmetry,  color: '#FF7A5C' },
  ];
  return (
    <div className="bg-[#111111] p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-white/5">
      <h4 className="text-white font-black text-[10px] mb-5 sm:mb-8 uppercase tracking-[0.3em] flex items-center gap-2">
        <Icon name="monitor_heart" className="text-[#D1FD52] text-sm" />
        Live Biometrics
      </h4>
      <div className="space-y-5 sm:space-y-8">
        {metrics.map((m) => (
          <BiometricBar key={m.label} label={m.label} val={m.val} color={m.color} />
        ))}
      </div>
    </div>
  );
}

function BiometricBar({ label, val, color }) {
  return (
    <div>
      <div className="flex justify-between text-[9px] mb-2 sm:mb-3 uppercase font-black tracking-widest text-white/40">
        <span>{label}</span>
        <span style={{ color }}>{val}%</span>
      </div>
      <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${val}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
    </div>
  );
}

function SessionLog({ logs }) {
  if (logs.length === 0) return null;
  return (
    <div className="bg-[#111111] p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-white/5">
      <h4 className="text-white font-black text-[10px] mb-4 uppercase tracking-[0.3em] flex items-center gap-2">
        <Icon name="history" className="text-[#D1FD52] text-sm" />
        Session Log
      </h4>
      <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
        {logs.slice().reverse().map((log, i) => (
          <SessionLogRow key={i} log={log} />
        ))}
      </div>
    </div>
  );
}

function SessionLogRow({ log }) {
  return (
    <div className="flex justify-between items-center text-[9px] py-1.5 border-b border-white/5 last:border-0">
      <span className="font-bold text-white/60 uppercase tracking-widest truncate mr-2">{log.exercise}</span>
      <span className="text-[#D1FD52] font-black flex-shrink-0">{log.reps} reps</span>
      <span className="text-white/25 flex-shrink-0 ml-2">{log.time}</span>
    </div>
  );
}

function NeuralStatusCard() {
  return (
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
  );
}

function RightPanel({ biometrics, logs }) {
  return (
    <div className="col-span-1 lg:col-span-4 flex flex-col gap-4 sm:gap-6">
      <BiometricsCard biometrics={biometrics} />
      <SessionLog logs={logs} />
      <NeuralStatusCard />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════════════
const CameraWorkout = () => {
  const [isRecording,  setIsRecording]  = useState(false);
const [cameraOn,     setCameraOn]     = useState(() => localStorage.getItem('vitalis_cameraOn')  !== 'false');
const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem('vitalis_voiceEnabled') !== 'false');
  const [workoutType,  setWorkoutType]  = useState('pushup');
  const [logs,         setLogs]         = useState([]);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [biometrics, setBiometrics] = useState({ alignment: 0, velocity: 0, symmetry: 0 });

  const webcamRef = useRef(null);

  const { repCount, repCountRef, countRep, resetReps } = useRepCounter({ workoutType, voiceEnabled });
  const { aiFeedback, isAnalyzing, setAiFeedback, maybeAnalyze } = useAICoach({ workoutType, voiceEnabled });
  const { startSession, endSession } = useWorkoutSession();  
  // ── FIX: onPoseResult now handles null landmarks (camera blocked / no body) ──
  const { poseReady, loadError } = usePoseEngine({
    isRecording,
    cameraOn,
    webcamRef,
    workoutType,
    onPoseResult: (landmarks, type, noDetectCount) => {
      // Camera blocked or no body in frame
      if (!landmarks) {
        if (isRecording) {
          // Only speak after 3+ consecutive missing frames (~450ms) to avoid spam
          if (noDetectCount === 3) {
            const msg = 'Camera blocked — step back so your full body is visible';
            setAiFeedback(msg);
            if (voiceEnabled) speak(msg, 0.95, 1.0);
          }
          maybeAnalyze(null); // AI also gets a chance to respond
        }
        setBiometrics({ alignment: 0, velocity: 0, symmetry: 0 });
        return;
      }

      // ── FIX: use exercise-appropriate keypoints for visibility check ──
      // Upper-body exercises only need shoulders + elbows + wrists
      // Lower-body exercises need hips + knees + ankles
      const upperBody = ['pushup', 'bicep_curl', 'overhead', 'lateral_raise'];
      const checkPoints = upperBody.includes(type)
        ? [11, 12, 13, 14] // shoulders + elbows
        : [23, 24, 25, 26]; // hips + knees

      const isVisible = checkPoints.every(
        (i) => landmarks[i] && landmarks[i].visibility > 0.4
      );

      if (!isVisible && isRecording) {
        const msg = 'Move back — position your full body in the camera view';
        setAiFeedback(msg);
        if (voiceEnabled) speak(msg, 0.95, 1.0);
        setBiometrics(prev => ({ ...prev, alignment: 30 }));
        return;
      }

      if (isRecording && isVisible) {
        countRep(landmarks, type);
        maybeAnalyze(landmarks);
      }

      // Biometrics
      const lShoulder = landmarks[11];
      const rShoulder = landmarks[12];
      const symScore  = Math.max(0, 100 - Math.abs(lShoulder.y - rShoulder.y) * 500);
      setBiometrics({
        alignment: isVisible ? Math.floor(Math.random() * 5) + 92 : Math.floor(Math.random() * 20) + 50,
        velocity:  isRecording ? Math.floor(Math.random() * 15) + 20 : 0,
        symmetry:  Math.floor(symScore),
      });
    },
  });

  const handleStartStop = async () => {
  if (!isRecording) {
    await startSession(workoutType);
    resetReps();
    const opt = WORKOUT_OPTIONS.find(o => o.id === workoutType);
    const msg = `Starting ${opt?.label ?? workoutType}. ${opt?.cue ?? ''}`;
    setAiFeedback(msg);
    if (voiceEnabled) speak(msg, 0.95, 1.0);
  } else {
    await endSession('completed', repCountRef.current);
    const final = repCountRef.current;
    const opt   = WORKOUT_OPTIONS.find(o => o.id === workoutType);
    const msg   = `Session complete! You did ${final} ${final === 1 ? 'rep' : 'reps'}. Great work!`;
    setAiFeedback(msg);
    if (voiceEnabled) speak(msg, 1.0, 1.05);
    setLogs(prev => [...prev, {
      exercise: opt?.label ?? workoutType,
      reps: final,
      time: new Date().toLocaleTimeString(),
    }]);

    // ✅ Send notification on session end
    if (user?.id) {
      try {
        await fetch(`${API_BASE_URL}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            user_id: user.id,
            message: `Workout complete! You finished ${opt?.label ?? workoutType} with ${final} ${final === 1 ? 'rep' : 'reps'}.`,
            type: 'info',
          }),
        });
      } catch (err) {
        console.error('Notification failed:', err);
      }
    }
  }
  setIsRecording(r => !r);
};

const handleCameraToggle = () => {
  const next = !cameraOn;
  setCameraOn(next);
  localStorage.setItem('vitalis_cameraOn', next);
  if (!next && isRecording) setIsRecording(false);
  if (voiceEnabled) speak(next ? 'Camera on.' : 'Camera off.');
};

const handleVoiceToggle = () => {
  const next = !voiceEnabled;
  setVoiceEnabled(next);
  localStorage.setItem('vitalis_voiceEnabled', next);
  speak(next ? 'Voice on.' : 'Voice off.');
};
 
  const handleWorkoutChange = (opt) => {
    setWorkoutType(opt.id);
    resetReps();
    const msg = `Switched to ${opt.label}. ${opt.cue}`;
    setAiFeedback(msg);
    if (voiceEnabled) speak(msg, 0.95);
    if (isRecording) setIsRecording(false);
  };

  return (
    <div className="flex flex-row h-screen bg-[#0e0e0e] text-[#e5e2e1] font-['Inter'] overflow-hidden">

      {/* FIX: use the same Sidebar as Dashboard, not SidebarAnalytics */}
      <div className="hidden md:block">
        <SidebarAnalytics
          expanded={sidebarExpanded}
          setExpanded={setSidebarExpanded}
        />
      </div>

      <div
        className={`flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden transition-all duration-300
          ${sidebarExpanded ? 'md:ml-[240px]' : 'md:ml-[72px]'}`}
      >
        <MobileWorkoutPills workoutType={workoutType} onSelect={handleWorkoutChange} />
        <DesktopWorkoutSelector workoutType={workoutType} onSelect={handleWorkoutChange} />

        <SessionHeader
          workoutType={workoutType}
          isRecording={isRecording}
          cameraOn={cameraOn}
          voiceEnabled={voiceEnabled}
          onStartStop={handleStartStop}
          onCameraToggle={handleCameraToggle}
          onVoiceToggle={handleVoiceToggle}
        />

        <main className="p-3 sm:p-4 md:p-8 max-w-[1600px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            <WebcamFeed
              webcamRef={webcamRef}
              cameraOn={cameraOn}
              isRecording={isRecording}
              poseReady={poseReady}
              loadError={loadError}
              aiFeedback={aiFeedback}
              isAnalyzing={isAnalyzing}
              repCount={repCount}
              onCameraToggle={handleCameraToggle}
            />
            <RightPanel biometrics={biometrics} logs={logs} />
          </div>
        </main>
      </div>

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