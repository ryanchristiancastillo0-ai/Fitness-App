import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Sidebar, Topbar } from '../../../components';
import { handleLogout } from '../../../hooks/logout';


const FEEDBACKS = [
  "Great depth! Keep elbows at 45°",
  "Perfect form! Maintain core tension",
  "Slightly deeper next rep",
  "Excellent pace — stay consistent",
  "Good shoulder position, keep it up!",
];

export default function LiveCoaching() {
   const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const [isRecording,  setIsRecording]  = useState(false);
 
  const [coachVideo,   setCoachVideo]   = useState('/coach-pushup.mp4');
  const [aiFeedback,   setAiFeedback]   = useState('Select an exercise and hit Start');
  const [repCount,     setRepCount]     = useState(0);
  const [biometrics,   setBiometrics]   = useState({ alignment: 0, velocity: 0, symmetry: 0 });

  const webcamRef     = useRef(null);
  const coachVideoRef = useRef(null);

  // Simulate live AI feedback
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => {
      setAiFeedback(FEEDBACKS[Math.floor(Math.random() * FEEDBACKS.length)]);
      setRepCount(n => n + 1);
      setBiometrics({
        alignment: Math.floor(Math.random() * 10) + 90,
        velocity:  Math.floor(Math.random() * 20) + 15,
        symmetry:  Math.floor(Math.random() * 15) + 85,
      });
    }, 3000);
    return () => clearInterval(id);
  }, [isRecording]);

  // Sync coach video
  useEffect(() => {
    const v = coachVideoRef.current;
    if (!v) return;
    if (isRecording) { v.play(); }
    else { v.pause(); v.currentTime = 0; }
  }, [isRecording]);

  const selectWorkout = (opt) => {
 
    setCoachVideo(opt.coachVideo);
    setAiFeedback(`Switched to ${opt.label} — hit Start!`);
    setRepCount(0);
    setBiometrics({ alignment: 0, velocity: 0, symmetry: 0 });
  };

  const toggleRecording = () => setIsRecording(v => !v);

  

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex">

   
    <Sidebar
          onClick={handleLogout} 
          expanded={sidebarExpanded} 
          setExpanded={setSidebarExpanded} 
        />

      {/* ── Main ────────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarExpanded ? 'ml-56' : 'ml-[60px]'}`}>

        {/* ── Top bar: exercise picker ─────────────────────────── */}
       

        {/* ── Header ──────────────────────────────────────────── */}
       
        <Topbar/>

              <header className="h-16 bg-[#0d0d0d] border-b border-white/5 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-[#D1FD52] animate-pulse' : 'bg-white/20'}`} />
            <span className="text-xs font-bold tracking-widest uppercase text-white/40">
              Live Coach &nbsp;·&nbsp;
              <span className="text-[#D1FD52]">{current?.label}</span>
            </span>
          </div>
 
          <button
            onClick={toggleRecording}
            className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all active:scale-95
              ${isRecording
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-[#D1FD52] text-black hover:bg-[#c5f040]'}`}
          >
            <span>{isRecording ? '⏹' : '▶'}</span>
            {isRecording ? 'End Session' : 'Start Live Coach'}
          </button>
        </header>
 

        {/* ── Page body ───────────────────────────────────────── */}
        <main className="flex-1 p-5 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">

          {/* ── Left: camera + feedback row ─────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Camera frame */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-white/5" style={{ aspectRatio: '16/9' }}>

              {/* Scan line (Tailwind-only via animate-[scan]) — replaces custom CSS */}
              {isRecording && (
                <div className="absolute inset-0 z-10 pointer-events-none border border-[#D1FD52]/20 rounded-2xl">
                  <div className="absolute top-0 left-0 right-0 h-px bg-[#D1FD52]/60 animate-[ping_3s_ease-in-out_infinite]" />
                </div>
              )}

              {/* Webcam */}
              <Webcam
                audio={false}
                ref={webcamRef}
                className="w-full h-full object-cover"
                videoConstraints={{ facingMode: 'user' }}
              />

              {/* Coach PiP — top right */}
              <div className="absolute top-4 right-4 z-20 w-28 rounded-xl overflow-hidden border-2 border-white/20">
                <video ref={coachVideoRef} className="w-full object-cover" loop muted playsInline>
                  <source src={coachVideo} type="video/mp4" />
                </video>
                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-center py-0.5">
                  <span className="text-[9px] font-black text-[#D1FD52] tracking-widest">COACH</span>
                </div>
              </div>

              {/* Rep counter — bottom right */}
              <div className="absolute bottom-5 right-6 z-20 text-right">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Reps</p>
                <p className="text-7xl font-black text-[#D1FD52] leading-none tabular-nums">
                  {String(repCount).padStart(2, '0')}
                </p>
              </div>
            </div>

            {/* AI feedback strip */}
            <div className="flex items-start gap-4 bg-[#111111] border border-white/5 rounded-2xl px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-[#D1FD52]/10 flex items-center justify-center text-lg shrink-0">
                🧠
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#D1FD52] uppercase tracking-widest mb-1">AI Feedback</p>
                <p className="text-sm text-white/80 leading-relaxed">{aiFeedback}</p>
              </div>
              {isRecording && (
                <div className="ml-auto shrink-0 flex items-center gap-1.5 bg-[#D1FD52]/10 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D1FD52] animate-pulse" />
                  <span className="text-[10px] font-bold text-[#D1FD52] tracking-widest">LIVE</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel ─────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Biometrics */}
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-5">Live Biometrics</p>
              <div className="space-y-5">
                {[
                  { label: 'Form Alignment', value: biometrics.alignment, color: 'bg-[#D1FD52]'   },
                  { label: 'Rep Velocity',   value: biometrics.velocity,  color: 'bg-blue-400'     },
                  { label: 'Symmetry',       value: biometrics.symmetry,  color: 'bg-purple-400'   },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">{label}</span>
                      <span className="text-[11px] font-black text-[#D1FD52]">{value}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${color}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session stats */}
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Session</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Reps',     value: String(repCount).padStart(2, '0') },
                  { label: 'Exercise', value: current?.emoji ?? '—'             },
                  { label: 'Status',   value: isRecording ? 'Live' : 'Idle'     },
                  { label: 'AI',       value: 'Active'                          },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-black text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Neural status */}
            <div className="bg-[#D1FD52]/5 border border-[#D1FD52]/15 rounded-2xl p-5">
              <p className="text-[10px] font-black text-[#D1FD52] uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D1FD52] animate-pulse" />
                Neural Network
              </p>
              <p className="text-[12px] text-white/50 leading-relaxed">
                Monitoring 33 skeletal keypoints at 7 FPS. Coach video synced with your movements for real-time form correction.
              </p>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}