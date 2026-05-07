import { useLocation } from "react-router-dom";
import { navList } from "../constant/nav";
import Icon from "./Icon";

export default function MobileBottomNav({ navigate }) {
  const location = useLocation();
  const activePath = location.pathname;

  const handleNav = (path) => {
    localStorage.setItem("vitalis_activePath", path);
    navigate(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-[#09090b]/95 backdrop-blur-xl border-t border-white/5 z-[100] flex justify-around items-center py-2 pb-[env(safe-area-inset-bottom,8px)]">
      {navList.map((list, i) => {
        const isActive = activePath === list.path;
        return (
          <button
            onClick={() => handleNav(list.path)}
            key={i}
            className={`flex flex-col items-center justify-center p-2 min-w-[44px] min-h-[44px] rounded-xl transition-colors touch-manipulation ${
              isActive ? "text-[#D1FD52]" : "text-neutral-500 active:text-neutral-300"
            }`}
          >
            <Icon name={list.icon} fill={isActive ? 1 : 0} className="text-[22px]" />
          </button>
        );
      })}
    </nav>
  );
}