import { Icon } from "../../../components";
export default function StartStopButton({ isRecording, cameraOn, onPress }) {
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