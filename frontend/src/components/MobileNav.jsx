import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { NAV_ITEMS } from '../constant/nav';


const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Active path state synchronized with URL and LocalStorage
  const [activePath, setActivePath] = useState(
    localStorage.getItem('activeNavPath') || location.pathname
  );

  // ✅ Effect: Update LocalStorage and State whenever the URL changes
  useEffect(() => {
    setActivePath(location.pathname);
    localStorage.setItem('activeNavPath', location.pathname);
  }, [location.pathname]);

  // ✅ Navigation Handler
  const handleNavClick = (path) => {
    setActivePath(path);
    localStorage.setItem('activeNavPath', path);
    navigate(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-[#09090b]/95 backdrop-blur-xl border-t border-white/[0.06] flex justify-around gap-4 items-center px-2 z-[70] rounded-t-2xl">
      {NAV_ITEMS.map((item) => {
        // ✅ Calculate active state based on current location
        const isActive = location.pathname === item.path;

        return (
          <button
            key={item.label}
            onClick={() => handleNavClick(item.path)}
            className={`flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer transition-all duration-[300ms] outline-none ${
              isActive ? 'text-[#D1FD52]' : 'text-[#555]'
            }`}
          >
            {/* Icon Container with active scaling */}
            <div className={`relative flex items-center justify-center transition-transform duration-300 ${
              isActive ? 'scale-110' : 'scale-100'
            }`}>
              <Icon 
                name={item.icon} 
                className="text-[18px]" 
                fill={isActive ? 1 : 0} 
              />
              
              {/* Glow Indicator for active state */}
              {isActive && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#D1FD52] rounded-full shadow-[0_0_10px_#D1FD52] animate-pulse" />
              )}
            </div>

            {/* Bottom active bar for mobile */}
            {isActive && (
               <div className="absolute bottom-1 w-5 h-[2px] bg-[#D1FD52] rounded-full shadow-[0_0_8px_#D1FD52]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNav;
