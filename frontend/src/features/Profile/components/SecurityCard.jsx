// components/SecurityCard.jsx
import React from 'react';
import { Icon } from '../../../components';

const SecurityCard = ({ sessions }) => {
  return (
    <section className="bg-[#141414] p-8 rounded-2xl border border-white/[0.04]">
      <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-6">
        Security Access
      </h3>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <p className="text-white/30 text-[10px]">No sessions found</p>
        ) : (
          sessions.map(session => (
            <div key={session.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Icon name="laptop_mac" className="text-white/20" />
                <div className="text-xs">
                  <p className="text-white font-semibold">
                    {session.os} • {session.location}
                  </p>
                  <p className="text-white/30 text-[10px]">
                    {session.is_current ? 'Active now' : session.last_active}
                  </p>
                </div>
              </div>
              {session.is_current && (
                <span className="text-[9px] text-[#c7f248] font-bold bg-[#c7f248]/10 px-2 py-0.5 rounded uppercase">
                  Current
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default SecurityCard;