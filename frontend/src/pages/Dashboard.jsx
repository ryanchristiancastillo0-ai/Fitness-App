import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/port';

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
} from '../components';

const SOCKET_URL   = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

const socket = io(SOCKET_URL);

const Dashboard = () => {
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const USER_ID    = storedUser?.id || storedUser?.user?.id || null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    if (!USER_ID) navigate('/login');
  }, [USER_ID, navigate]);

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [data,             setData]             = useState({ stats: {}, profile: {} });
  const [insights,          setInsights]         = useState([]);
  const [biometrics,       setBiometrics]       = useState([]);
  const [isAnalyzing,       setIsAnalyzing]      = useState(false);

  const isAnalyzingRef         = useRef(false); 

  useEffect(() => {
    isAnalyzingRef.current = isAnalyzing;
  }, [isAnalyzing]);

  // --- 1. DATA INITIALIZATION ---
  useEffect(() => {
    if (!USER_ID) return;

    const fetchDashboardData = async () => {
      try {
        const response  = await fetch(`${API_BASE_URL}/api/dashboard/${USER_ID}`);
        const result    = await response.json();

        const sleepRes  = await fetch(`${API_BASE_URL}/api/sleep/${USER_ID}/today`);
        const sleepData = await sleepRes.json();

        setData({
          ...result,
          stats: {
            ...result.stats,
            water_intake_ml: sleepData?.water_intake_ml || 0,
            sleep_duration:  sleepData?.sleep_duration  || 0,
            sleep_quality:   sleepData?.sleep_quality   || 0,
          },
        });

        const bioRes  = await fetch(`${API_BASE_URL}/api/sleep/${USER_ID}?range=D&metric=duration`);
        const bioData = await bioRes.json();
        if (Array.isArray(bioData) && bioData.length > 0) {
          setBiometrics(bioData);
        }

        if (result.insights) {
          setInsights(result.insights);
        }
      } catch (error) {
        console.error('Fetch Error:', error);
      }
    };

    fetchDashboardData();
    socket.emit('join-room', USER_ID);

    const handleNewBiometric = (newPoint) => {
      const normalised = {
        label: newPoint.recorded_at
          ? new Date(newPoint.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : newPoint.label ?? '--:--',
        value: newPoint.value ?? newPoint.sleep_duration ?? 0,
      };
      setBiometrics(prev => [...prev.slice(-19), normalised]);
    };

    const handleNewInsight = (insight) => {
      setInsights(prev => [insight, ...prev].slice(0, 5));
    };

    socket.on('new-biometric-data',    handleNewBiometric);
    socket.on('new-clinical-insight', handleNewInsight);

    return () => {
      socket.off('new-biometric-data',    handleNewBiometric);
      socket.off('new-clinical-insight', handleNewInsight);
    };
  }, [USER_ID]);

  // --- 2. AI CLINICAL ENGINE ---
  const generateClinicalInsight = useCallback(async (currentBiometrics, currentStats) => {
    if (isAnalyzingRef.current) return;

    setIsAnalyzing(true);
    isAnalyzingRef.current = true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/clinical-analysis`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:     USER_ID,
          ...(currentBiometrics.length > 0 && { biometrics: currentBiometrics }),
          stats: {
            calories_burned:       currentStats?.calories_burned       || 0,
            steps:                 currentStats?.steps                 || 0,
            workout_duration_mins: currentStats?.workout_duration_mins || 0,
            sleep_duration:        currentStats?.sleep_duration        || 0,
            sleep_quality:         currentStats?.sleep_quality         || 0,
            water_intake_ml:       currentStats?.water_intake_ml       || 0,
          },
        }),
      });

      const result = await response.json();

      if (result.insights && Array.isArray(result.insights)) {
        const formattedInsights = result.insights.map((item, index) => ({
          ...item,
          id:        `insight-${Date.now()}-${index}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setInsights(formattedInsights);
      }
    } catch (err) {
      console.error('Clinical Engine Error:', err);
    } finally {
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
    }
  }, [USER_ID]);

  // --- 3. ACTIVITY LOGGER ---
  const handleLogActivity = async (formData) => {
    try {
      const hasActivity =
        (parseInt(formData.calories) || 0) > 0 ||
        (parseInt(formData.steps)    || 0) > 0 ||
        (parseInt(formData.minutes)  || 0) > 0;

      if (hasActivity) {
        await fetch(`${API_BASE_URL}/api/logs/${USER_ID}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            calories: parseInt(formData.calories) || 0,
            steps:    parseInt(formData.steps)    || 0,
            minutes:  parseInt(formData.minutes)  || 0,
          }),
        });
      }

      const hasWater = (parseInt(formData.water) || 0) > 0;
      if (hasWater) {
        await fetch(`${API_BASE_URL}/api/sleep/${USER_ID}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            water_intake_ml: parseInt(formData.water) || 0,
            sleep_duration:  0,
            sleep_quality:   0,
            recovery_score:  0,
          }),
        });
      }

      // ✅ ALWAYS FETCH LATEST DATA BEFORE AI ANALYSIS
      const [updatedRes, sleepRes, bioRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dashboard/${USER_ID}`),
        fetch(`${API_BASE_URL}/api/sleep/${USER_ID}/today`),
        fetch(`${API_BASE_URL}/api/sleep/${USER_ID}?range=D&metric=duration`)
      ]);

      const updatedData = await updatedRes.json();
      const sleepData   = await sleepRes.json();
      const freshBiometrics = await bioRes.json();

      const newStats = {
        ...updatedData.stats,
        water_intake_ml: sleepData?.water_intake_ml || 0,
        sleep_duration:  sleepData?.sleep_duration  || 0,
        sleep_quality:   sleepData?.sleep_quality   || 0,
      };

      // Update Local State
      setData(prev => ({
        ...prev,
        ...updatedData,
        stats: newStats,
      }));
      
      if (Array.isArray(freshBiometrics)) {
        setBiometrics(freshBiometrics);
      }

      // ✅ PASS FRESH DATA DIRECTLY TO AI (Ensures AI never uses empty/old data)
      generateClinicalInsight(Array.isArray(freshBiometrics) ? freshBiometrics : biometrics, newStats);

    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

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
                <CaloriesCard value={data.stats?.calories_burned || 0} />
                <LoadCard     minutes={data.stats?.workout_duration_mins || 0} />
                <ActivityCard steps={data.stats?.steps || 0} />
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