import { Icon } from "../../../components";
import ScanLineOverlay from "./scanLineOverlay";
import CameraOffPlaceholder from "./cameraOffPlaceholder";
import Webcam from "react-webcam";
import CoachFeedbackOverlay from "./coachFeedbackOverlay";
import RepCounterOverlay from "./repCounterOverlay";
import PoseStatusBadge from "./poseStatusBadge";

// On mobile we want a tall portrait crop so the full body is visible.
// On desktop the original landscape aspect-video is fine.
const mobileConstraints  = { facingMode: 'user', width: 480,  height: 640 };
const desktopConstraints = { facingMode: 'user', width: 1280, height: 720 };

function useIsMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

export default function WebcamFeed({
  webcamRef,
  cameraOn,
  isRecording,
  poseReady,
  loadError,
  aiFeedback,
  isAnalyzing,
  repCount,
  onCameraToggle,
}) {
  const isMobile = useIsMobile();
  const videoConstraints = isMobile ? mobileConstraints : desktopConstraints;

  return (
    <div
      className={[
        'col-span-1 lg:col-span-8 relative bg-black overflow-hidden',
        'border border-white/5 shadow-2xl',
        'rounded-2xl sm:rounded-[2rem] md:rounded-[3rem]',
        // Mobile: tall portrait so full body fits; desktop: classic 16/9
        'aspect-[3/4] sm:aspect-[4/5] md:aspect-video',
        // On mobile stretch to full available width
        'w-full',
      ].join(' ')}
    >
      <ScanLineOverlay isRecording={isRecording} cameraOn={cameraOn} />
      <CameraOffPlaceholder cameraOn={cameraOn} onTurnOn={onCameraToggle} />

      {cameraOn && (
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="absolute inset-0 w-full h-full object-cover grayscale-[0.2]"
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