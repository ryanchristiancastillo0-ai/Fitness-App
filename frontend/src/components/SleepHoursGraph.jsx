import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/port';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['D', 'W', 'M'];

const DATA_SOURCES = [
  {
    key:     'sleep',
    label:   'Sleep',
    icon:    'bedtime',
    color:   '#c7f248',
    metrics: [
      { key: 'duration', label: 'Duration',  unit: 'h',  max: 12,  yTicks: [12, 6, 0]   },
      { key: 'quality',  label: 'Quality',   unit: '',   max: 10,  yTicks: [10, 5, 0]   },
      { key: 'recovery', label: 'Recovery',  unit: '',   max: 100, yTicks: [100, 50, 0] },
    ],
  },
  {
    key:     'analysis',
    label:   'Sleep Analysis',
    icon:    'insights',
    color:   '#a78bfa',
    metrics: [
      { key: 'sleep_hours',    label: 'Total Hours', unit: 'h',  max: 12,  yTicks: [12, 6, 0]   },
      { key: 'recovery_score', label: 'Recovery',    unit: '%',  max: 100, yTicks: [100, 50, 0] },
      { key: 'efficiency',     label: 'Efficiency',  unit: '%',  max: 100, yTicks: [100, 50, 0] },
    ],
  },
];

// ─── Status helper ────────────────────────────────────────────────────────────

const getStatus = (sourceKey, metricKey, avg) => {
  if (metricKey === 'duration' || metricKey === 'sleep_hours') {
    if (avg >= 7) return { label: 'Well Rested', color: '#c7f248' };
    if (avg >= 5) return { label: 'Light Sleep', color: '#f2c448' };
    return               { label: 'Rest Needed', color: '#f26048' };
  }
  if (avg >= 80) return { label: 'Excellent',  color: '#c7f248' };
  if (avg >= 60) return { label: 'Moderate',   color: '#f2c448' };
  return               { label: 'Needs Work',  color: '#f26048' };
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = ({ color }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none select-none">
    <span
      className="material-symbols-outlined text-[32px] opacity-20"
      style={{ color, fontVariationSettings: "'FILL' 1" }}
    >
      bedtime
    </span>
    <p className="text-[11px] font-bold text-[#444] tracking-wider uppercase">No data for this range</p>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const SleepHoursGraph = ({ userId = null }) => {
  const [activeTab,    setActiveTab]    = useState('D');
  const [activeSource, setActiveSource] = useState('sleep');
  const [activeMetric, setActiveMetric] = useState('duration');
  const [graphData,    setGraphData]    = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [animating,    setAnimating]    = useState(false);

  const sourceDef = DATA_SOURCES.find(s => s.key === activeSource);
  const metaObj   = sourceDef.metrics.find(m => m.key === activeMetric) ?? sourceDef.metrics[0];
  const accentColor = sourceDef.color;
  const gradId      = `grad_${activeSource}`;

  // ── Source switch with brief animation ──────────────────────────────────
  const handleSourceSwitch = (key) => {
    if (key === activeSource) return;
    setAnimating(true);
    setTimeout(() => {
      setActiveSource(key);
      setActiveMetric(DATA_SOURCES.find(s => s.key === key).metrics[0].key);
      setAnimating(false);
    }, 180);
  };

  // ── Unified fetch ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!userId) {
      setGraphData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint =
        activeSource === 'analysis'
          ? `${API_BASE_URL}/api/sleep/${userId}/analysis?range=${activeTab}&metric=${activeMetric}`
          : `${API_BASE_URL}/api/sleep/${userId}?range=${activeTab}&metric=${activeMetric}`;

      const res = await fetch(endpoint);

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const json = await res.json();
      setGraphData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('[SleepHoursGraph] Fetch error:', err.message);
      setError(err.message);
      setGraphData([]);
    } finally {
      setLoading(false);
    }
  }, [userId, activeSource, activeTab, activeMetric]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Chart math ────────────────────────────────────────────────────────────
  const points = graphData;

  const getPath = () => {
    if (points.length === 0) return '';
    const W = 1000, H = 200;
    const step = points.length > 1 ? W / (points.length - 1) : W / 2;
    return points.reduce((path, pt, i) => {
      const x = points.length === 1 ? W / 2 : i * step;
      const y = H - (Math.min(Number(pt.value), metaObj.max) / metaObj.max) * H;
      return path + `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
    }, '');
  };

  const pathData = getPath();

  const avg = points.length
    ? points.reduce((s, p) => s + Number(p.value), 0) / points.length
    : 0;

  const avgDisplay = metaObj.unit === 'h'
    ? avg.toFixed(1)
    : Math.round(avg).toLocaleString();

  const status     = getStatus(activeSource, activeMetric, avg);
  const rangeLabel = activeTab === 'D' ? '24 Hours' : activeTab === 'W' ? '7 Days' : '30 Days';

  const xLabelIndices = (() => {
    if (points.length === 0) return [];
    if (points.length <= 5)  return points.map((_, i) => i);
    return [
      0,
      Math.round(points.length * 0.25),
      Math.round(points.length * 0.5),
      Math.round(points.length * 0.75),
      points.length - 1,
    ];
  })();

  return (
    <div className="bg-[#1a1a18] border min-h-[410px] border-white/[0.06] rounded-[16px] p-6 pb-4 transition-all duration-300">

      {/* ── Header ── */}
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-[Manrope] text-[15px] font-extrabold text-[#e5e2e1] tracking-tight">
              {sourceDef.label}
            </h4>
            {!loading && !error && points.length > 0 && (
              <span
                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest"
                style={{ color: accentColor }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-ping inline-block"
                  style={{ background: accentColor }}
                />
                Live
              </span>
            )}
            {loading && (
              <span className="text-[9px] font-black text-[#555] uppercase tracking-widest">
                Loading…
              </span>
            )}
            {error && !loading && (
              <span className="text-[9px] font-black text-[#f26048] uppercase tracking-widest">
                Error
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#555]">
            {metaObj.label}{metaObj.unit ? ` (${metaObj.unit})` : ''} · Last {rangeLabel}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Source switcher */}
          <div className="flex bg-[#111110] border border-white/[0.07] rounded-xl p-1 gap-1">
            {DATA_SOURCES.map(src => {
              const active = src.key === activeSource;
              return (
                <button
                  key={src.key}
                  onClick={() => handleSourceSwitch(src.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer border-none ${
                    active ? 'text-black shadow-md' : 'bg-transparent text-[#555] hover:text-[#999]'
                  }`}
                  style={active ? { background: src.color, boxShadow: `0 2px 12px ${src.color}40` } : {}}
                >
                  <span
                    className="material-symbols-outlined text-[14px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {src.icon}
                  </span>
                  <span className="hidden sm:inline">{src.label}</span>
                </button>
              );
            })}
          </div>

          {/* Status badge — only when data present */}
          {points.length > 0 && (
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
              style={{ color: status.color, background: `${status.color}18` }}
            >
              {status.label}
            </span>
          )}

          {/* Range tabs */}
          <div className="flex bg-[#0e0e0e] border border-white/[0.05] rounded-lg p-0.5">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md border-none cursor-pointer transition-all ${
                  activeTab === t
                    ? 'text-black shadow-lg'
                    : 'bg-transparent text-[#666] hover:text-[#999]'
                }`}
                style={
                  activeTab === t
                    ? { background: accentColor, boxShadow: `0 2px 8px ${accentColor}30` }
                    : {}
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Metric pills + avg ── */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {sourceDef.metrics.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all cursor-pointer ${
              activeMetric === m.key
                ? 'text-black border-transparent'
                : 'border-white/10 text-[#555] bg-transparent hover:text-[#888]'
            }`}
            style={
              activeMetric === m.key
                ? { background: accentColor, borderColor: accentColor, boxShadow: `0 2px 10px ${accentColor}40` }
                : {}
            }
          >
            {m.label}
          </button>
        ))}

        {points.length > 0 && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <span className="text-[9px] uppercase tracking-widest text-[#444] font-bold">Avg</span>
            <span className="text-[11px] font-extrabold" style={{ color: accentColor }}>
              {avgDisplay}{metaObj.unit}
            </span>
          </div>
        )}
      </div>

      {/* ── Chart ── */}
      <div
        className={`relative h-36 transition-all duration-300 ${
          loading || animating ? 'opacity-30 scale-[0.99]' : 'opacity-100 scale-100'
        }`}
      >
        {points.length === 0 && !loading ? (
          <EmptyState color={accentColor} />
        ) : (
          <>
            <svg width="100%" height="100%" viewBox="0 0 1000 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor={accentColor} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`${pathData} V200 H0 Z`}
                fill={`url(#${gradId})`}
                className="transition-all duration-700"
              />
              <path
                d={pathData}
                fill="none"
                stroke={accentColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-700"
              />
              {points.length <= 10 &&
                points.map((pt, i) => {
                  const step = points.length > 1 ? 1000 / (points.length - 1) : 500;
                  return (
                    <circle
                      key={i}
                      cx={i * step}
                      cy={200 - (Math.min(Number(pt.value), metaObj.max) / metaObj.max) * 200}
                      r="5"
                      fill={accentColor}
                      fillOpacity="0.9"
                      stroke="#1a1a18"
                      strokeWidth="2"
                    />
                  );
                })}
            </svg>

            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2].map(i => <div key={i} className="border-t border-white/[0.04]" />)}
            </div>

            {/* Y-axis labels */}
            <div className="absolute right-0 inset-y-0 flex flex-col justify-between pointer-events-none pr-1">
              {metaObj.yTicks.map(v => (
                <span key={v} className="text-[8px] font-bold text-[#333]">
                  {v.toLocaleString()}{metaObj.unit}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── X-axis labels ── */}
      {points.length > 0 && (
        <div className="flex justify-between mt-2">
          {xLabelIndices.map(i => (
            <span key={i} className="text-[9px] font-bold text-[#3a3a3a] uppercase tracking-[0.15em]">
              {points[i]?.label || '--'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SleepHoursGraph;