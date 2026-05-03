import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

import {
  Sidebar,
  Topbar,
  Hero,
  CaloriesCard,
  LoadCard,
  ActivityCard,
  ClinicalAssistant,
  SleepHoursGraph,
  MobileNav,
  FAB,
} from '../../../components';


import { useClinicalAI } from '../hooks/useClinicalAI';
import { useActivityLogger } from '../hooks/useActivityLogger';
import { useDashboardData } from '../hooks/useDashboarddata';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const USER_ID = user?.id || null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const {
    data,
    insights,
    biometrics,
    setData,
    setInsights,
    setBiometrics
  } = useDashboardData(USER_ID);

  const { isAnalyzing, generateClinicalInsight } =
    useClinicalAI(USER_ID, setInsights);

  const { handleLogActivity } = useActivityLogger(USER_ID, {
    setData,
    setBiometrics,
    biometrics,
    generateClinicalInsight
  });

  if (loading)  return null;
  if (!USER_ID) return null;

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-[Inter,sans-serif] overflow-x-hidden">
      <div className="hidden md:block">
        <Sidebar
          onClick={handleLogout}
          expanded={sidebarExpanded}
          setExpanded={setSidebarExpanded}
        />
      </div>
      <Topbar sidebarExpanded={sidebarExpanded} userId={USER_ID} />

      <main
        className={`pt-[80px] pb-24 md:pb-10 px-4 md:px-6 min-h-screen transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${sidebarExpanded ? 'md:ml-[240px]' : 'md:ml-[72px] ml-0'}`}
      >
        <div className="max-w-[1280px] mx-auto">
          <Hero name={data.profile?.name} goal={data.profile?.fitness_goal} avatar={data.profile?.avatar_url} />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CaloriesCard value={data.stats?.calories_burned       || 0} />
                <LoadCard     minutes={data.stats?.workout_duration_mins || 0} />
                <ActivityCard steps={data.stats?.steps                 || 0} />
              </div>

              <div className="w-full relative">
                {isAnalyzing && (
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-[#D1FD52]/10 px-3 py-1 rounded-full border border-[#D1FD52]/20 shadow-lg">
                    <div className="w-1.5 h-1.5 bg-[#D1FD52] rounded-full animate-ping" />
                    <span className="text-[9px] font-black text-[#D1FD52] uppercase tracking-widest">AI Scanning Vitals</span>
                  </div>
                )}
                <SleepHoursGraph data={biometrics} userId={USER_ID} />
              </div>
            </div>

            <div className="lg:col-span-1 h-fit lg:h-full">
              <ClinicalAssistant
                insights={insights}
                water={data.stats?.water_intake_ml || 0}
                sleep={data.stats?.sleep_duration  || 0}
                quality={data.stats?.sleep_quality || 0}
                isAnalyzing={isAnalyzing}
                userId={USER_ID}
              />
            </div>
          </div>
        </div>
      </main>

      <div className="md:hidden"><MobileNav /></div>
      <FAB onSave={handleLogActivity} />
    </div>
  );
};

export default Dashboard;