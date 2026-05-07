// components/SecurityCard.jsx
import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const DEVICE_ICONS = {
  desktop: 'laptop_mac',
  mobile: 'smartphone',
  tablet: 'tablet_mac',
};

function getDeviceIcon(deviceType) {
  return DEVICE_ICONS[deviceType?.toLowerCase()] ?? 'devices';
}

function formatLastActive(timestamp, isCurrent) {
  if (isCurrent) return null;
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

const SessionItem = ({ session }) => {
  const icon = getDeviceIcon(session.device_type);
  const lastActive = formatLastActive(session.last_active, session.is_current);
  const location = [session.city, session.country].filter(Boolean).join(', ') || 'Unknown location';
  const label = `${session.browser} on ${session.os}`;

  return (
    <div className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all
      ${session.is_current
        ? 'bg-[#c7f248]/5 border-[#c7f248]/10'
        : 'border-transparent hover:bg-white/[0.03] hover:border-white/[0.06]'
      }`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
        ${session.is_current ? 'bg-[#c7f248]/10 text-[#c7f248]' : 'bg-white/[0.06] text-white/40'}`}
      >
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-white/85 truncate tracking-[0.01em]">{label}</p>
        <p className="text-[10px] text-white/30 mt-0.5">
          {session.is_current
            ? <><span className="inline-block w-1.5 h-1.5 bg-[#c7f248] rounded-full mr-1.5 align-middle animate-pulse" />Active now · {location}</>
            : <>{lastActive} · {location}</>
          }
        </p>
      </div>

      {session.is_current
        ? <span className="text-[8px] font-bold tracking-[0.12em] uppercase bg-[#c7f248]/10 text-[#c7f248] border border-[#c7f248]/20 px-2 py-0.5 rounded-md flex-shrink-0">Current</span>
        : <button className="text-[9px] text-red-400/40 hover:text-red-400/80 hover:bg-red-500/10 px-1.5 py-1 rounded transition-all flex-shrink-0">Revoke</button>
      }
    </div>
  );
};

const SecurityCard = ({ sessions = [], onRevoke }) => {
  const current = sessions.find(s => s.is_current);
  const others = sessions.filter(s => !s.is_current);

  return (
    <section className="bg-[#141414] p-7 rounded-2xl border border-white/[0.04]">
      <h3 className="text-[9px] font-bold text-white/25 uppercase tracking-[0.2em] mb-5">Security Access</h3>

      {sessions.length === 0 && (
        <p className="text-white/25 text-[10px]">No sessions found</p>
      )}

      {current && (
        <div className="mb-1">
          <p className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.15em] mb-2 pl-1">This device</p>
          <SessionItem session={current} />
        </div>
      )}

      {others.length > 0 && (
        <div className="mt-4">
          <div className="h-px bg-white/[0.04] mb-4" />
          <p className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.15em] mb-2 pl-1">Other devices</p>
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1
            scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {others.map(session => (
              <SessionItem key={session.id} session={session} onRevoke={onRevoke} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default SecurityCard;