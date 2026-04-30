import Icon from './Icon';

// ─── Shell ────────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, unit, icon, children }) => (
  <div className="bg-[#1c1b1b] border border-white/[0.05] rounded-[14px] p-[22px] flex flex-col h-full">
    <div className="flex justify-between items-start mb-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#555] mb-1">{label}</p>
        <h3 className="font-[Manrope] text-[22px] font-bold text-[#e5e2e1]">
          {value}
          {unit && <span className="text-[12px] font-normal text-[#888] ml-1">{unit}</span>}
        </h3>
      </div>
      <Icon name={icon} className="text-[#c7f248]/[0.35] text-[22px]" />
    </div>
    {children}
  </div>
);

// ─── Calories ─────────────────────────────────────────────────────────────────
export const CaloriesCard = ({ value = 0 }) => (
  <StatCard 
    label="Daily Burn" 
    value={Number(value || 0).toLocaleString()} 
    unit="kcal" 
    icon="local_fire_department"
  >
    <div className="flex items-end gap-1 h-12">
      {[40, 60, 45, 80, 70, 100].map((h, i) => (
        <div key={i} className="flex-1 rounded-sm bg-[#c7f248]" style={{ height: `${h}%`, opacity: i === 5 ? 1 : 0.3 }} />
      ))}
    </div>
  </StatCard>
);

// ─── Session Load (FIXED NaN) ─────────────────────────────────────────────────
export const LoadCard = ({ minutes = 0 }) => {
  // Force conversion to number to prevent NaN
  const safeMinutes = Number(minutes) || 0;
  
  const goal = 120; // 2 hour goal
  const hours = Math.floor(safeMinutes / 60);
  const remainingMins = safeMinutes % 60;
  const percentage = Math.min((safeMinutes / goal) * 100, 100);
  
  return (
    <StatCard label="Session Load" value={`${hours}h ${remainingMins}m`} icon="timer">
      <div className="flex justify-between text-[10px] font-bold mb-1.5">
        <span className="text-[#555] uppercase">Goal: 2h 00m</span>
        <span className="text-[#c7f248]">{Math.round(percentage)}%</span>
      </div>
      <div className="bg-[#2a2a2a] h-1 rounded-full overflow-hidden w-full">
        <div 
           className="bg-[#c7f248] h-full transition-all duration-1000" 
           style={{ width: `${percentage}%` }} 
        />
      </div>
    </StatCard>
  );
};

// ─── Activity Count ───────────────────────────────────────────────────────────
export const ActivityCard = ({ steps = 0 }) => (
  <StatCard label="Activity Count" value={Number(steps || 0).toLocaleString()} icon="footprint">
    <div className="flex items-baseline gap-2">
      <span className="text-[#c7f248] text-[13px] font-bold">+12%</span>
      <span className="text-[#555] text-[10px] uppercase">vs yesterday</span>
    </div>
  </StatCard>
);