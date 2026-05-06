const RunSummaryOverlay = ({ metrics, splits, formatTime, onSave, onDiscard, isSaving }) => (
  <div className="absolute inset-0 z-[500] pointer-events-none">
    {/* Top badge */}
    <div className="absolute top-0 left-0 right-0 pointer-events-auto">
      <div className="flex items-start justify-center pt-3 sm:pt-4 px-4">
        <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl px-4 sm:px-5 py-2 sm:py-2.5 text-center">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-[#D1FD52]">Run Complete</p>
          <p className="text-[9px] sm:text-[10px] text-white/40 mt-0.5">Route replaying below</p>
        </div>
      </div>
    </div>

    {/* Bottom panel */}
    <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
      <div
        className="bg-gradient-to-t from-black via-black/96 to-transparent pt-8 sm:pt-10 px-3 sm:px-4 md:px-6"
        style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom, 0px) + 5rem))' }}
      >
        {/* Stats grid */}
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
          {[
            { val: (metrics.distance || 0).toFixed(2), label: 'Distance', unit: 'km'   },
            { val: formatTime(metrics.time),            label: 'Time',     unit: ''     },
            { val: metrics.pace || '–',                 label: 'Pace',     unit: '/km'  },
            { val: metrics.calories || 0,               label: 'Calories', unit: 'kcal' },
          ].map(({ val, label, unit }) => (
            <div key={label} className="bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-center">
              <p className="text-base sm:text-lg md:text-xl font-black italic tracking-tighter text-white leading-none">
                {val}
                {unit && <span className="text-[9px] sm:text-[10px] text-white/30 font-semibold ml-0.5">{unit}</span>}
              </p>
              <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.18em] text-white/30 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Splits */}
        {splits.length > 0 && (
          <div className="mb-3 sm:mb-4 max-h-[72px] sm:max-h-[80px] overflow-y-auto space-y-1.5 scrollbar-none">
            {splits.map(s => (
              <div key={s.km} className="flex justify-between bg-white/5 border border-white/5 rounded-xl px-3 sm:px-4 py-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">KM {s.km}</span>
                <span className="text-[10px] font-black italic text-[#D1FD52]">{s.pace}</span>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={onDiscard}
            disabled={isSaving}
            className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full py-2.5 sm:py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-40"
          >
            Discard
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 bg-[#D1FD52] text-black rounded-full py-2.5 sm:py-3 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSaving && <span className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
            {isSaving ? 'Saving…' : 'Save Run'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default RunSummaryOverlay