 const RunAnalysisOverlay = ({ analysis, onClose }) => {
  if (!analysis) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#D1FD52]/10 to-transparent px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{analysis.emoji_verdict}</span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#D1FD52]">AI Run Analysis</p>
              <p className="text-[10px] text-white/40">Powered by Vitalis AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border-none cursor-pointer transition-colors"
          >
            <span className="text-white/50 text-sm">✕</span>
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 px-5 py-3 border-b border-white/[0.06]">
          {[
            { label: 'Distance', val: `${analysis.stats.distance}km` },
            { label: 'Time',     val: analysis.stats.duration        },
            { label: 'Pace',     val: analysis.stats.pace            },
            { label: 'Calories', val: `${analysis.stats.calories}`   },
          ].map(({ label, val }) => (
            <div key={label} className="text-center">
              <p className="text-[11px] sm:text-[13px] font-black text-white">{val}</p>
              <p className="text-[8px] uppercase tracking-widest text-white/30 font-bold">{label}</p>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">

          {/* Summary */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#D1FD52]/60 mb-1.5">Run Summary</p>
            <p className="text-[12px] sm:text-[13px] text-white/80 leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Prediction */}
          <div className="bg-[#D1FD52]/[0.05] border border-[#D1FD52]/20 rounded-2xl px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#D1FD52] mb-1.5">🔮 30-Day Prediction</p>
            <p className="text-[12px] sm:text-[13px] text-white/80 leading-relaxed">{analysis.prediction}</p>
          </div>

          {/* Tip */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1.5">💡 Next Run Tip</p>
            <p className="text-[12px] sm:text-[13px] text-white/70 leading-relaxed">{analysis.tip}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full bg-[#D1FD52] text-black rounded-full py-3 text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
          >
            Let's Go! 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
export default RunAnalysisOverlay