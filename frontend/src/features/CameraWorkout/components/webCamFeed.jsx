import { Icon } from "../../../components";
import ScanLineOverlay from "./scanLineOverlay";
import CameraOffPlaceholder from "./cameraOffPlaceholder";
import Webcam from "react-webcam";
import CoachFeedbackOverlay from "./coachFeedbackOverlay";
import RepCounterOverlay from "./repCounterOverlay";
import PoseStatusBadge from "./poseStatusBadge";

export default function WebcamFeed({ webcamRef, cameraOn, isRecording, poseReady, loadError, aiFeedback, isAnalyzing, repCount, onCameraToggle }) {
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
