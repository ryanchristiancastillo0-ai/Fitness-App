import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, Topbar, MobileNav } from '../components';
import { API_BASE_URL } from '../config/port';
import { useAuth } from '../hooks/useAuth';

// ─── BMI Category Config ────────────────────────────────────────────────────
const BMI_CATEGORIES = [
  { label: 'Underweight', range: '< 18.5',      color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)'  },
  { label: 'Normal',      range: '18.5 – 24.9', color: '#D1FD52', bg: 'rgba(209,253,82,0.1)',  border: 'rgba(209,253,82,0.3)'  },
  { label: 'Overweight',  range: '25 – 29.9',   color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.3)'  },
  { label: 'Obese',       range: '≥ 30',         color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
];

const getCategoryStyle = (category) =>
  BMI_CATEGORIES.find((c) => c.label === category) || BMI_CATEGORIES[1];

// ─── Shared Section Header ──────────────────────────────────────────────────
const SectionHeader = ({ icon, title, count }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="material-symbols-outlined text-[#D1FD52] text-[20px]">{icon}</span>
    <h2 className="font-[Manrope] font-bold text-[15px] text-[#e5e2e1] tracking-wide">{title}</h2>
    {count !== undefined && (
      <span className="ml-auto text-[11px] text-[#555] font-medium">{count} records</span>
    )}
  </div>
);

// ─── Empty State ────────────────────────────────────────────────────────────
const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-10 text-[#444]">
    <span className="material-symbols-outlined text-[36px] mb-2">inbox</span>
    <p className="text-[12px] font-medium">{message}</p>
  </div>
);

// ─── Show More Button ────────────────────────────────────────────────────────
const ShowMoreBtn = ({ onClick, loading }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="w-full mt-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest
               text-[#D1FD52] border border-[#D1FD52]/20 bg-[#D1FD52]/5
               hover:bg-[#D1FD52]/10 transition-all duration-200 disabled:opacity-40"
  >
    {loading ? 'Loading…' : 'Show More'}
  </button>
);

// ─── Card Wrapper ────────────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-[#1a1a1a] border border-white/[0.06] rounded-2xl p-5 ${className}`}>
    {children}
  </div>
);

// ─── BMI Gauge Bar ────────────────────────────────────────────────────────────
const BmiGaugeBar = ({ bmi }) => {
  // Map bmi 10–40 to 0–100%
  const pct = Math.min(100, Math.max(0, ((bmi - 10) / 30) * 100));
  const style = getCategoryStyle(
    bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
  );
  return (
    <div className="relative h-2 rounded-full bg-white/[0.06] overflow-visible mt-2">
      {/* gradient track */}
      <div className="absolute inset-0 rounded-full"
        style={{ background: 'linear-gradient(to right, #60a5fa 0%, #D1FD52 40%, #fb923c 65%, #f87171 100%)' }} />
      {/* thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#131313] shadow-lg z-10 transition-all duration-500"
        style={{ left: `calc(${pct}% - 6px)`, backgroundColor: style.color }}
      />
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
const Records = () => {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const USER_ID = user?.id || null;

  useEffect(() => {
    if (!loading && !USER_ID) navigate('/login');
  }, [USER_ID, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // ── Activity Logs state ────────────────────────────────────────────────
  const [activityLogs,    setActivityLogs]    = useState([]);
  const [activityVisible, setActivityVisible] = useState(10);
  const [activityTotal,   setActivityTotal]   = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);

  // ── Sleep/Water Logs state ─────────────────────────────────────────────
  const [sleepLogs,    setSleepLogs]    = useState([]);
  const [sleepVisible, setSleepVisible] = useState(10);
  const [sleepTotal,   setSleepTotal]   = useState(0);
  const [sleepLoading, setSleepLoading] = useState(false);

  // ── BMI state ──────────────────────────────────────────────────────────
  const [bmiRecords,   setBmiRecords]   = useState([]);
  const [bmiVisible,   setBmiVisible]   = useState(10);
  const [bmiTotal,     setBmiTotal]     = useState(0);
  const [bmiLoading,   setBmiLoading]   = useState(false);
  const [bmiForm,      setBmiForm]      = useState({ weight_kg: '', height_cm: '' });
  const [bmiSaving,    setBmiSaving]    = useState(false);
  const [bmiResult,    setBmiResult]    = useState(null); // { bmi, category }

  // ── Fetch Activity Logs ────────────────────────────────────────────────
  const fetchActivity = useCallback(async (limit) => {
    setActivityLoading(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/logs/history/${USER_ID}?limit=${limit}&offset=0`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setActivityLogs(data);
        setActivityTotal(data.length);
      } else if (data.records) {
        setActivityLogs(data.records);
        setActivityTotal(data.total);
      }
    } catch (err) { console.error('[Records] Activity fetch error:', err); }
    finally { setActivityLoading(false); }
  }, [USER_ID]);

  // ── Fetch Sleep Logs ───────────────────────────────────────────────────
  const fetchSleep = useCallback(async (limit) => {
    setSleepLoading(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/sleep/${USER_ID}?range=M&metric=duration&limit=${limit}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSleepLogs(data);
        setSleepTotal(data.length);
      }
    } catch (err) { console.error('[Records] Sleep fetch error:', err); }
    finally { setSleepLoading(false); }
  }, [USER_ID]);

  // ── Fetch BMI Records ──────────────────────────────────────────────────
  const fetchBmi = useCallback(async (limit) => {
    setBmiLoading(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/bmi/${USER_ID}?limit=${limit}&offset=0`, {
        credentials: 'include',
      });
      const data = await res.json();
      setBmiRecords(data.records || []);
      setBmiTotal(data.total     || 0);
    } catch (err) { console.error('[Records] BMI fetch error:', err); }
    finally { setBmiLoading(false); }
  }, [USER_ID]);

  // ── Init ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!USER_ID) return;
    fetchActivity(10);
    fetchSleep(10);
    fetchBmi(10);
  }, [USER_ID]);

  // ── Show More handlers ─────────────────────────────────────────────────
  const handleShowMoreActivity = () => {
    const next = activityVisible + 10;
    setActivityVisible(next);
    fetchActivity(next);
  };

  const handleShowMoreSleep = () => {
    const next = sleepVisible + 10;
    setSleepVisible(next);
    fetchSleep(next);
  };

  const handleShowMoreBmi = () => {
    const next = bmiVisible + 10;
    setBmiVisible(next);
    fetchBmi(next);
  };

  // ── BMI Submit ─────────────────────────────────────────────────────────
  const handleBmiSubmit = async () => {
    if (!bmiForm.weight_kg || !bmiForm.height_cm) return;
    setBmiSaving(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/bmi/${USER_ID}`, {
        method:  'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          weight_kg: parseFloat(bmiForm.weight_kg),
          height_cm: parseFloat(bmiForm.height_cm),
        }),
      });
      const data = await res.json();
      if (data.bmi) {
        setBmiResult({ bmi: data.bmi, category: data.category });
        setBmiForm({ weight_kg: '', height_cm: '' });
        fetchBmi(bmiVisible);
      }
    } catch (err) { console.error('[BMI] Submit error:', err); }
    finally { setBmiSaving(false); }
  };

  if (!USER_ID) return null;

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-[Inter,sans-serif] overflow-x-hidden">
      {/* ── Sidebar (desktop only) ── */}
      <div className="hidden md:block">
        <Sidebar
          onClick={handleLogout}
          expanded={sidebarExpanded}
          setExpanded={setSidebarExpanded}
        />
      </div>

      {/* ── Topbar ── */}
      <Topbar sidebarExpanded={sidebarExpanded} name={storedUser?.name || storedUser?.user?.name} />

      {/* ── Main Content ── */}
      <main
        className={`pt-[80px] pb-24 md:pb-10 px-4 md:px-6 min-h-screen transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${sidebarExpanded ? 'md:ml-[240px]' : 'md:ml-[72px] ml-0'}`}
      >
        <div className="max-w-[1280px] mx-auto">

          {/* ── Page Header ── */}
          <div className="mb-6 mt-2">
            <h1 className="font-[Manrope] font-black text-[22px] text-[#e5e2e1] tracking-tight">Records</h1>
            <p className="text-[12px] text-[#555] mt-0.5">All your logged health data in one place</p>
          </div>

          {/* ── Grid Layout ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

            {/* ── LEFT COL: Activity + Sleep ── */}
            <div className="xl:col-span-2 flex flex-col gap-4">

              {/* ── Activity Logs ── */}
              <Card>
                <SectionHeader icon="fitness_center" title="Activity Logs" count={activityTotal} />
                {activityLogs.length === 0 ? (
                  <EmptyState message="No activity logs found" />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/[0.05]">
                            {['Date', 'Calories', 'Steps', 'Duration', 'Status'].map(h => (
                              <th key={h} className="pb-2.5 text-[10px] font-bold uppercase tracking-widest text-[#444] pr-4">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activityLogs.map((row, i) => (
                            <tr
                              key={row.id ?? i}
                              className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="py-3 pr-4 text-[12px] text-[#888] whitespace-nowrap">
                                {row.stat_date
                                  ? new Date(row.stat_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                  : row.start_time
                                    ? new Date(row.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                    : '—'}
                              </td>
                              <td className="py-3 pr-4 text-[12px] text-[#e5e2e1] font-semibold">
                                {row.calories_burned !== undefined ? `${Number(row.calories_burned).toLocaleString()} kcal` : '—'}
                              </td>
                              <td className="py-3 pr-4 text-[12px] text-[#e5e2e1]">
                                {row.steps !== undefined ? Number(row.steps).toLocaleString() : '—'}
                              </td>
                              <td className="py-3 pr-4 text-[12px] text-[#e5e2e1]">
                                {row.workout_duration_mins !== undefined ? `${row.workout_duration_mins} min` : '—'}
                              </td>
                              <td className="py-3 pr-4">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest
                                  ${row.status === 'completed'
                                    ? 'bg-[#D1FD52]/10 text-[#D1FD52]'
                                    : 'bg-white/[0.05] text-[#666]'
                                  }`}>
                                  {row.status || 'logged'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {activityLogs.length < activityTotal && (
                      <ShowMoreBtn onClick={handleShowMoreActivity} loading={activityLoading} />
                    )}
                  </>
                )}
              </Card>

              {/* ── Sleep & Water Logs ── */}
              <Card>
                <SectionHeader icon="bedtime" title="Sleep & Water Logs" count={sleepTotal} />
                {sleepLogs.length === 0 ? (
                  <EmptyState message="No sleep or water logs found" />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/[0.05]">
                            {['Date / Time', 'Sleep', 'Quality', 'Water', 'Recovery'].map(h => (
                              <th key={h} className="pb-2.5 text-[10px] font-bold uppercase tracking-widest text-[#444] pr-4">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sleepLogs.map((row, i) => (
                            <tr
                              key={i}
                              className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="py-3 pr-4 text-[12px] text-[#888] whitespace-nowrap">
                                {row.recorded_at || row.label || '—'}
                              </td>
                              <td className="py-3 pr-4 text-[12px] text-[#e5e2e1] font-semibold">
                                {row.sleep_duration !== undefined ? `${row.sleep_duration}h` : row.value !== undefined ? `${row.value}h` : '—'}
                              </td>
                              <td className="py-3 pr-4">
                                {row.sleep_quality !== undefined ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-[#D1FD52]"
                                        style={{ width: `${Math.min(100, row.sleep_quality)}%` }}
                                      />
                                    </div>
                                    <span className="text-[11px] text-[#888]">{row.sleep_quality}%</span>
                                  </div>
                                ) : '—'}
                              </td>
                              <td className="py-3 pr-4 text-[12px] text-[#60a5fa]">
                                {row.water_intake_ml !== undefined ? `${row.water_intake_ml} ml` : '—'}
                              </td>
                              <td className="py-3 pr-4 text-[12px] text-[#888]">
                                {row.recovery_score !== undefined ? `${row.recovery_score}%` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {sleepLogs.length < sleepTotal && (
                      <ShowMoreBtn onClick={handleShowMoreSleep} loading={sleepLoading} />
                    )}
                  </>
                )}
              </Card>
            </div>

            {/* ── RIGHT COL: BMI ── */}
            <div className="xl:col-span-1 flex flex-col gap-4">

              {/* ── BMI Calculator ── */}
              <Card>
                <SectionHeader icon="monitor_weight" title="BMI Calculator" />

                {/* Input Form */}
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#555]">Weight (kg)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 70"
                      value={bmiForm.weight_kg}
                      onChange={(e) => setBmiForm(p => ({ ...p, weight_kg: e.target.value }))}
                      className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-[#e5e2e1]
                                 placeholder-[#444] outline-none focus:border-[#D1FD52]/40 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#555]">Height (cm)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 175"
                      value={bmiForm.height_cm}
                      onChange={(e) => setBmiForm(p => ({ ...p, height_cm: e.target.value }))}
                      className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[13px] text-[#e5e2e1]
                                 placeholder-[#444] outline-none focus:border-[#D1FD52]/40 transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleBmiSubmit}
                    disabled={bmiSaving || !bmiForm.weight_kg || !bmiForm.height_cm}
                    className="w-full py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest
                               bg-[#D1FD52] text-[#131313] hover:bg-[#c7f248]
                               transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {bmiSaving ? 'Saving…' : 'Calculate & Save'}
                  </button>
                </div>

                {/* BMI Result */}
                {bmiResult && (() => {
                  const s = getCategoryStyle(bmiResult.category);
                  return (
                    <div
                      className="rounded-xl p-4 mb-4 border transition-all duration-300"
                      style={{ background: s.bg, borderColor: s.border }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: s.color }}>
                          {bmiResult.category}
                        </span>
                        <span className="text-[24px] font-black" style={{ color: s.color }}>
                          {bmiResult.bmi}
                        </span>
                      </div>
                      <BmiGaugeBar bmi={bmiResult.bmi} />
                    </div>
                  );
                })()}

                {/* BMI Reference Table */}
                <div className="mb-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#444] mb-2">Reference</p>
                  <div className="flex flex-col gap-1.5">
                    {BMI_CATEGORIES.map(cat => (
                      <div
                        key={cat.label}
                        className="flex items-center justify-between rounded-lg px-3 py-2 border"
                        style={{ background: cat.bg, borderColor: cat.border }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-[12px] font-semibold" style={{ color: cat.color }}>{cat.label}</span>
                        </div>
                        <span className="text-[11px] text-[#666]">{cat.range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* ── BMI History ── */}
              <Card>
                <SectionHeader icon="history" title="BMI History" count={bmiTotal} />
                {bmiRecords.length === 0 ? (
                  <EmptyState message="No BMI records yet" />
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      {bmiRecords.map((row, i) => {
                        const s = getCategoryStyle(row.bmi_category);
                        return (
                          <div
                            key={row.id ?? i}
                            className="flex items-center justify-between rounded-xl px-3.5 py-3 border"
                            style={{ background: s.bg, borderColor: s.border }}
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[13px] font-black" style={{ color: s.color }}>{row.bmi}</span>
                                <span
                                  className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border"
                                  style={{ color: s.color, borderColor: s.border, background: 'transparent' }}
                                >
                                  {row.bmi_category}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#555]">
                                {row.weight_kg} kg · {row.height_cm} cm
                              </p>
                            </div>
                            <span className="text-[10px] text-[#555] text-right whitespace-nowrap">
                              {row.recorded_at}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {bmiRecords.length < bmiTotal && (
                      <ShowMoreBtn onClick={handleShowMoreBmi} loading={bmiLoading} />
                    )}
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>

      <div className="md:hidden"><MobileNav /></div>
    </div>
  );
};

export default Records;