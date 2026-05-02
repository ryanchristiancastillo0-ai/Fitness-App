import React, { useState, useEffect, useMemo } from 'react';
import { MobileNav, Sidebar, Topbar } from '../components';
import { API_BASE_URL } from '../config/port';

// ─── ICON ─────────────────────────────────────────────────────────────────────
const Icon = ({ name, className = '', fill = 0, weight = 300 }) => (
  <span
    className={`material-symbols-outlined leading-none select-none ${className}`}
    style={{ fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24` }}
  >
    {name}
  </span>
);

// ─── PLAN CARD ────────────────────────────────────────────────────────────────
const PlanCard = ({ plan, onOpen, onEnroll, onContinue, style = {} }) => (
  <div
    className="group relative bg-[#1c1b1b] rounded-2xl overflow-hidden border border-white/5 hover:border-[#D1FD52]/30 transition-all duration-500 flex flex-col shadow-2xl cursor-pointer"
    onClick={() => onOpen(plan)}
    style={style}
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
        {[
          { label: 'Time',   value: plan.duration },
          { label: 'Strain', value: plan.intensity, colored: true },
          { label: 'Focus',  value: plan.target_focus },
        ].map(({ label, value, colored }) => (
          <div key={label}>
            <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1">{label}</p>
            <p className={`text-sm font-medium ${colored && value === 'Extreme' ? 'text-red-400' : colored ? 'text-[#D1FD52]' : 'text-[#e5e2e1]'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5" onClick={e => e.stopPropagation()}>
        <span className="text-lg font-bold text-[#e5e2e1]">${plan.price}</span>
        {plan.is_enrolled === 1 ? (
          <button
            onClick={e => { e.stopPropagation(); onContinue(plan); }}
            className="px-6 py-2.5 rounded-lg bg-[#D1FD52] text-[#0e0e0e] font-bold text-sm hover:shadow-[0_0_20px_rgba(209,253,82,0.3)] active:scale-95 transition-all"
          >
            Continue Plan
          </button>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onEnroll(plan.id); }}
            className="px-6 py-2.5 rounded-lg bg-[#D1FD52] text-[#0e0e0e] font-bold text-sm hover:shadow-[0_0_20px_rgba(209,253,82,0.3)] active:scale-95 transition-all"
          >
            Get Access
          </button>
        )}
      </div>
    </div>
  </div>
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
        <div className="overflow-y-auto flex-1">
          <div className="aspect-[16/7] relative overflow-hidden flex-shrink-0">
            <img
              src={`https://api.dicebear.com/7.x/shapes/svg?seed=${plan.image_seed}`}
              alt={plan.title}
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/40 to-transparent" />
            <div className="absolute bottom-4 left-6 flex gap-2">
              <span className="px-2 py-1 rounded bg-[#D1FD52] text-black text-[10px] font-black tracking-widest uppercase">{plan.tag}</span>
              <span className="px-2 py-1 rounded bg-white/10 backdrop-blur text-white text-[10px] font-bold tracking-widest uppercase">{plan.intensity}</span>
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>

          <div className="p-6">
            <h2 className="text-2xl font-black text-[#e5e2e1] mb-1">{plan.title}</h2>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6">{plan.description}</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Duration',  value: plan.duration,     icon: 'schedule' },
                { label: 'Intensity', value: plan.intensity,    icon: 'bolt' },
                { label: 'Focus',     value: plan.target_focus, icon: 'track_changes' },
              ].map(stat => (
                <div key={stat.label} className="bg-[#252424] rounded-xl p-3 text-center border border-white/5">
                  <Icon name={stat.icon} className="text-[#D1FD52] text-[16px] mb-1" fill={1} />
                  <p className="text-[10px] text-neutral-500 uppercase font-bold mb-0.5">{stat.label}</p>
                  <p className="text-xs font-semibold text-[#e5e2e1]">{stat.value}</p>
                </div>
              ))}
            </div>

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
              {plan.is_enrolled === 1 ? 'Open Plan Tracker' : 'Start Plan → Day 1'}
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
  const totalDays     = content.length;
  const currentDay    = content.find(d => !completedDays.includes(d.day_number)) || content[0];

  const [activeDay,  setActiveDay]  = useState(currentDay?.day_number || 1);
  const [completing, setCompleting] = useState(false);

  const activeDayData = content.find(d => d.day_number === activeDay);
  const isDayComplete = completedDays.includes(activeDay);
  const progressPct   = totalDays > 0 ? Math.round((completedDays.length / totalDays) * 100) : 0;

  const handleComplete = async () => {
    if (isDayComplete || completing) return;
    setCompleting(true);
    await onCompleteDay(activeDay);
    setCompleting(false);
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

      <div className="h-1 bg-black/60 w-full">
        <div className="h-full bg-[#D1FD52] transition-all duration-700 ease-out" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Day list sidebar */}
        <div className="w-20 md:w-56 bg-[#131313] border-r border-white/5 overflow-y-auto flex-shrink-0">
          {content.map(day => {
            const done     = completedDays.includes(day.day_number);
            const isActive = day.day_number === activeDay;
            return (
              <button
                key={day.day_number}
                onClick={() => setActiveDay(day.day_number)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-l-2 ${
                  isActive ? 'bg-[#D1FD52]/10 border-[#D1FD52] text-[#e5e2e1]' : 'border-transparent text-neutral-500 hover:bg-white/5'
                }`}
              >
                <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-black ${
                  done ? 'bg-[#D1FD52] text-black' : isActive ? 'bg-[#D1FD52]/20 text-[#D1FD52]' : 'bg-white/5 text-neutral-600'
                }`}>
                  {done ? <Icon name="check" className="text-[14px]" weight={700} /> : day.day_number}
                </div>
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

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {activeDayData && (
            <div className="max-w-2xl mx-auto" key={activeDay} style={{ animation: 'slideUp 0.2s ease' }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black text-[#D1FD52] uppercase tracking-widest bg-[#D1FD52]/10 px-2.5 py-1 rounded-full border border-[#D1FD52]/20">Day {activeDayData.day_number}</span>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5">{activeDayData.activity_type}</span>
                {isDayComplete && <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">✓ Completed</span>}
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-[#e5e2e1] mb-4 leading-tight">{activeDayData.title}</h1>
              <p className="text-neutral-400 text-sm leading-relaxed mb-8">{activeDayData.description}</p>

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

                <div className="space-y-3">
                  {[
                    { step: '01', label: 'Warm-up',   detail: '5 min dynamic stretch',              icon: 'self_improvement' },
                    { step: '02', label: 'Main Work',  detail: activeDayData.title,                  icon: 'sports_gymnastics' },
                    { step: '03', label: 'Cool-down',  detail: '5 min static stretch + breathing',   icon: 'air' },
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

              <div className="flex gap-3">
                {!isDayComplete && (
                  <button
                    onClick={() => { const next = content.find(d => d.day_number > activeDay); if (next) setActiveDay(next.day_number); }}
                    className="flex-1 py-3.5 rounded-xl border border-white/10 text-neutral-400 font-bold text-sm hover:border-white/20 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Icon name="skip_next" className="text-[18px]" /> Skip for Now
                  </button>
                )}
                <button
                  onClick={handleComplete}
                  disabled={isDayComplete || completing}
                  className={`flex-1 py-3.5 rounded-xl font-black text-sm tracking-wide uppercase transition-all flex items-center justify-center gap-2 ${
                    isDayComplete ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 cursor-default'
                    : completing  ? 'bg-[#D1FD52]/50 text-black cursor-wait'
                    : 'bg-[#D1FD52] text-black hover:shadow-[0_0_25px_rgba(209,253,82,0.3)] active:scale-[0.98]'
                  }`}
                >
                  {isDayComplete ? <><Icon name="verified" className="text-[18px]" fill={1} /> Day Complete</>
                  : completing   ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Saving...</>
                  : <><Icon name="check_circle" className="text-[18px]" fill={1} /> Mark Day Complete</>}
                </button>
              </div>

              {!isDayComplete && (
                <p className="text-center text-[11px] text-neutral-600 mt-4">
                  Complete this day to unlock Day {activeDayData.day_number + 1}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── MY PLANS TAB ─────────────────────────────────────────────────────────────
const MyPlans = ({ plans, onOpen, onContinue }) => {
  const enrolled = plans.filter(p => p.is_enrolled === 1);

  if (enrolled.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-4 text-center" style={{ animation: 'fadeIn 0.3s ease' }}>
        <div className="w-20 h-20 rounded-2xl bg-[#D1FD52]/10 border border-[#D1FD52]/20 flex items-center justify-center mb-2">
          <Icon name="fitness_center" className="text-[#D1FD52] text-[36px]" fill={1} />
        </div>
        <h3 className="text-xl font-black text-[#e5e2e1] font-[Manrope]">No plans yet</h3>
        <p className="text-sm text-neutral-500 max-w-xs leading-relaxed">
          You haven't enrolled in any training blueprint. Head to <span className="text-[#D1FD52] font-bold">Explore</span> to find your first plan.
        </p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Active plan spotlight — most recently enrolled */}
      {(() => {
        const active = enrolled[0];
        const progressPct = active.progress_pct ?? 0;
        return (
          <div
            className="mb-10 bg-[#1c1b1b] rounded-2xl overflow-hidden border border-[#D1FD52]/20 cursor-pointer hover:border-[#D1FD52]/40 transition-all duration-300 group"
            onClick={() => onOpen(active)}
          >
            <div className="relative h-36 overflow-hidden">
              <img
                src={`https://api.dicebear.com/7.x/shapes/svg?seed=${active.image_seed}`}
                alt={active.title}
                className="w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1c1b1b] via-[#1c1b1b]/70 to-transparent" />
              <div className="absolute inset-0 flex items-center px-8 gap-6">
                <div className="flex-1">
                  <span className="text-[10px] font-black text-[#D1FD52] tracking-widest uppercase">Currently Active</span>
                  <h2 className="text-2xl font-black text-[#e5e2e1] font-[Manrope] mt-0.5 mb-2">{active.title}</h2>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#D1FD52] rounded-full transition-all duration-700"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-[#D1FD52] tabular-nums">{progressPct}%</span>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onContinue(active); }}
                  className="px-6 py-3 rounded-xl bg-[#D1FD52] text-black font-black text-sm tracking-wide uppercase hover:shadow-[0_0_25px_rgba(209,253,82,0.4)] active:scale-95 transition-all flex-shrink-0"
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Rest of enrolled plans */}
      {enrolled.length > 1 && (
        <>
          <p className="text-[11px] font-black text-neutral-600 uppercase tracking-widest mb-4">All Enrolled Plans</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolled.slice(1).map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onOpen={onOpen}
                onEnroll={() => {}}
                onContinue={onContinue}
                style={{ animation: `slideUp 0.3s ease ${i * 0.06}s both` }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── FIND PLAN TAB ────────────────────────────────────────────────────────────
const INTENSITY_OPTIONS = ['All', 'Beginner', 'Moderate', 'Advanced', 'Extreme'];
const FOCUS_OPTIONS     = ['All', 'Strength', 'Cardio', 'Flexibility', 'Recovery', 'Fat Loss', 'Hypertrophy'];
const DURATION_OPTIONS  = ['All', '1 Week', '2 Weeks', '4 Weeks', '8 Weeks', '12 Weeks'];

const FindPlan = ({ plans, onOpen, onEnroll, onContinue }) => {
  const [query,     setQuery]     = useState('');
  const [intensity, setIntensity] = useState('All');
  const [focus,     setFocus]     = useState('All');
  const [duration,  setDuration]  = useState('All');

  const filtered = useMemo(() => plans.filter(p => {
    const q = query.toLowerCase();
    const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.tag?.toLowerCase().includes(q);
    const matchesIntensity = intensity === 'All' || p.intensity === intensity;
    const matchesFocus     = focus === 'All'     || p.target_focus?.toLowerCase().includes(focus.toLowerCase());
    const matchesDuration  = duration === 'All'  || p.duration === duration;
    return matchesQuery && matchesIntensity && matchesFocus && matchesDuration;
  }), [plans, query, intensity, focus, duration]);

  const FilterPill = ({ options, active, onSelect }) => (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
            active === opt
              ? 'bg-[#D1FD52] text-black'
              : 'bg-white/5 text-neutral-500 border border-white/8 hover:border-white/20 hover:text-neutral-300'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Search bar */}
      <div className="relative mb-6">
        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 text-[20px]" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search blueprints by name, tag, or goal..."
          className="w-full bg-[#1c1b1b] border border-white/8 rounded-xl pl-12 pr-4 py-3.5 text-sm text-[#e5e2e1] placeholder-neutral-600 focus:outline-none focus:border-[#D1FD52]/40 transition-colors"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors">
            <Icon name="close" className="text-[18px]" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-5 mb-8 space-y-4">
        <div>
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2.5">Intensity</p>
          <FilterPill options={INTENSITY_OPTIONS} active={intensity} onSelect={setIntensity} />
        </div>
        <div>
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2.5">Focus Area</p>
          <FilterPill options={FOCUS_OPTIONS} active={focus} onSelect={setFocus} />
        </div>
        <div>
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2.5">Duration</p>
          <FilterPill options={DURATION_OPTIONS} active={duration} onSelect={setDuration} />
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-neutral-500">
          <span className="text-[#e5e2e1] font-bold">{filtered.length}</span> blueprint{filtered.length !== 1 ? 's' : ''} found
        </p>
        {(query || intensity !== 'All' || focus !== 'All' || duration !== 'All') && (
          <button
            onClick={() => { setQuery(''); setIntensity('All'); setFocus('All'); setDuration('All'); }}
            className="text-[11px] text-[#D1FD52] font-bold uppercase tracking-widest hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 text-center">
          <Icon name="search_off" className="text-neutral-700 text-[48px]" />
          <p className="text-neutral-500 text-sm">No blueprints match your filters.</p>
          <button onClick={() => { setQuery(''); setIntensity('All'); setFocus('All'); setDuration('All'); }} className="text-[#D1FD52] text-sm font-bold hover:underline">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onOpen={onOpen}
              onEnroll={onEnroll}
              onContinue={onContinue}
              style={{ animation: `slideUp 0.3s ease ${i * 0.05}s both` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── EXPLORE TAB ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'All',          icon: 'grid_view',       tag: null },
  { label: 'Strength',     icon: 'fitness_center',  tag: 'Strength' },
  { label: 'Fat Loss',     icon: 'local_fire_department', tag: 'Fat Loss' },
  { label: 'Recovery',     icon: 'spa',             tag: 'Recovery' },
  { label: 'Cardio',       icon: 'directions_run',  tag: 'Cardio' },
  { label: 'Flexibility',  icon: 'self_improvement',tag: 'Flexibility' },
];

const Explore = ({ plans, onOpen, onEnroll, onContinue }) => {
  const [activeCategory, setActiveCategory] = useState(null);

  const featured  = plans.slice(0, 2);
  const displayed = activeCategory ? plans.filter(p => p.tag === activeCategory) : plans;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Featured banner — top 2 plans */}
      {featured.length > 0 && (
        <div className="mb-10">
          <p className="text-[11px] font-black text-neutral-600 uppercase tracking-widest mb-4">Featured Blueprints</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {featured.map((plan, i) => (
              <div
                key={plan.id}
                className="relative overflow-hidden rounded-2xl cursor-pointer group border border-white/5 hover:border-[#D1FD52]/40 transition-all duration-500"
                onClick={() => onOpen(plan)}
                style={{ animation: `slideUp 0.4s ease ${i * 0.1}s both` }}
              >
                <div className="aspect-[21/9] overflow-hidden">
                  <img
                    src={`https://api.dicebear.com/7.x/shapes/svg?seed=${plan.image_seed}`}
                    alt={plan.title}
                    className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-[#D1FD52] text-black text-[9px] font-black tracking-widest uppercase">{plan.tag}</span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[9px] font-bold tracking-widest uppercase">{plan.intensity}</span>
                  </div>
                  <h3 className="text-xl font-black text-[#e5e2e1] font-[Manrope]">{plan.title}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{plan.description}</p>
                </div>
                {plan.is_enrolled === 1 && (
                  <div className="absolute top-4 right-4 px-2 py-1 rounded bg-[#D1FD52] text-black text-[9px] font-black tracking-widest uppercase">Owned</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(cat.tag)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex-shrink-0 transition-all ${
              activeCategory === cat.tag
                ? 'bg-[#D1FD52] text-black'
                : 'bg-[#1c1b1b] text-neutral-500 border border-white/8 hover:border-white/20 hover:text-neutral-300'
            }`}
          >
            <Icon name={cat.icon} className="text-[16px]" fill={activeCategory === cat.tag ? 1 : 0} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 text-center">
          <Icon name="category" className="text-neutral-700 text-[48px]" />
          <p className="text-neutral-500 text-sm">No blueprints in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onOpen={onOpen}
              onEnroll={onEnroll}
              onContinue={onContinue}
              style={{ animation: `slideUp 0.3s ease ${i * 0.05}s both` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── TAB BAR ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'my-plans', label: 'My Plans',  icon: 'bookmarks' },
  { id: 'find',     label: 'Find Plan', icon: 'search' },
  { id: 'explore',  label: 'Explore',   icon: 'explore' },
];

const TabBar = ({ active, onChange, enrolledCount }) => (
  <div className="flex gap-1 bg-[#1a1a1a] border border-white/8 rounded-xl p-1 w-fit mb-10">
    {TABS.map(tab => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
          active === tab.id ? 'bg-[#D1FD52] text-black' : 'text-neutral-500 hover:text-neutral-300'
        }`}
      >
        <Icon name={tab.icon} className="text-[16px]" fill={active === tab.id ? 1 : 0} />
        {tab.label}
        {tab.id === 'my-plans' && enrolledCount > 0 && (
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
            active === tab.id ? 'bg-black/20 text-black' : 'bg-[#D1FD52]/15 text-[#D1FD52]'
          }`}>
            {enrolledCount}
          </span>
        )}
      </button>
    ))}
  </div>
);

// ─── MAIN PLANS PAGE ──────────────────────────────────────────────────────────
const Plans = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [trainingPlans,   setTrainingPlans]   = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [activeTab,       setActiveTab]       = useState('explore');

  const [detailPlan,       setDetailPlan]       = useState(null);
  const [trackerPlan,      setTrackerPlan]      = useState(null);
  const [trackerContent,   setTrackerContent]   = useState([]);
  const [trackerProgress,  setTrackerProgress]  = useState([]);

  // ✅ Cookie-based auth — get user via /api/auth/me
  const [USER_ID, setUSER_ID] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setUSER_ID(data.id);
      } catch (err) {
        console.error('Auth error:', err);
      }
    };
    getUser();
  }, []);

  const fetchMarketplace = async () => {
    if (!USER_ID) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/plans/${USER_ID}`, { credentials: 'include' });
      setTrainingPlans(await res.json());
    } catch (err) {
      console.error('Marketplace Sync Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMarketplace(); }, [USER_ID]);

  const handleEnroll = async (planId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/plans/enroll`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: USER_ID, planId }),
      });
      if (res.ok) {
        fetchMarketplace();
        setActiveTab('my-plans');
      }
    } catch (err) {
      console.error('Enrollment failed:', err);
    }
  };

  const startTracker = async (plan) => {
    setDetailPlan(null);
    try {
      const [contentRes, progressRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/plans/content/${plan.id}`,              { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/plans/progress/${USER_ID}/${plan.id}`,  { credentials: 'include' }),
      ]);
      setTrackerContent(await contentRes.json());
      setTrackerProgress(await progressRes.json());
      setTrackerPlan(plan);
    } catch (err) {
      console.error('Tracker load error:', err);
    }
  };

  const handleCompleteDay = async (dayNumber) => {
    try {
      await fetch(`${API_BASE_URL}/api/plans/progress/complete`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: USER_ID, planId: trackerPlan.id, dayNumber }),
      });
      setTrackerProgress(prev => {
        const exists = prev.find(p => p.day_number === dayNumber);
        if (exists) return prev.map(p => p.day_number === dayNumber ? { ...p, is_completed: 1 } : p);
        return [...prev, { day_number: dayNumber, is_completed: 1 }];
      });
    } catch (err) {
      console.error('Complete day error:', err);
    }
  };

  const enrolledCount = trainingPlans.filter(p => p.is_enrolled === 1).length;

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-[Inter,sans-serif]">
      <div className="hidden md:block">
        <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />
      </div>
      <Topbar sidebarExpanded={sidebarExpanded} />

      <main
        className={`pt-24 pb-24 md:pb-12 px-4 md:px-10 min-h-screen transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
          ${sidebarExpanded ? 'md:ml-[240px]' : 'md:ml-[72px] ml-0'}`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Page header */}
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[#D1FD52] text-xs font-bold tracking-[0.3em] uppercase">Training Store</span>
              <h1 className="text-4xl md:text-5xl font-extrabold font-[Manrope] tracking-tight text-[#e5e2e1]">
                Performance <span className="text-neutral-600">Blueprints</span>
              </h1>
            </div>
            {enrolledCount > 0 && (
              <div className="flex items-center gap-2 bg-[#D1FD52]/10 border border-[#D1FD52]/20 rounded-xl px-4 py-2.5">
                <Icon name="trophy" className="text-[#D1FD52] text-[18px]" fill={1} />
                <span className="text-sm font-bold text-[#e5e2e1]">{enrolledCount} plan{enrolledCount !== 1 ? 's' : ''} active</span>
              </div>
            )}
          </header>

          {/* Tab bar */}
          <TabBar active={activeTab} onChange={setActiveTab} enrolledCount={enrolledCount} />

          {/* Tab content */}
          {loading ? (
            <div className="py-20 text-center animate-pulse text-neutral-500 tracking-widest uppercase text-xs">
              Synchronizing Blueprints...
            </div>
          ) : (
            <>
              {activeTab === 'my-plans' && (
                <MyPlans
                  plans={trainingPlans}
                  onOpen={setDetailPlan}
                  onContinue={startTracker}
                />
              )}
              {activeTab === 'find' && (
                <FindPlan
                  plans={trainingPlans}
                  onOpen={setDetailPlan}
                  onEnroll={handleEnroll}
                  onContinue={startTracker}
                />
              )}
              {activeTab === 'explore' && (
                <Explore
                  plans={trainingPlans}
                  onOpen={setDetailPlan}
                  onEnroll={handleEnroll}
                  onContinue={startTracker}
                />
              )}
            </>
          )}
        </div>
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
              handleEnroll(detailPlan.id);
              setDetailPlan(null);
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

      <div className="md:hidden"><MobileNav /></div>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Plans;