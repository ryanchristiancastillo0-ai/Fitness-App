import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { AnalyticsMobileNav, Icon, SidebarAnalytics } from '../../../components';
import { useAuth } from '../../../hooks/useAuth';
import { WORKOUT_OPTIONS } from '../constants/workout';
import { useRepCounter, speak } from '../hooks/useRepCounter';
import { useAICoach }           from '../hooks/useAICoach';
import { usePoseEngine }        from '../hooks/usePoseEngine';
import { useWorkoutSession }    from '../hooks/useWorkoutSession';
import { API_BASE_URL }         from '../../../config/port';

import { useNavigate } from 'react-router-dom';

import {WebcamFeed, SessionHeader,BiometricBar,BiometricsCard,CameraOffPlaceholder,CameraToggleButton,CoachFeedbackOverlay,
  DesktopWorkoutSelector,MobileWorkoutPills,NeuralStatusCard,PoseStatusBadge,RepcounterOverlay,
  RightPanel,ScanLineOverlay,SessionLog,
  SessionLogRow,StartStopButton,VoiceToggleButton,
 } from '../components';

// ══════════════════════════════════════════════════════════════════════════════
// Main component
// ══════════════════════════════════════════════════════════════════════════════
const CameraWorkout = () => {
  // ✅ useAuth called here so `user` is defined throughout the component
  const { user } = useAuth();
  const navigate = useNavigate()

  const [isRecording,     setIsRecording]     = useState(false);
  const [cameraOn,        setCameraOn]        = useState(() => localStorage.getItem('vitalis_cameraOn') !== 'false');
  const [voiceEnabled,    setVoiceEnabled]    = useState(() => localStorage.getItem('vitalis_voiceEnabled') !== 'false');
  const [workoutType,     setWorkoutType]     = useState('pushup');
  const [logs,            setLogs]            = useState([]);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [biometrics,      setBiometrics]      = useState({ alignment: 0, velocity: 0, symmetry: 0 });

  const webcamRef = useRef(null);

  const { repCount, repCountRef, countRep, resetReps }          = useRepCounter({ workoutType, voiceEnabled });
  const { aiFeedback, isAnalyzing, setAiFeedback, maybeAnalyze } = useAICoach({ workoutType, voiceEnabled });
  const { startSession, endSession }                             = useWorkoutSession();

  const { poseReady, loadError } = usePoseEngine({
    isRecording,
    cameraOn,
    webcamRef,
    workoutType,
    onPoseResult: (landmarks, type, noDetectCount) => {
      if (!landmarks) {
        if (isRecording) {
          if (noDetectCount === 3) {
            const msg = 'Camera blocked — step back so your full body is visible';
            setAiFeedback(msg);
            if (voiceEnabled) speak(msg, 0.95, 1.0);
          }
          maybeAnalyze(null);
        }
        setBiometrics({ alignment: 0, velocity: 0, symmetry: 0 });
        return;
      }

      const upperBody   = ['pushup', 'bicep_curl', 'overhead', 'lateral_raise'];
      const checkPoints = upperBody.includes(type) ? [11, 12, 13, 14] : [23, 24, 25, 26];
      const isVisible   = checkPoints.every(i => landmarks[i] && landmarks[i].visibility > 0.4);

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
      // ✅ Fire-and-forget — button responds instantly
      startSession(workoutType).catch(err =>
        console.warn('[startSession] background error:', err)
      );
      resetReps();
      const opt = WORKOUT_OPTIONS.find(o => o.id === workoutType);
      const msg = `Starting ${opt?.label ?? workoutType}. ${opt?.cue ?? ''}`;
      setAiFeedback(msg);
      if (voiceEnabled) speak(msg, 0.95, 1.0);

    } else {
      // ✅ Fire-and-forget
      endSession('completed', repCountRef.current).catch(err =>
        console.warn('[endSession] background error:', err)
      );
      const final = repCountRef.current;
      const opt   = WORKOUT_OPTIONS.find(o => o.id === workoutType);
      const msg   = `Session complete! You did ${final} ${final === 1 ? 'rep' : 'reps'}. Great work!`;
      setAiFeedback(msg);
      if (voiceEnabled) speak(msg, 1.0, 1.05);
      setLogs(prev => [...prev, {
        exercise: opt?.label ?? workoutType,
        reps:     final,
        time:     new Date().toLocaleTimeString(),
      }]);

      // ✅ user is now defined — notification is fire-and-forget too
      if (user?.id) {
        fetch(`${API_BASE_URL}/api/notifications`, {
          method:      'POST',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            user_id: user.id,
            message: `Workout complete! You finished ${opt?.label ?? workoutType} with ${final} ${final === 1 ? 'rep' : 'reps'}.`,
            type:    'info',
          }),
        }).catch(err => console.error('Notification failed:', err));
      }
    }

    setIsRecording(r => !r); // ← triggers instantly
  };

  const handleCameraToggle = () => {
    const next = !cameraOn;
    setCameraOn(next);
    localStorage.setItem('vitalis_cameraOn', String(next));
    if (!next && isRecording) setIsRecording(false);
    if (voiceEnabled) speak(next ? 'Camera on.' : 'Camera off.');
  };

  const handleVoiceToggle = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    localStorage.setItem('vitalis_voiceEnabled', String(next));
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

       <AnalyticsMobileNav navigate={navigate} />
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