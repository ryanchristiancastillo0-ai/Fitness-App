import { useState, useEffect } from "react";
import Icon from "./Icon";
import { useNavigate, useLocation } from "react-router-dom";
import { navList } from "../constant/nav";
export default function SidebarAnalytics({ onExpandChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Hook into the actual URL path
 

  const toggle = (val) => {
    setIsExpanded(val);
    onExpandChange?.(val); // notify parent
  };




  // ✅ Store the path whenever the URL changes
  useEffect(() => {
    localStorage.setItem("activePath", location.pathname);
  }, [location.pathname]);

  // ✅ Handle click
  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <aside
 onMouseEnter={() => toggle(true)}
onMouseLeave={() => toggle(false)}
      className={`hidden md:flex flex-col py-8 border-r border-white/5 bg-[#09090b] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] sticky top-0 h-screen z-[100] ${
        isExpanded ? "w-64" : "w-20"
      }`}
    >
      <div className="px-6 mb-12 flex items-center gap-4 overflow-hidden">
        <div className="w-8 h-8 rounded bg-[#D1FD52] flex items-center justify-center flex-shrink-0">
          <Icon name="bolt" className="text-black text-lg" fill={1} />
        </div>
        <div
          className={`transition-opacity duration-300 ${
            isExpanded ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-[#D1FD52] font-black font-['Manrope'] tracking-tighter uppercase whitespace-nowrap">
            Vitalis Fit
          </p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {navList.map((item, i) => {
          // ✅ Compare the current URL to the item path
          const isActive = location.pathname === item.path;

          return (
            <button
              key={i}
              onClick={() => handleNavigate(item.path)}
              className={`flex items-center gap-6 px-7 py-4 transition-all relative group ${
                isActive
                  ? "text-[#D1FD52] bg-white/[0.03]"
                  : "text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.01]"
              }`}
            >
              <Icon name={item.icon} fill={isActive ? 1 : 0} />

              <span
                className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-opacity duration-300 whitespace-nowrap ${
                  isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                {item.name}
              </span>

              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#D1FD52] rounded-l-full shadow-[0_0_15px_#D1FD52]" />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}