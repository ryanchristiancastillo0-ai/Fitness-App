import { WORKOUT_OPTIONS } from "../constants/workout";
import CameraToggleButton from "./cameraToggleButton";
import StartStopButton from "./startStopButton";
import VoiceToggleButton from './voiceToggleButton';

export default function SessionHeader({ workoutType, isRecording, cameraOn, voiceEnabled, onStartStop, onCameraToggle, onVoiceToggle }) {
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