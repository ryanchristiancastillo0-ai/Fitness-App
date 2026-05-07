import { Icon } from "../../../components";
export default function CameraToggleButton({ cameraOn, onToggle }) {
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
