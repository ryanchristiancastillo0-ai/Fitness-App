import { handleLogout } from './../utils/logout';
export  const navList = [
    { name: "Dashboard", icon: "speed", path: "/dashboard" },
    { name: "Sleep Stats", icon: "monitoring", path: "/dashboard/analytics" },
     { name: "Jogging", icon: "directions_run", path: "/dashboard/activity-map" },
    { name: "Workouts", icon: "exercise", path: "/dashboard/workouts" },
    { name: "Logs", icon: "history", path: "/dashboard/logs" },
  ];

  export const NAV_ITEMS = [
  { icon: 'dashboard',        label: 'Overview',      path: '/dashboard' },
  { icon: 'monitor_heart',    label: 'Biometrics',    path: '/dashboard/analytics' },
  { icon: 'calculate',        label: 'BMI',      path: '/dashboard/bmi' },
  { icon: 'book',             label: 'Plans',         path: '/dashboard/Plans' },
  { icon: 'chat', label: 'Community',     path: '/dashboard/messenger' },
];

export const SETTINGS_ITEMS = [
    { icon: 'person', label: 'Profile', accent: true, action: () => navigate('/dashboard/profile') },
    { icon: 'tune', label: 'Preferences', action: () => navigate('dashboard/preferences') },
    { icon: 'notifications', label: 'Notifications', action: () => navigate('dashboard/notifications') },
    
    { icon: 'help_outline', label: 'Help & Support', action: () => window.open('https://support.vitalis.app', '_blank') },
    { icon: 'logout', label: 'Logout', action: handleLogout },
  ];
