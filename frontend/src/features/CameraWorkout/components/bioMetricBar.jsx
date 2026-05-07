export default function BiometricBar({ label, val, color }) {
  return (
    <div>
      <div className="flex justify-between text-[9px] mb-2 sm:mb-3 uppercase font-black tracking-widest text-white/40">
        <span>{label}</span>
        <span style={{ color }}>{val}%</span>
      </div>
      <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${val}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
    </div>
  );
}