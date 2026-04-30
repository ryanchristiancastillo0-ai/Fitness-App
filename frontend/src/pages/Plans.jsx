import React, { useState, useEffect } from 'react';
import { MobileNav, Sidebar, Topbar } from '../components';
import { API_BASE_URL } from '../config/port';

const Icon = ({ name, className = '', fill = 0, weight = 300 }) => (
  <span
    className={`material-symbols-outlined leading-none select-none ${className}`}
    style={{ fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24` }}
  >
    {name}
  </span>
);

// ─── PLAN DETAIL OVERLAY ──────────────────────────────────────────────────────
const PlanDetailOverlay = ({ plan, onClose, onStart }) => {
  if (!plan) return null;
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl my-auto max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)' }}
      >
        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1">
          {/* Banner */}
          <div className="aspect-[16/7] relative overflow-hidden flex-shrink-0">
            <img
              src={`https://api.dicebear.com/7.x/shapes/svg?seed=${plan.image_seed}`}
              alt={plan.title}
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/40 to-transparent" />
            <div className="absolute bottom-4 left-6 flex gap-2">
              <span className="px-2 py-1 rounded bg-[#D1FD52] text-black text-[10px] font-black tracking-widest uppercase">
                {plan.tag}
              </span>
              <span className="px-2 py-1 rounded bg-white/10 backdrop-blur text-white text-[10px] font-bold tracking-widest uppercase">
                {plan.intensity}
              </span>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <h2 className="text-2xl font-black text-[#e5e2e1] mb-1">{plan.title}</h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">{plan.description}</p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Duration', value: plan.duration, icon: 'schedule' },
                { label: 'Intensity', value: plan.intensity, icon: 'bolt' },
                { label: 'Focus', value: plan.target_focus, icon: 'track_changes' },
              ].map(stat => (
                <div key={stat.label} className="bg-[#252424] rounded-xl p-3 text-center border border-white/5">
                  <Icon name={stat.icon} className="text-[#D1FD52] text-[16px] mb-1" fill={1} />
                  <p className="text-[10px] text-neutral-500 uppercase font-bold mb-0.5">{stat.label}</p>
                  <p className="text-xs font-semibold text-[#e5e2e1]">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* What you'll get */}
            <div className="bg-[#D1FD52]/5 border border-[#D1FD52]/20 rounded-xl p-4 mb-6">
              <p className="text-[11px] font-black text-[#D1FD52] uppercase tracking-widest mb-2">What this plan does</p>
              <p className="text-xs text-neutral-300 leading-relaxed">
                This structured {plan.duration} program targets <strong className="text-white">{plan.target_focus}</strong> with
                daily progressive sessions. Each day builds on the last — follow the protocol, complete every task, and unlock the next day.
              </p>
            </div>

            <button
              onClick={onStart}
              className="w-full py-3.5 rounded-xl bg-[#D1FD52] text-[#0e0e0e] font-black text-sm tracking-wide uppercase hover:shadow-[0_0_30px_rgba(209,253,82,0.35)] active:scale-[0.98] transition-all duration-200"
            >
              Start Plan → Day 1
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DAY TRACKER VIEW ─────────────────────────────────────────────────────────
const DayTracker = ({ plan, content, progress, onClose, onCompleteDay }) => {
  const completedDays = progress.filter(p => p.is_completed).map(p => p.day_number);
  const totalDays = content.length;

  // Find current active day (first incomplete enrolled day)
  const currentDay = content.find(d => !completedDays.includes(d.day_number)) || content[0];
  const [activeDay, setActiveDay] = useState(currentDay?.day_number || 1);
  const [completing, setCompleting] = useState(false);

  const activeDayData = content.find(d => d.day_number === activeDay);
  const isDayComplete = completedDays.includes(activeDay);
  const progressPct = totalDays > 0 ? Math.round((completedDays.length / totalDays) * 100) : 0;

  const handleComplete = async () => {
    if (isDayComplete || completing) return;
    setCompleting(true);
    await onCompleteDay(activeDay);
    setCompleting(false);
    // Auto-advance to next day
    const nextDay = content.find(d => d.day_number > activeDay && !completedDays.includes(d.day_number));
    if (nextDay) setTimeout(() => setActiveDay(nextDay.day_number), 400);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#0e0e0e] flex flex-col" style={{ animation: 'fadeIn 0.25s ease' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#131313]">
        <button onClick={onClose} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-medium">
          <Icon name="arrow_back" className="text-[18px]" />
          <span>Back to Plans</span>
        </button>
        <div className="text-center">
          <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">{plan.title}</p>
          <p className="text-xs text-[#D1FD52] font-bold">{completedDays.length}/{totalDays} days complete</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-[#D1FD52]">{progressPct}%</p>
          <p className="text-[10px] text-neutral-600 uppercase font-bold">Progress</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-black/60 w-full">
        <div
          className="h-full bg-[#D1FD52] transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Day list sidebar */}
        <div className="w-20 md:w-56 bg-[#131313] border-r border-white/5 overflow-y-auto flex-shrink-0">
          {content.map(day => {
            const done = completedDays.includes(day.day_number);
            const isActive = day.day_number === activeDay;
            return (
              <button
                key={day.day_number}
                onClick={() => setActiveDay(day.day_number)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-l-2 ${
                  isActive
                    ? 'bg-[#D1FD52]/10 border-[#D1FD52] text-[#e5e2e1]'
                    : done
                    ? 'border-transparent text-neutral-500 hover:bg-white/5'
                    : 'border-transparent text-neutral-500 hover:bg-white/5'
                }`}
              >
                {/* Day number circle */}
                <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-black ${
                  done ? 'bg-[#D1FD52] text-black' : isActive ? 'bg-[#D1FD52]/20 text-[#D1FD52]' : 'bg-white/5 text-neutral-600'
                }`}>
                  {done ? <Icon name="check" className="text-[14px]" weight={700} /> : day.day_number}
                </div>
                {/* Label (hidden on small sidebar) */}
                <div className="hidden md:block overflow-hidden">
                  <p className={`text-xs font-bold truncate ${isActive ? 'text-[#e5e2e1]' : done ? 'text-neutral-500' : 'text-neutral-600'}`}>
                    {day.title}
                  </p>
                  <p className="text-[10px] text-neutral-600">{day.duration_mins} mins</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {activeDayData && (
            <div className="max-w-2xl mx-auto" key={activeDay} style={{ animation: 'slideUp 0.2s ease' }}>
              {/* Day header */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black text-[#D1FD52] uppercase tracking-widest bg-[#D1FD52]/10 px-2.5 py-1 rounded-full border border-[#D1FD52]/20">
                  Day {activeDayData.day_number}
                </span>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5">
                  {activeDayData.activity_type}
                </span>
                {isDayComplete && (
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                    ✓ Completed
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-[#e5e2e1] mb-4 leading-tight">
                {activeDayData.title}
              </h1>

              <p className="text-neutral-400 text-sm leading-relaxed mb-8">
                {activeDayData.description}
              </p>

              {/* Session card */}
              <div className="bg-[#1c1b1b] border border-white/8 rounded-2xl p-6 mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#D1FD52]/10 border border-[#D1FD52]/20 flex items-center justify-center">
                    <Icon name="fitness_center" className="text-[#D1FD52] text-[20px]" fill={1} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-0.5">Today's Session</p>
                    <p className="text-sm font-bold text-[#e5e2e1]">{activeDayData.activity_type}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-2xl font-black text-[#e5e2e1]">{activeDayData.duration_mins}</p>
                    <p className="text-[10px] text-neutral-500 uppercase font-bold">minutes</p>
                  </div>
                </div>

                {/* Protocol steps derived from description */}
                <div className="space-y-3">
                  {[
                    { step: '01', label: 'Warm-up', detail: '5 min dynamic stretch', icon: 'self_improvement' },
                    { step: '02', label: 'Main Work', detail: activeDayData.title, icon: 'sports_gymnastics' },
                    { step: '03', label: 'Cool-down', detail: '5 min static stretch + breathing', icon: 'air' },
                  ].map(task => (
                    <div key={task.step} className="flex items-center gap-3 p-3 rounded-xl bg-[#252424] border border-white/5">
                      <span className="text-[10px] font-black text-neutral-600 w-6">{task.step}</span>
                      <Icon name={task.icon} className="text-neutral-500 text-[16px]" fill={1} />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[#e5e2e1]">{task.label}</p>
                        <p className="text-[11px] text-neutral-500">{task.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                {/* Skip / Next */}
                {!isDayComplete && (
                  <button
                    onClick={() => {
                      const next = content.find(d => d.day_number > activeDay);
                      if (next) setActiveDay(next.day_number);
                    }}
                    className="flex-1 py-3.5 rounded-xl border border-white/10 text-neutral-400 font-bold text-sm hover:border-white/20 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Icon name="skip_next" className="text-[18px]" />
                    Skip for Now
                  </button>
                )}

                {/* Complete */}
                <button
                  onClick={handleComplete}
                  disabled={isDayComplete || completing}
                  className={`flex-1 py-3.5 rounded-xl font-black text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 ${
                    isDayComplete
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 cursor-default'
                      : completing
                      ? 'bg-[#D1FD52]/50 text-black cursor-wait'
                      : 'bg-[#D1FD52] text-black hover:shadow-[0_0_25px_rgba(209,253,82,0.3)] active:scale-[0.98]'
                  }`}
                >
                  {isDayComplete ? (
                    <><Icon name="verified" className="text-[18px]" fill={1} /> Day Complete</>
                  ) : completing ? (
                    <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><Icon name="check_circle" className="text-[18px]" fill={1} /> Mark Day Complete</>
                  )}
                </button>
              </div>

              {/* Completion nudge */}
              {!isDayComplete && (
                <p className="text-center text-[11px] text-neutral-600 mt-4">
                  Complete this day to unlock Day {activeDayData.day_number + 1}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </div>
  );
};

// ─── MAIN PLANS PAGE ──────────────────────────────────────────────────────────
const Plans = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIX: Define USER_ID by getting it from local storage
  const userData = JSON.parse(localStorage.getItem('user'));
  const USER_ID = userData?.id || userData?.user?.id;

  // Overlays
  const [detailPlan, setDetailPlan]       = useState(null); // plan detail overlay
  const [trackerPlan, setTrackerPlan]     = useState(null); // day tracker
  const [trackerContent, setTrackerContent] = useState([]);
  const [trackerProgress, setTrackerProgress] = useState([]);

  const fetchMarketplace = async () => {
    // Prevent fetch if no user is found
    if (!USER_ID) {
        console.error("No USER_ID found in local storage.");
        setLoading(false);
        return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/plans/${USER_ID}`);
      setTrainingPlans(await res.json());
    } catch (err) {
      console.error('Marketplace Sync Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMarketplace(); }, []);

  const handleEnroll = async (planId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/plans/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, planId }),
      });
      if (res.ok) fetchMarketplace();
    } catch (err) {
      console.error('Enrollment failed:', err);
    }
  };

  // Open detail overlay for a plan
  const openDetail = (plan) => setDetailPlan(plan);

  // Start tracker — fetch content + progress then open
  const startTracker = async (plan) => {
    setDetailPlan(null);
    try {
      const [contentRes, progressRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/plans/content/${plan.id}`),
        fetch(`${API_BASE_URL}/api/plans/progress/${USER_ID}/${plan.id}`),
      ]);
      const content  = await contentRes.json();
      const progress = await progressRes.json();
      setTrackerContent(content);
      setTrackerProgress(progress);
      setTrackerPlan(plan);
    } catch (err) {
      console.error('Tracker load error:', err);
    }
  };

  // Complete a day
  const handleCompleteDay = async (dayNumber) => {
    try {
      await fetch(`${API_BASE_URL}/api/plans/progress/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, planId: trackerPlan.id, dayNumber }),
      });
      // Update local progress state
      setTrackerProgress(prev => {
        const exists = prev.find(p => p.day_number === dayNumber);
        if (exists) return prev.map(p => p.day_number === dayNumber ? { ...p, is_completed: 1 } : p);
        return [...prev, { day_number: dayNumber, is_completed: 1 }];
      });
    } catch (err) {
      console.error('Complete day error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-[Inter,sans-serif]">
      <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />
      <Topbar sidebarExpanded={sidebarExpanded} />

      <main
        className="pt-24 pb-12 px-6 md:px-12 min-h-screen transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ marginLeft: sidebarExpanded ? 240 : 72 }}
      >
        <header className="mb-12 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[#D1FD52] text-xs font-bold tracking-[0.3em] uppercase">Training Store</span>
            <h1 className="text-4xl md:text-5xl font-extrabold font-[Manrope] tracking-tight text-[#e5e2e1]">
              Performance <span className="text-neutral-600">Blueprints</span>
            </h1>
          </div>
        </header>

        <section className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full py-20 text-center animate-pulse text-neutral-500 tracking-widest uppercase text-xs">
              Synchronizing Blueprints...
            </div>
          ) : (
            trainingPlans.map((plan) => (
              <div
                key={plan.id}
                className="group relative bg-[#1c1b1b] rounded-xl overflow-hidden border border-white/5 hover:border-[#D1FD52]/30 transition-all duration-500 flex flex-col shadow-2xl cursor-pointer"
                onClick={() => openDetail(plan)}
              >
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img
                    src={`https://api.dicebear.com/7.x/shapes/svg?seed=${plan.image_seed}`}
                    alt={plan.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-40"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-[#D1FD52] tracking-widest uppercase">
                      {plan.tag}
                    </span>
                    {plan.is_enrolled === 1 && (
                      <span className="px-2 py-1 rounded bg-[#D1FD52] text-black text-[10px] font-bold tracking-widest uppercase">
                        Owned
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold font-[Manrope] mb-2 text-[#e5e2e1]">{plan.title}</h3>
                  <p className="text-sm text-neutral-400 mb-6 line-clamp-2">{plan.description}</p>

                  <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Time</p>
                      <p className="text-sm font-medium">{plan.duration}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Strain</p>
                      <p className={`text-sm font-medium ${plan.intensity === 'Extreme' ? 'text-red-400' : 'text-[#D1FD52]'}`}>{plan.intensity}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1">Focus</p>
                      <p className="text-sm font-medium">{plan.target_focus}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5" onClick={e => e.stopPropagation()}>
                    <span className="text-lg font-bold text-[#e5e2e1]">${plan.price}</span>

                    {plan.is_enrolled === 1 ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); startTracker(plan); }}
                        className="px-6 py-2.5 rounded-lg bg-[#D1FD52] text-[#0e0e0e] font-bold text-sm hover:shadow-[0_0_20px_rgba(209,253,82,0.3)] active:scale-95 transition-all"
                      >
                        Continue Plan
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEnroll(plan.id); }}
                        className="px-6 py-2.5 rounded-lg bg-[#D1FD52] text-[#0e0e0e] font-bold text-sm hover:shadow-[0_0_20px_rgba(209,253,82,0.3)] active:scale-95 transition-all"
                      >
                        Get Access
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Plan Detail Overlay */}
      {detailPlan && (
        <PlanDetailOverlay
          plan={detailPlan}
          onClose={() => setDetailPlan(null)}
          onStart={() => {
            if (detailPlan.is_enrolled === 1) {
              startTracker(detailPlan);
            } else {
              handleEnroll(detailPlan.id).then(() => startTracker(detailPlan));
            }
          }}
        />
      )}

      {/* Day Tracker Full-Screen */}
      {trackerPlan && (
        <DayTracker
          plan={trackerPlan}
          content={trackerContent}
          progress={trackerProgress}
          onClose={() => { setTrackerPlan(null); fetchMarketplace(); }}
          onCompleteDay={handleCompleteDay}
        />
      )}

      <MobileNav />

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
      `}</style>
    </div>
  );
};

export default Plans;