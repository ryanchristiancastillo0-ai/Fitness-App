import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Icon from './Icon';

const NAV_ITEMS = [
  { icon: 'dashboard',        label: 'Overview',      path: '/dashboard' },
  { icon: 'monitor_heart',    label: 'Biometrics',    path: '/dashboard/analytics' },
  { icon: 'analytics',        label: 'Analysis',      path: '/' },
  { icon: 'book',             label: 'Plans',         path: '/dashboard/Plans' },
  { icon: 'medical_services', label: 'Concierge',     path: '/' },
];

const BOTTOM_ITEMS = [
  { icon: 'help_outline', label: 'Support' },
  { icon: 'logout',       label: 'Logout'  },
];

const Sidebar = ({ onClick, expanded, setExpanded }) => {
  const location = useLocation();

  // ✅ Store the path in localStorage whenever the URL changes
  useEffect(() => {
    localStorage.setItem("activePath", location.pathname);
  }, [location.pathname]);

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`
        hidden md:flex fixed left-0 top-0 h-full flex-col
        bg-[#09090b] border-r border-white/[0.06]
        py-7 z-[60] overflow-hidden
        transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
        ${expanded ? 'w-60' : 'w-[72px]'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3.5 px-5 mb-9 overflow-hidden">
        <div className="min-w-[32px] h-8 bg-[#c7f248] flex items-center justify-center rounded-md shrink-0">
          <Icon name="pulse_alert" fill={1} weight={400} className="text-[#161f00] text-[18px]" />
        </div>
        <span
          className={`
            font-[Manrope] font-black tracking-[0.2em] text-[13px] text-[#D1FD52]
            whitespace-nowrap transition-opacity duration-200
            ${expanded ? 'opacity-100' : 'opacity-0'}
          `}
        >
          VITALIS
        </span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          // ✅ Dynamic Active State Check
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`
                flex items-center gap-[18px] px-5 h-11 whitespace-nowrap overflow-hidden
                text-[11px] uppercase tracking-[0.15em] no-underline
                transition-all duration-200
                ${isActive
                  ? 'text-[#D1FD52] border-r-2 border-[#D1FD52] bg-white/[0.03]'
                  : 'text-[#6b6b6b] hover:bg-white/[0.04] hover:text-neutral-300'
                }
              `}
            >
              <Icon 
                name={item.icon} 
                className="text-[20px] min-w-[20px] shrink-0" 
                fill={isActive ? 1 : 0} 
              />
              <span className={`transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="border-t border-white/[0.06] pt-2">
        <button
          className="flex items-center gap-[18px] px-5 h-11 text-[11px] uppercase tracking-[0.15em] text-[#6b6b6b] hover:text-neutral-300 whitespace-nowrap overflow-hidden transition-colors duration-200 no-underline"
        >
          <Icon name={BOTTOM_ITEMS[0].icon} className="text-[20px] min-w-[20px] shrink-0" />
          <span className={`transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
            {BOTTOM_ITEMS[0].label}
          </span>
        </button>

        <button
          onClick={onClick}
          className="flex items-center gap-[18px] px-5 h-11 text-[11px] uppercase tracking-[0.15em] text-[#6b6b6b] hover:text-neutral-300 whitespace-nowrap overflow-hidden transition-colors duration-200 no-underline"
        >
          <Icon name={BOTTOM_ITEMS[1].icon} className="text-[20px] min-w-[20px] shrink-0" />
          <span className={`transition-opacity duration-200 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
            {BOTTOM_ITEMS[1].label}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;