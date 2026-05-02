import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { API_BASE_URL } from '../config/port';
import { useAuth } from '../hooks/useAuth';

// Restored missing constant
const NAV_LINKS = [
  { name: 'Overview', path: '/' },
  { name: 'Meal Tracker', path: '/dashboard/meal-tracker'  },
  { name: 'Live Coaching', path: '/dashboard/live-coaching' },
];

const Topbar = ({ sidebarExpanded, userId }) => {
  const navigate = useNavigate();

  // -- Navigation Persistence Logic --
  const [activePath, setActivePath] = useState(localStorage.getItem('activeNavPath') || '/');

  const [userData, setUserData] = useState({ name: 'Guest', avatar_url: '' });
  const [notifCount, setNotifCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const settingsRef = useRef(null);

  const handleNavClick = (path) => {
    setActivePath(path);
    localStorage.setItem('activeNavPath', path);
    setMobileMenuOpen(false); 
    navigate(path);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { logout } = useAuth();

  // Fetch profile & notifications
  useEffect(() => {
    if (!userId) return;
    const fetchTopbarData = async () => {
      try {
        const res = await fetch(API_BASE_URL + '/api/dashboard/' + userId, {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.profile) {
          setUserData({
            name: data.profile.name || 'User',
            avatar_url: data.profile.avatar_url || '',
          });
        }
        const notifRes = await fetch(API_BASE_URL + '/api/notifications/' + userId, {
          credentials: 'include',
        });
        const notifData = await notifRes.json();
        setNotifCount(notifData.count || 0);
      } catch (err) {
        console.error('Topbar fetch error:', err);
      }
    };
    fetchTopbarData();
  }, [userId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        try {
          const res = await fetch(API_BASE_URL + '/api/search?q=' + searchQuery, {
            credentials: 'include',
          });
          const results = await res.json();
          setSearchResults(Array.isArray(results) ? results : []);
        } catch (err) {
          console.error('Search failed', err);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SETTINGS_ITEMS = [
    { icon: 'person', label: 'Profile', accent: true, action: () => navigate('/profile') },
    { icon: 'tune', label: 'Preferences', action: () => navigate('/preferences') },
    { icon: 'notifications', label: 'Notifications', action: () => navigate('/notifications') },
    { icon: 'lock', label: 'Privacy', action: () => navigate('/privacy') },
    { icon: 'help_outline', label: 'Help & Support', action: () => window.open('https://support.vitalis.app', '_blank') },
  ];

  const avatarSrc = userData.avatar_url
    ? userData.avatar_url
    : 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userData.name;

  const handleAvatarError = (e) => {
    e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userData.name;
  };

  return (
    <>
      <header
        className={
          'fixed top-0 right-0 h-[60px] z-50 ' +
          'bg-[#121212]/80 backdrop-blur-xl ' +
          'border-b border-white/[0.06] ' +
          'flex items-center justify-between px-4 md:px-6 ' +
          'transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ' +
          'left-0 ' + (sidebarExpanded ? 'md:left-60' : 'md:left-[72px]')
        }
      >
        {/* ── Left ── */}
        <div className="flex items-center gap-2 md:gap-9">
          <button 
            className="md:hidden p-1 text-[#e5e2e1] bg-transparent border-none cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Icon name={mobileMenuOpen ? "close" : "menu"} className="text-[24px]" />
          </button>

          <span className="font-[Manrope] text-[18px] md:pl-6 font-extrabold tracking-tight text-[#e5e2e1]">
            Vitalis
          </span>

          <nav className="hidden md:flex gap-7">
            {NAV_LINKS.map((item, i) => (
              <button
                key={i}
                onClick={() => handleNavClick(item.path)}
                className={
                  'font-[Manrope] text-[13px] transition-colors duration-200 border-none bg-transparent cursor-pointer ' +
                  (activePath === item.path ? 'text-[#D1FD52] font-bold' : 'text-[#666] hover:text-[#D1FD52]')
                }
              >
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Right ── */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative hidden sm:flex items-center gap-2 bg-white/[0.05] border border-white/[0.06] rounded-full px-3.5 py-1.5 focus-within:border-[#D1FD52]/50 transition-all">
            <Icon name="search" className="text-[#555] text-[16px]" />
            <input
              placeholder="Search stats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[#e5e2e1] text-[12px] w-16 lg:w-36 placeholder-[#555]"
            />
          </div>

          <div className="relative p-1 cursor-pointer group" onClick={() => navigate('/notifications')}>
            <Icon name="notifications" className="text-[#666] text-[22px] group-hover:text-[#D1FD52] transition-colors" />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#D1FD52] rounded-full border-2 border-[#121212] animate-pulse" />
            )}
          </div>

          <div className="relative hidden md:block" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen((prev) => !prev)}
              className={
                'p-1.5 rounded-lg transition-all duration-200 cursor-pointer ' +
                (settingsOpen ? 'bg-[#D1FD52] text-[#131313]' : 'text-[#666] hover:text-[#D1FD52] hover:bg-white/5')
              }
            >
              <Icon name="settings" className="text-[22px]" />
            </button>

            {settingsOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-[220px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-[#D1FD52]/20 bg-[#222] shrink-0">
                    <img src={avatarSrc} alt="User" className="w-full h-full object-cover" onError={handleAvatarError} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#e5e2e1] leading-tight m-0">{userData.name}</p>
                    <p className="text-[10px] text-[#555] m-0">Pro Member</p>
                  </div>
                </div>
                <div className="p-1.5 flex flex-col gap-0.5">
                  {SETTINGS_ITEMS.map(({ icon, label, accent, action }) => (
                    <button
                      key={label}
                      onClick={() => { action(); setSettingsOpen(false); }}
                      className={'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] transition-colors duration-150 text-left cursor-pointer border-none bg-transparent ' + (accent ? 'text-[#D1FD52] hover:bg-[#D1FD52]/10' : 'text-[#888] hover:text-[#e5e2e1] hover:bg-white/5')}
                    >
                      <Icon name={icon} className="text-[16px]" />
                      {label}
                    </button>
                  ))}
                  <div className="border-t border-white/[0.06] mt-1 pt-1">
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-[#e05050] hover:bg-[#e05050]/10 transition-colors duration-150 cursor-pointer border-none bg-transparent">
                      <Icon name="logout" className="text-[16px]" /> Log out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 ml-1 pl-2 border-l border-white/10 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/profile')}>
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[12px] font-medium text-[#e5e2e1]">{userData.name}</span>
              <span className="text-[10px] text-[#555]">Pro Member</span>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#D1FD52]/20 bg-[#222] shrink-0">
              <img src={avatarSrc} alt="User" className="w-full h-full object-cover" onError={handleAvatarError} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Navigation Drawer ── */}
      <div className={`fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setMobileMenuOpen(false)} />
      <div className={`fixed top-[60px] left-0 w-64 h-full bg-[#121212] border-r border-white/10 z-[46] transform transition-transform duration-300 ease-in-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="flex flex-col p-4 gap-2">
          {NAV_LINKS.map((item, i) => (
            <button
              key={i}
              onClick={() => handleNavClick(item.path)}
              className={`flex items-center px-4 py-3 rounded-lg text-[14px] font-medium transition-colors border-none bg-transparent text-left cursor-pointer ${activePath === item.path ? 'bg-[#D1FD52]/10 text-[#D1FD52]' : 'text-[#888]'}`}
            >
              {item.name}
            </button>
          ))}
          <div className="h-[1px] bg-white/10 my-2" />
          {SETTINGS_ITEMS.map(({ icon, label, action }) => (
            <button key={label} onClick={() => { action(); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-[#888] text-[14px] border-none bg-transparent cursor-pointer">
              <Icon name={icon} className="text-[18px]" /> {label}
            </button>
          ))}
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-[#e05050] text-[14px] border-none bg-transparent cursor-pointer">
            <Icon name="logout" className="text-[18px]" /> Logout
          </button>
        </nav>
      </div>
    </>
  );
};

export default Topbar;