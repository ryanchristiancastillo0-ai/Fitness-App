import { Icon } from "../../../components";
import { WORKOUT_OPTIONS } from "../constants/workout";

export default function MobileWorkoutPills({ workoutType, onSelect }) {
  return (
    <div className="sm:hidden mb-6 bg-[#0e0e0e] border-b border-white/[0.03] px-3 py-3 flex gap-2 overflow-x-auto no-scrollbar">
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
