import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// Calling your existing project components
import Sidebar from '../components/Sidebar'; 
import Topbar from '../components/Topbar';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';
const socket = io(SOCKET_URL);

const Icon = ({ name, className = "" }) => (
  <span className={`material-symbols-outlined select-none ${className}`}>{name}</span>
);

const Jogging = ({ userId = 1, userName = "Ryan" }) => {
  // Using the same state names as your Dashboard for consistency
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [metrics, setMetrics] = useState({ distance: 0, pace: "0'00\"", kcal: 0 });
  const [squad, setSquad] = useState({}); 
  const watchId = useRef(null);

  useEffect(() => {
    socket.on('friend-moved', (data) => {
      setSquad(prev => ({ ...prev, [data.userId]: data }));
    });
    return () => socket.off('friend-moved');
  }, []);

  const toggleJogging = () => {
    if (isActive) {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      setIsActive(false);
    } else {
      setIsActive(true);
      startTracking();
    }
  };

  const startTracking = () => {
    if ("geolocation" in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          const newCoords = { lat: latitude, lng: longitude };
          setLocation(newCoords);
          socket.emit('share-location', {
            userId,
            name: userName,
            coords: newCoords,
            speed: speed || 0,
            timestamp: new Date()
          });
        },
        (err) => console.error("GPS Error:", err),
        { enableHighAccuracy: true, distanceFilter: 5 }
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-['Inter'] overflow-x-hidden">
      
      {/* 1. Sidebar is separate and hidden on mobile like your Dashboard */}
      <div className="hidden md:block">
        <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />
      </div>

      {/* 2. Topbar is OUTSIDE main and receives the sidebarExpanded prop */}
      <Topbar sidebarExpanded={sidebarExpanded} title="Live Jogging Session" />

      {/* 3. Main uses the exact same transition and margin logic as your Dashboard */}
      <main 
        className={`pt-[80px] pb-24 md:pb-10 px-4 md:px-6 min-h-screen transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] 
        ${sidebarExpanded ? 'md:ml-[240px]' : 'md:ml-[72px] ml-0'}`}
      >
        <div className="max-w-7xl mx-auto w-full flex flex-col">
          
          <div className="bg-[#1c1b1b] border border-white/5 rounded-[24px] overflow-hidden flex flex-col lg:flex-row shadow-2xl min-h-[600px]">
            
            {/* LEFT: Map/GPS Visualization */}
            <div className="flex-1 bg-[#131313] relative overflow-hidden flex items-center justify-center min-h-[350px] md:min-h-[450px]">
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:20px_20px]"></div>
              
              {isActive && (
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-4 h-4 bg-[#c7f248] rounded-full shadow-[0_0_20px_#c7f248] animate-pulse"></div>
                  <div className="mt-2 bg-[#c7f248] text-[#161f00] text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Live</div>
                </div>
              )}

              {Object.values(squad).map(friend => (
                 <div key={friend.userId} className="absolute transition-all duration-1000 flex flex-col items-center" style={{ left: '50%', top: '40%' }}>
                    <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                    <div className="mt-1 bg-white/10 text-white text-[8px] px-1.5 py-0.5 rounded backdrop-blur-md border border-white/10">{friend.name}</div>
                 </div>
              ))}

              <div className="absolute bottom-6 left-6">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                  <Icon name="satellite_alt" className="text-[#c7f248] text-sm" />
                  <span className="text-[10px] text-white font-bold uppercase tracking-widest">GPS: High Precision</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Live Data & Controls */}
            <div className="w-full lg:w-80 p-6 md:p-8 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col justify-between bg-[#1c1b1b]">
              <div>
                <div className="flex justify-between items-center mb-12">
                  <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Live Session</h3>
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-neutral-700'}`}></div>
                </div>

                <div className="space-y-10">
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Distance Covered</p>
                    <h2 className="text-5xl md:text-6xl font-['Manrope'] font-extrabold text-white leading-none">
                        {metrics.distance}<span className="text-lg text-neutral-500 ml-1 font-semibold uppercase">KM</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Pace</p>
                      <p className="text-xl font-bold text-white tracking-tight">{metrics.pace}</p>
                    </div>
                    <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Calories</p>
                      <p className="text-xl font-bold text-white tracking-tight">{metrics.kcal}</p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={toggleJogging}
                className={`w-full py-5 rounded-2xl mt-12 font-black uppercase text-[11px] tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg ${
                  isActive 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20' 
                  : 'bg-[#c7f248] text-[#161f00] hover:bg-[#b8df42]'
                }`}
              >
                <Icon name={isActive ? 'stop_circle' : 'play_arrow'} className="text-xl" />
                {isActive ? 'Stop Session' : 'Start Jogging'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Jogging;