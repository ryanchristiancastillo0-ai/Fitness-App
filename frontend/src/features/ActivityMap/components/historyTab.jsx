 const HistoryTab = ({ history, historyLoading, historyError, formatTime, onRefresh, onDelete }) => (
  <div className="h-full overflow-y-auto">
    <div className="p-3 sm:p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h2 className="text-base sm:text-lg md:text-xl font-black italic tracking-tighter uppercase text-white/90">
          Activity History
        </h2>
        <button
          onClick={onRefresh}
          className="text-[10px] font-black uppercase tracking-[0.15em] text-[#D1FD52] hover:opacity-70 transition-opacity"
        >
          ↺ Refresh
        </button>
      </div>

      {historyLoading && (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <div className="w-6 h-6 border-2 border-white/10 border-t-[#D1FD52] rounded-full animate-spin" />
        </div>
      )}
      {historyError && (
        <div className="text-center py-16 sm:py-20 text-red-400 text-sm">
          ⚠ {historyError}<br />
          <span className="text-white/30 text-xs">Is your backend running?</span>
        </div>
      )}
      {!historyLoading && !historyError && history.length === 0 && (
        <div className="text-center py-16 sm:py-20 text-white/20">
          <div className="text-3xl sm:text-4xl mb-3">🏃</div>
          <p className="text-sm">No activities yet. Complete a run!</p>
        </div>
      )}
      {!historyLoading && !historyError && history.length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          {history.map(activity => {
            const d = new Date(activity.created_at || Date.now());
            return (
              <div
                key={activity.id}
                className="bg-[#1a1a1a] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 hover:border-[#D1FD52]/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <p className="text-[9px] sm:text-[10px] text-white/30 font-semibold">
                    {d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' · '}
                    {d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#D1FD52] bg-[#D1FD52]/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">Run</span>
                    <button
                      onClick={() => onDelete(activity.id)}
                      className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/15 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {[
                    { val: parseFloat(activity.distance || 0).toFixed(2), label: 'km'   },
                    { val: formatTime(activity.duration),                  label: 'time' },
                    { val: activity.pace || '–',                           label: 'pace' },
                    { val: activity.calories || 0,                         label: 'kcal' },
                  ].map(({ val, label }) => (
                    <div key={label}>
                      <p className="text-sm sm:text-base md:text-lg font-black italic tracking-tight text-white">{val}</p>
                      <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.15em] text-white/25">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);
export default HistoryTab