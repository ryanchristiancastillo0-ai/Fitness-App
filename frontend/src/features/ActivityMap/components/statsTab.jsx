 const StatsTab = ({ stats, statsLoading, statsError, formatTime }) => (
  <div className="h-full overflow-y-auto">
    <div className="p-3 sm:p-4 md:p-6">
      <h2 className="text-base sm:text-lg md:text-xl font-black italic tracking-tighter uppercase text-white/90 mb-4 sm:mb-5">
        Summary Stats
      </h2>
      {statsLoading && (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <div className="w-6 h-6 border-2 border-white/10 border-t-[#D1FD52] rounded-full animate-spin" />
        </div>
      )}
      {statsError && (
        <div className="text-center py-16 sm:py-20 text-red-400 text-sm">⚠ {statsError}</div>
      )}
      {!statsLoading && !statsError && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 max-w-2xl">
          {[
            { label: 'Total Runs',      val: stats.totalRuns ?? '–',                          unit: ''     },
            { label: 'Total Distance',  val: parseFloat(stats.totalDistance || 0).toFixed(1), unit: 'km'   },
            { label: 'Total Time',      val: formatTime(parseInt(stats.totalDuration) || 0),  unit: ''     },
            { label: 'Calories Burned', val: parseInt(stats.totalCalories) || 0,              unit: 'kcal' },
          ].map(({ label, val, unit }) => (
            <div key={label} className="bg-[#1a1a1a] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5">
              <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-1.5 sm:mb-2">{label}</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-black italic tracking-tighter text-[#D1FD52]">
                {val}
                {unit && <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-white/30 ml-1">{unit}</span>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
export default StatsTab