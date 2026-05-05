import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { API_BASE_URL } from '../config/port';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationSystem';

const NAV_LINKS = [
  { name: 'Overview', path: '/' },
  { name: 'Meal Tracker', path: '/dashboard/meal-tracker' },
  { name: 'Live Coaching', path: '/dashboard/live-coaching' },
];

// ── Notification Overlay ─────────────────────────────────────────────────────
function NotificationOverlay({ notifications, onMarkRead, onMarkAllRead, onClose }) {
  const [filter, setFilter] = useState('recent');

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const displayed = filter === 'recent'
    ? notifications.slice(0, 10)
    : notifications;

  return (
    <div className="absolute right-0 top-[calc(100%+10px)] w-[min(360px,90vw)] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">

      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-[13px] sm:text-[14px] font-semibold text-[#e5e2e1]">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[9px] sm:text-[10px] font-bold bg-[#D1FD52] text-[#131313] px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onMarkAllRead}
          className="text-[10px] sm:text-[11px] text-[#D1FD52] hover:text-[#D1FD52]/70 transition-colors bg-transparent border-none cursor-pointer whitespace-nowrap"
        >
          Mark all read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-white/[0.06]">
        {['recent', 'all'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-2 text-[11px] sm:text-[12px] font-medium transition-colors border-none cursor-pointer capitalize
              ${filter === tab
                ? 'bg-[#D1FD52]/10 text-[#D1FD52] border-b-2 border-[#D1FD52]'
                : 'bg-transparent text-[#555] hover:text-[#888]'
              }`}
          >
            {tab === 'recent' ? 'Recent' : `All (${notifications.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="max-h-[50vh] sm:max-h-[380px] overflow-y-auto">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-10 gap-2">
            <span className="material-icons text-[28px] sm:text-[32px] text-[#333]">notifications_none</span>
            <p className="text-[11px] sm:text-[12px] text-[#555] m-0">No notifications yet</p>
          </div>
        ) : (
          displayed.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.is_read && onMarkRead(notif.id)}
              className={`flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/[0.04] transition-colors duration-150
                ${notif.is_read
                  ? 'opacity-40 bg-black/20 cursor-default'
                  : 'bg-[#D1FD52]/[0.04] hover:bg-[#D1FD52]/[0.07] cursor-pointer'
                }`}
            >
              {/* Dot */}
              <div className="mt-1.5 shrink-0">
                {notif.is_read ? (
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-transparent border border-white/10" />
                ) : (
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#D1FD52] animate-pulse" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] sm:text-[12px] leading-relaxed m-0 break-words
                  ${notif.is_read ? 'text-[#444] line-through decoration-white/10' : 'text-[#e5e2e1]'}`}>
                  {notif.message}
                </p>
                <p className="text-[9px] sm:text-[10px] text-[#444] mt-0.5 m-0">
                  {new Date(notif.created_at).toLocaleString()}
                </p>
              </div>

              {/* Unread badge */}
              {!notif.is_read && (
                <span className="shrink-0 mt-1 text-[9px] sm:text-[10px] font-bold bg-[#D1FD52]/20 text-[#D1FD52] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  NEW
                </span>
              )}

              {/* Read overlay indicator */}
              {notif.is_read && (
                <span className="shrink-0 mt-1 text-[9px] sm:text-[10px] text-[#333] whitespace-nowrap">
                  read
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-[10px] sm:text-[11px] text-[#444]">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </span>
        <button
          onClick={onClose}
          className="text-[10px] sm:text-[11px] text-[#555] hover:text-[#888] transition-colors bg-transparent border-none cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Topbar ───────────────────────────────────────────────────────────────────
const Topbar = ({ sidebarExpanded, userId }) => {
    console.log('TOPBAR USERID:', userId); // ← add this
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const { logout } = useAuth();

  const [activePath, setActivePath] = useState(localStorage.getItem('activeNavPath') || '/');
  const [userData, setUserData] = useState({ name: 'Guest', avatar_url: '' });
  const [notifCount, setNotifCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const settingsRef = useRef(null);
  const notifRef = useRef(null);

  const handleNavClick = (path) => {
    setActivePath(path);
    localStorage.setItem('activeNavPath', path);
    setMobileMenuOpen(false);
    navigate(path);
  };

const fetchNotifications = useCallback(async () => {
  if (!userId) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/notifications/${userId}`, { credentials: 'include' });
    const data = await res.json();
    console.log('NOTIF RESPONSE:', data);           // ← add this
    console.log('NOTIFICATIONS ARRAY:', data.notifications); // ← add this
    setNotifCount(data.count || 0);
    setNotifications(data.notifications || []);
  } catch (err) {
    console.error('Notif fetch error:', err);
  }
}, [userId]);
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch profile & notifications on mount
  useEffect(() => {
    if (!userId) return;
    const fetchTopbarData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard/${userId}`, { credentials: 'include' });
        const data = await res.json();
        if (data.profile) {
          setUserData({ name: data.profile.name || 'User', avatar_url: data.profile.avatar_url || '' });
        }
      } catch (err) {
        console.error('Topbar fetch error:', err);
      }
    };
    fetchTopbarData();
    fetchNotifications();
  }, [userId, fetchNotifications]);

  // SSE real-time
  useEffect(() => {
    if (!userId) return;
    const es = new EventSource(`${API_BASE_URL}/api/notifications/stream/${userId}`, { withCredentials: true });
    es.onmessage = (e) => {
      const notif = JSON.parse(e.data);
      setNotifCount(prev => prev + 1);
      addToast(notif.message, notif.type);
      fetchNotifications();
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [userId, fetchNotifications]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/search?q=${searchQuery}`, { credentials: 'include' });
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

  const handleMarkRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, { method: 'PUT', credentials: 'include' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setNotifCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark read failed', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/read-all/${userId}`, { method: 'PUT', credentials: 'include' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setNotifCount(0);
    } catch (err) {
      console.error('Mark all read failed', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    addToast('Logged out successfully', 'info');
    navigate('/login');
  };

  const SETTINGS_ITEMS = [
    { icon: 'person', label: 'Profile', accent: true, action: () => navigate('/dashboard/profile') },
    { icon: 'tune', label: 'Preferences', action: () => navigate('dashboard/preferences') },
    { icon: 'notifications', label: 'Notifications', action: () => navigate('dashboard/notifications') },
    { icon: 'lock', label: 'Privacy', action: () => navigate('dashboard/privacy') },
    { icon: 'help_outline', label: 'Help & Support', action: () => window.open('https://support.vitalis.app', '_blank') },
  ];

  const avatarSrc = userData.avatar_url
    ? userData.avatar_url
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`;

  const handleAvatarError = (e) => {
    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`;
  };

  return (
    <>
      <header
        className={
          'fixed top-0 right-0 h-[56px] sm:h-[60px] z-50 ' +
          'bg-[#121212]/80 backdrop-blur-xl ' +
          'border-b border-white/[0.06] ' +
          'flex items-center justify-between px-3 sm:px-4 md:px-6 ' +
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
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} className="text-[22px] sm:text-[24px]" />
          </button>
          <span className="font-[Manrope] text-[15px] sm:text-[18px] md:pl-6 font-extrabold tracking-tight text-[#e5e2e1]">
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
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4">
          <div className="relative hidden sm:flex items-center gap-2 bg-white/[0.05] border border-white/[0.06] rounded-full px-3 sm:px-3.5 py-1.5 focus-within:border-[#D1FD52]/50 transition-all">
            <Icon name="search" className="text-[#555] text-[14px] sm:text-[16px]" />
            <input
              placeholder="Search stats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[#e5e2e1] text-[11px] sm:text-[12px] w-14 sm:w-16 lg:w-36 placeholder-[#555]"
            />
          </div>

          {/* ── Notification Bell + Overlay ── */}
          <div className="relative" ref={notifRef}>
            <div
              className="relative p-1 cursor-pointer group"
              onClick={() => {
                setNotifOpen(prev => !prev);
                fetchNotifications();
              }}
            >
              <Icon
                name="notifications"
                className={`text-[20px] sm:text-[22px] transition-colors ${notifOpen ? 'text-[#D1FD52]' : 'text-[#666] group-hover:text-[#D1FD52]'}`}
              />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#D1FD52] rounded-full border-2 border-[#121212] animate-pulse" />
              )}
            </div>

            {notifOpen && (
              <NotificationOverlay
                notifications={notifications}
                onMarkRead={handleMarkRead}
                onMarkAllRead={handleMarkAllRead}
                onClose={() => setNotifOpen(false)}
              />
            )}
          </div>

          {/* ── Settings ── */}
          <div className="relative hidden md:block" ref={settingsRef}>
            <button
              onClick={() => setSettingsOpen((prev) => !prev)}
              className={
                'p-1.5 rounded-lg transition-all duration-200 cursor-pointer ' +
                (settingsOpen ? 'bg-[#D1FD52] text-[#131313]' : 'text-[#666] hover:text-[#D1FD52] hover:bg-white/5')
              }
            >
              <Icon name="settings" className="text-[20px] sm:text-[22px]" />
            </button>

            {settingsOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-[200px] sm:w-[220px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-white/[0.06]">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-[#D1FD52]/20 bg-[#222] shrink-0">
                    <img src={avatarSrc} alt="User" className="w-full h-full object-cover" onError={handleAvatarError} />
                  </div>
                  <div>
                    <p className="text-[12px] sm:text-[13px] font-semibold text-[#e5e2e1] leading-tight m-0">{userData.name}</p>
                    <p className="text-[9px] sm:text-[10px] text-[#555] m-0">Pro Member</p>
                  </div>
                </div>
                <div className="p-1.5 flex flex-col gap-0.5">
                  {SETTINGS_ITEMS.map(({ icon, label, accent, action }) => (
                    <button
                      key={label}
                      onClick={() => { action(); setSettingsOpen(false); }}
                      className={'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] sm:text-[12px] transition-colors duration-150 text-left cursor-pointer border-none bg-transparent ' + (accent ? 'text-[#D1FD52] hover:bg-[#D1FD52]/10' : 'text-[#888] hover:text-[#e5e2e1] hover:bg-white/5')}
                    >
                      <Icon name={icon} className="text-[14px] sm:text-[16px]" />
                      {label}
                    </button>
                  ))}
                  <div className="border-t border-white/[0.06] mt-1 pt-1">
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] sm:text-[12px] text-[#e05050] hover:bg-[#e05050]/10 transition-colors duration-150 cursor-pointer border-none bg-transparent">
                      <Icon name="logout" className="text-[14px] sm:text-[16px]" /> Log out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className="flex items-center gap-2 sm:gap-3 ml-1 pl-2 border-l border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/profile')}
          >
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[11px] sm:text-[12px] font-medium text-[#e5e2e1]">{userData.name}</span>
              <span className="text-[9px] sm:text-[10px] text-[#555]">Pro Member</span>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-[#D1FD52]/20 bg-[#222] shrink-0">
              <img src={avatarSrc} alt="User" className="w-full h-full object-cover" onError={handleAvatarError} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Navigation Drawer ── */}
      <div
        className={`fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileMenuOpen(false)}
      />
      <div
        className={`fixed top-[56px] sm:top-[60px] left-0 w-60 sm:w-64 h-full bg-[#121212] border-r border-white/10 z-[46] transform transition-transform duration-300 ease-in-out md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <nav className="flex flex-col p-3 sm:p-4 gap-1.5 sm:gap-2">
          {NAV_LINKS.map((item, i) => (
            <button
              key={i}
              onClick={() => handleNavClick(item.path)}
              className={`flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-[13px] sm:text-[14px] font-medium transition-colors border-none bg-transparent text-left cursor-pointer ${activePath === item.path ? 'bg-[#D1FD52]/10 text-[#D1FD52]' : 'text-[#888]'}`}
            >
              {item.name}
            </button>
          ))}
          <div className="h-[1px] bg-white/10 my-1.5 sm:my-2" />
          {SETTINGS_ITEMS.map(({ icon, label, action }) => (
            <button
              key={label}
              onClick={() => { action(); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-[#888] text-[13px] sm:text-[14px] border-none bg-transparent cursor-pointer"
            >
              <Icon name={icon} className="text-[16px] sm:text-[18px]" /> {label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-[#e05050] text-[13px] sm:text-[14px] border-none bg-transparent cursor-pointer"
          >
            <Icon name="logout" className="text-[16px] sm:text-[18px]" /> Logout
          </button>
        </nav>
      </div>
    </>
  );
};

export default Topbar;