import { useState } from "react";
import { Icon } from "../../../components";
import { WORKOUT_OPTIONS } from "../constants/workout";

export default function MobileWorkoutPills({ workoutType, onSelect }) {
  const [open, setOpen] = useState(false);
  const current = WORKOUT_OPTIONS.find(o => o.id === workoutType);

  const handleSelect = (opt) => {
    onSelect(opt);
    setOpen(false);
  };

  return (
    <>
      {/* ── Trigger bar ── */}
      <div className="sm:hidden bg-[#0e0e0e] border-b border-white/[0.03] px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name={current?.icon ?? 'fitness_center'} className="text-[#D1FD52] text-base" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
            {current?.label ?? 'Select Exercise'}
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D1FD52]/10 border border-[#D1FD52]/30 text-[#D1FD52] text-[9px] font-black uppercase tracking-widest touch-manipulation"
        >
          <Icon name="swap_vert" className="text-xs" />
          Change
        </button>
      </div>

      {/* ── Modal backdrop ── */}
      {open && (
        <div
          className="sm:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end"
          onClick={() => setOpen(false)}
        >
          {/* ── Bottom sheet ── */}
          <div
            className="w-full bg-[#0e0e0e] border-t border-white/10 rounded-t-3xl p-5 pb-10"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">
              Select Exercise
            </p>

            <div className="grid grid-cols-3 gap-3">
              {WORKOUT_OPTIONS.map((opt) => {
                const active = workoutType === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all touch-manipulation ${
                      active
                        ? 'bg-[#D1FD52] border-[#D1FD52] text-black'
                        : 'bg-white/5 border-white/10 text-white/60 active:bg-white/10'
                    }`}
                  >
                    <Icon
                      name={opt.icon}
                      className={`text-2xl ${active ? 'text-black' : 'text-[#D1FD52]'}`}
                    />
                    <span className="text-[9px] font-black uppercase tracking-widest leading-tight text-center">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}