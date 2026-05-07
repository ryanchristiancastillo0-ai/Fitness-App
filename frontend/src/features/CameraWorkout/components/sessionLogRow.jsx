export default function SessionLogRow({ log }) {
  return (
    <div className="flex justify-between items-center text-[9px] py-1.5 border-b border-white/5 last:border-0">
      <span className="font-bold text-white/60 uppercase tracking-widest truncate mr-2">{log.exercise}</span>
      <span className="text-[#D1FD52] font-black flex-shrink-0">{log.reps} reps</span>
      <span className="text-white/25 flex-shrink-0 ml-2">{log.time}</span>
    </div>
  );
}