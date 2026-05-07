import { useState } from "react";

 const StatsPanel = ({ metrics, splits, formatTime, isDesktop }) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isDesktop) {
    return (
      <div className="w-[300px] xl:w-[340px] 2xl:w-[380px] flex-shrink-0 bg-[#131313] flex flex-col gap-4 xl:gap-5 p-4 xl:p-5 overflow-y-auto border-l border-white/5">
        <h2 className="text-base xl:text-lg font-black italic tracking-tighter uppercase text-white/90">Run Session</h2>

        <div className="grid grid-cols-2 gap-2 xl:gap-3">
          {[
            { label: 'Time',      val: formatTime(metrics.time)    },
            { label: 'Dist (km)', val: metrics.distance.toFixed(2) },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white/5 p-3 xl:p-4 rounded-2xl border border-white/5">
              <p className="text-[9px] text-white/30 uppercase font-black tracking-[0.2em] mb-1">{label}</p>
              <h3 className="text-xl xl:text-2xl font-black italic tracking-tighter">{val}</h3>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-3 xl:p-4 rounded-2xl bg-[#D1FD52]/5 border border-[#D1FD52]/10">
          <div className="flex items-center gap-2 xl:gap-3">
            <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-[#D1FD52] flex items-center justify-center text-black font-black text-sm">P</div>
            <div>
              <p className="text-xs font-bold text-white">Pace</p>
              <p className="text-[9px] text-white/40 uppercase">Min/KM</p>
            </div>
          </div>
          <span className="text-lg xl:text-xl font-black italic text-[#D1FD52]">{metrics.pace}</span>
        </div>

        <div className="flex items-center justify-between p-3 xl:p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 xl:gap-3">
            <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 font-black text-sm">C</div>
            <div>
              <p className="text-xs font-bold text-white">Calories</p>
              <p className="text-[9px] text-white/40 uppercase">Est.</p>
            </div>
          </div>
          <span className="text-lg xl:text-xl font-black italic">{metrics.calories}</span>
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-3 px-1">Splits</p>
          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[200px] xl:max-h-none scrollbar-none">
            {splits.length === 0
              ? <p className="text-[10px] text-white/20 text-center py-3">No splits yet</p>
              : splits.map(s => (
                  <div key={s.km} className="flex justify-between px-3 py-2 xl:py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[9px] font-bold text-white/40">KM {s.km}</span>
                    <span className="text-[10px] font-black italic text-[#D1FD52]">{s.pace}</span>
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    );
  }

  // Mobile bottom sheet
  return (
    <div
      className="absolute left-0 right-0 z-[800] px-3 sm:px-4 pointer-events-auto"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)' }}
    >
      {!sheetOpen ? (
        <button
          onClick={() => setSheetOpen(true)}
          className="w-full bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div>
              <p className="text-[8px] text-white/30 uppercase font-black tracking-widest">Time</p>
              <p className="text-sm sm:text-base font-black italic text-white">{formatTime(metrics.time)}</p>
            </div>
            <div className="w-px h-6 sm:h-7 bg-white/10" />
            <div>
              <p className="text-[8px] text-white/30 uppercase font-black tracking-widest">Dist</p>
              <p className="text-sm sm:text-base font-black italic text-white">{metrics.distance.toFixed(2)} km</p>
            </div>
            <div className="w-px h-6 sm:h-7 bg-white/10" />
            <div>
              <p className="text-[8px] text-white/30 uppercase font-black tracking-widest">Pace</p>
              <p className="text-sm sm:text-base font-black italic text-[#D1FD52]">{metrics.pace}</p>
            </div>
          </div>
          <span className="text-white/30 text-base sm:text-lg ml-2">↑</span>
        </button>
      ) : (
        <div className="w-full bg-[#131313]/95 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#D1FD52]">Run Session</p>
            <button
              onClick={() => setSheetOpen(false)}
              className="text-white/30 text-xs sm:text-sm hover:text-white transition-colors"
            >
              ↓ Close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4">
            {[
              { label: 'Time',      val: formatTime(metrics.time)    },
              { label: 'Dist (km)', val: metrics.distance.toFixed(2) },
              { label: 'Pace',      val: metrics.pace                },
              { label: 'Cal',       val: metrics.calories            },
            ].map(({ label, val }) => (
              <div key={label} className="bg-white/5 rounded-xl p-2.5 sm:p-3 border border-white/5">
                <p className="text-[8px] text-white/30 uppercase font-black tracking-widest mb-0.5">{label}</p>
                <p className="text-lg sm:text-xl font-black italic tracking-tighter">{val}</p>
              </div>
            ))}
          </div>
          {splits.length > 0 && (
            <div className="max-h-[90px] sm:max-h-[100px] overflow-y-auto space-y-1.5 scrollbar-none">
              {splits.map(s => (
                <div key={s.km} className="flex justify-between px-3 py-1.5 sm:py-2 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[9px] font-bold text-white/40">KM {s.km}</span>
                  <span className="text-[10px] font-black italic text-[#D1FD52]">{s.pace}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatsPanel