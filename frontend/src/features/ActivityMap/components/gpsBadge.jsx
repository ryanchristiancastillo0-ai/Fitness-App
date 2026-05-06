 const GpsBadge = ({ locationStatus }) => (
  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-[1000] flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl border border-white/10">
    <div
      className={`w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0
        ${locationStatus === 'granted' ? 'bg-[#D1FD52]' : locationStatus === 'pending' ? 'bg-yellow-400' : 'bg-red-400'}`}
    />
    <span
      className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest
        ${locationStatus === 'granted' ? 'text-[#D1FD52]' : locationStatus === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}
    >
      {locationStatus === 'granted' ? 'GPS Active' : locationStatus === 'pending' ? 'Locating…' : 'GPS Off'}
    </span>
  </div>
);
export default GpsBadge