import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/port';

const Icon = ({ name, className = "", fill = 0 }) => (
  <span 
    className={`material-symbols-outlined select-none transition-all ${className}`}
    style={{ fontVariationSettings: `'FILL' ${fill}, 'wght' 300, 'GRAD' 0, 'opsz' 24` }}
  >
    {name}
  </span>
);

const Offline = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [atelierData, setAtelierData] = useState({ bpm: 0, sleepMins: 462, isOnline: false });
  const USER_ID = 1;

  // FETCH DATA FROM BACKEND
  const fetchData = async () => {
    setIsSyncing(true);
    try {
      const res = await fetcRh(`${API_BASE_URL}/api/atelier/summary/${USE_ID}`);
      const data = await res.json();
      setAtelierData({ ...data, isOnline: true });
    } catch (err) {
      console.log("Still offline or server down");
      setAtelierData(prev => ({ ...prev, isOnline: false }));
    } finally {
      setTimeout(() => setIsSyncing(false), 800); // Small delay for "feel"
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatSleep = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-['Inter'] selection:bg-[#c7f248] selection:text-[#161f00] flex">
      
      {/* 1. SIDEBAR */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:flex fixed left-0 top-0 h-full z-50 bg-neutral-950 border-r border-neutral-800/30 flex-col py-8 transition-all duration-500 ease-in-out group ${isHovered ? 'w-64' : 'w-20'}`}
      >
        <div className="px-6 mb-12 flex items-center gap-4 overflow-hidden">
          <Icon name="clinical_notes" className="text-[#D1FD52] text-3xl" />
          <div className={`transition-opacity duration-300 whitespace-nowrap ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-[#D1FD52] font-black text-sm tracking-tighter font-['Manrope']">Vitalis</div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Clinical Atelier</div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {[
            { icon: 'dashboard', label: 'Overview', active: true },
            { icon: 'monitor_heart', label: 'Biometrics' },
            { icon: 'analytics', label: 'Analysis' },
            { icon: 'folder_shared', label: 'Records' },
            { icon: 'medical_services', label: 'Concierge' }
          ].map((item) => (
            <div 
              key={item.label}
              className={`flex items-center h-12 px-6 cursor-pointer transition-all ${item.active ? 'text-[#D1FD52] bg-neutral-900/50 border-r-2 border-[#D1FD52]' : 'text-neutral-500 hover:text-neutral-200'}`}
            >
              <Icon name={item.icon} className="min-w-[32px]" />
              <span className={`ml-4 text-[10px] uppercase tracking-widest transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </nav>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col transition-all duration-500 ${isHovered ? 'md:ml-64' : 'md:ml-20'}`}>
        
        <header className="sticky top-0 w-full z-40 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold tracking-tighter font-['Manrope'] md:hidden">Vitalis</span>
            <div className="hidden md:flex gap-6 text-[10px] uppercase font-bold tracking-widest font-['Manrope']">
              <a className="text-[#D1FD52]" href="#">Overview</a>
              <a className="text-neutral-400 hover:text-[#D1FD52] transition-colors" href="#">Biometrics</a>
              <a className="text-neutral-400 hover:text-[#D1FD52] transition-colors" href="#">Analysis</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Icon name="notifications" className="text-neutral-400 cursor-pointer active:scale-90" />
             <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden shrink-0">
               <img alt="User" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan" />
             </div>
          </div>
        </header>

        <main className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full pb-32">
          
          {/* Status Banner */}
          <section className="mb-8">
            <div className="bg-[#2a2a2a]/60 backdrop-blur-2xl border border-white/5 p-1 flex flex-col sm:flex-row items-center justify-between rounded-xl gap-4">
              <div className="flex items-center px-4 py-2 gap-4">
                <div className="relative flex h-2 w-2">
                  <span className={`${atelierData.isOnline ? 'bg-green-500' : 'bg-red-500 animate-ping'} absolute inline-flex h-full w-full rounded-full opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${atelierData.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm leading-none">
                    {atelierData.isOnline ? 'Cloud Synchronized' : 'System Offline'}
                  </span>
                  <span className="text-neutral-500 text-[10px] uppercase tracking-widest mt-1">
                    {atelierData.isOnline ? 'Direct Database Connection' : 'High-Performance Caching Active'}
                  </span>
                </div>
              </div>
              <button 
                onClick={fetchData}
                disabled={isSyncing}
                className="w-full sm:w-auto bg-[#c7f248] text-[#161f00] font-bold text-[10px] px-6 py-3 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <Icon name="sync" className={`text-sm ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Synchronizing...' : 'Retry Sync'}
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Heart Rate Hero (Dynamic) */}
            <div className="md:col-span-8 bg-[#1c1b1b] rounded-xl p-8 border border-white/5 relative group">
              <div className="flex items-baseline gap-4 mb-2">
                <h2 className="text-6xl md:text-7xl font-['Manrope'] font-extrabold tracking-tighter text-white">
                    {atelierData.bpm}
                </h2>
                <span className="text-neutral-500 font-['Manrope'] font-semibold text-xl">BPM</span>
              </div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.3em] mb-12">Live Biometric Core</p>
              
              <div className="h-40 w-full flex items-end gap-1.5">
                {[40, 60, 45, 80, 50, 70, 95, 65, 40, 30, 45, 100].map((h, i) => (
                  <div key={i} className="flex-1 bg-[#c7f248]/20 rounded-t-sm transition-all duration-700 group-hover:bg-[#c7f248]/40" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            {/* Sleep Restoration (Dynamic) */}
            <div className="md:col-span-4 bg-[#1c1b1b] rounded-xl p-8 border border-white/5">
              <div className="w-12 h-12 bg-[#353534] rounded-lg flex items-center justify-center border border-white/5 mb-12">
                <Icon name="bedtime" className="text-[#D1FD52]" fill={1} />
              </div>
              <h3 className="text-4xl font-['Manrope'] font-bold text-white tracking-tight">
                {formatSleep(atelierData.sleepMins)}
              </h3>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-2">Daily Sleep Total</p>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Offline;