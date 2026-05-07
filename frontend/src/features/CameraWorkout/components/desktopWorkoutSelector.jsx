import { Icon } from "../../../components";
import { WORKOUT_OPTIONS } from "../constants/workout";

export default function DesktopWorkoutSelector({ workoutType, onSelect }) {
  return (
    <div className="hidden sm:flex flex-wrap bg-[#0e0e0e] border-b border-white/[0.03] px-6 py-3 items-center gap-4">
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