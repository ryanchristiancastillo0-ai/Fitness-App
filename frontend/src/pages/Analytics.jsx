import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import SidebarAnalytics from '../components/sidebarAnalytics';
import { API_BASE_URL } from '../config/port';
import { navList } from '../constant/nav';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const getUserId = () => {
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      return parsed.id;
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
    }
  }
  return 1;
};

const USER_ID = getUserId();

const calculateSleepScore = (hours, quality) => {
  const durationScore =
    hours >= 7 && hours <= 9 ? 100 : hours > 9 ? 80 : (hours / 7) * 100;
  const qualityScore = quality * 10;
  return Math.round(durationScore * 0.6 + qualityScore * 0.4);
};

const getSleepStatus = (hours, quality) => {
  const score = calculateSleepScore(hours, quality);
  if (score >= 85)
    return {
      label: 'Ready to train 💪',
      color: 'text-[#D1FD52]',
      border: 'border-[#D1FD52]/40',
      bg: 'bg-[#D1FD52]/10',
      level: 'Optimal',
      score,
    };
  if (score >= 60)
    return {
      label: 'Light workout 😐',
      color: 'text-orange-400',
      border: 'border-orange-400/40',
      bg: 'bg-orange-400/10',
      level: 'Fair',
      score,
    };
  if (hours > 10)
    return {
      label: 'Oversleep recovery 😪',
      color: 'text-blue-400',
      border: 'border-blue-400/40',
      bg: 'bg-blue-400/10',
      level: 'High',
      score,
    };
  return {
    label: 'Rest recommended 😴',
    color: 'text-red-400',
    border: 'border-red-400/40',
    bg: 'bg-red-400/10',
    level: 'Low',
    score,
  };
};

const getPointColor = (hours, quality) => {
  const score = calculateSleepScore(hours, quality);
  if (score >= 85) return '#D1FD52';
  if (score >= 60) return '#fb923c';
  return '#f87171';
};

const ZONE_CONFIG = {
  5: { color: 'bg-red-500',    bar: '#ef4444', label: 'Zone 5 (Anaerobic)'    },
  4: { color: 'bg-orange-400', bar: '#fb923c', label: 'Zone 4 (Threshold)'    },
  3: { color: 'bg-yellow-400', bar: '#facc15', label: 'Zone 3 (Tempo)'        },
  2: { color: 'bg-[#D1FD52]',  bar: '#D1FD52', label: 'Zone 2 (Aerobic Base)' },
  1: { color: 'bg-blue-400',   bar: '#60a5fa', label: 'Zone 1 (Recovery)'     },
};

const DEFAULT_ZONES = [
  { zone: 5, label: 'Zone 5 (Anaerobic)',    value: '0%', color: 'bg-red-500'    },
  { zone: 4, label: 'Zone 4 (Threshold)',    value: '0%', color: 'bg-orange-400' },
  { zone: 2, label: 'Zone 2 (Aerobic Base)', value: '0%', color: 'bg-[#D1FD52]' },
];

// ─────────────────────────────────────────────
// BACKEND / API FUNCTIONS
// ─────────────────────────────────────────────

async function fetchZonesFromAPI(userId, timeframe) {
  const res = await fetch(
    `${API_BASE_URL}/api/analytics/zones/${userId}?timeframe=${timeframe.toLowerCase()}`
  );
  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) return DEFAULT_ZONES;

  const total = data.reduce((sum, z) => sum + (z.minutes || 0), 0);

  return data.map((z) => {
    const cfg = ZONE_CONFIG[z.zone] ?? {};
    const pct = total > 0 ? Math.round((z.minutes / total) * 100) : 0;
    return {
      zone:    z.zone,
      label:   cfg.label ?? z.label ?? `Zone ${z.zone}`,
      value:   `${pct}%`,
      color:   cfg.color ?? 'bg-neutral-500',
      minutes: z.minutes,
    };
  });
}

async function fetchScatterData(userId, timeframe) {
  const res = await fetch(
    `${API_BASE_URL}/api/sleep/${userId}/scatter?timeframe=${timeframe.toLowerCase()}`
  );
  return res.json();
}

async function fetchTodaySleep(userId) {
  const res = await fetch(`${API_BASE_URL}/api/sleep/${userId}/today`);
  return res.json();
}

async function saveSleepData(userId, payload) {
  const res = await fetch(`${API_BASE_URL}/api/sleep/${userId}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Save failed');
  return res.json();
}

// ─────────────────────────────────────────────
// SMALL UI COMPONENTS
// ─────────────────────────────────────────────

function Icon({ name, className = '', fill = 0 }) {
  return (
    <span
      className={`material-symbols-outlined leading-none select-none ${className}`}
      style={{ fontVariationSettings: `'FILL' ${fill}, 'wght' 300, 'GRAD' 0, 'opsz' 24` }}
    >
      {name}
    </span>
  );
}

function TimeframeToggle({ timeframe, setTimeframe }) {
  return (
    <div className="flex bg-[#141414] p-1 rounded-xl border border-white/[0.04] overflow-x-auto no-scrollbar shadow-xl self-start sm:self-auto flex-shrink-0">
      {['Weekly', 'Monthly', 'Quarterly'].map((t) => (
        <button
          key={t}
          onClick={() => setTimeframe(t)}
          className={`px-3 sm:px-5 md:px-6 py-2 md:py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.12em] sm:tracking-[0.15em] rounded-lg transition-all whitespace-nowrap touch-manipulation ${
            timeframe === t
              ? 'bg-[#c7f248] text-[#161f00] shadow-lg'
              : 'text-neutral-500 hover:text-white'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function UserAvatar({ userId }) {
  return (
    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#1c1b1b] border border-white/10 overflow-hidden">
      <img
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
        alt="User"
        className="opacity-90 w-full h-full object-cover"
      />
    </div>
  );
}

function SearchBar() {
  return (
    <div className="hidden sm:flex items-center bg-white/[0.03] px-3 md:px-4 py-2 rounded-full border border-white/[0.05] group focus-within:border-[#D1FD52]/50 transition-all min-w-0">
      <Icon name="search" className="text-sm text-neutral-500 mr-2 group-focus-within:text-[#D1FD52] flex-shrink-0" />
      <input
        className="bg-transparent border-none focus:ring-0 text-[11px] w-20 lg:w-32 placeholder:text-neutral-600 font-bold uppercase tracking-widest min-w-0"
        placeholder="Search..."
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE-SECTION COMPONENTS
// ─────────────────────────────────────────────

function PageHeader({ timeframe, setTimeframe }) {
  return (
    <section className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 md:mb-10 lg:mb-12 gap-4 sm:gap-6">
      <div className="space-y-1 min-w-0">
        <p className="text-[#D1FD52] font-bold tracking-[0.25em] text-[10px] uppercase">
          Endurance Tracking
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter font-['Manrope'] text-white leading-none">
          Aerobic Engine
        </h2>
      </div>
      <TimeframeToggle timeframe={timeframe} setTimeframe={setTimeframe} />
    </section>
  );
}

function TopNav({ userId }) {
  return (
    <header className="sticky top-0 w-full z-50 bg-[#0e0e0e]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 h-14 md:h-16 border-b border-white/[0.06] gap-3">
      <h1 className="text-xs sm:text-sm md:text-lg font-black tracking-tighter font-['Manrope'] uppercase text-white/90 truncate flex-1 min-w-0">
        Performance Analytics
      </h1>
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-shrink-0">
        <SearchBar />
        <UserAvatar userId={userId} />
      </div>
    </header>
  );
}

function MobileBottomNav({ navigate }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-[#09090b]/95 backdrop-blur-xl border-t border-white/5 z-[100] flex justify-around items-center py-2 pb-[env(safe-area-inset-bottom,8px)]">
      {navList.map((list, i) => (
        <button
          onClick={() => navigate(list.path)}
          key={i}
          className={`flex flex-col items-center justify-center p-2 min-w-[44px] min-h-[44px] rounded-xl transition-colors touch-manipulation ${
            i === 1 ? 'text-[#D1FD52]' : 'text-neutral-500 active:text-neutral-300'
          }`}
        >
          <Icon name={list.icon} fill={i === 1 ? 1 : 0} className="text-[22px]" />
        </button>
      ))}
    </nav>
  );
}

function ScatterLegend() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-x-4 gap-y-2 text-[9px] font-black uppercase tracking-widest flex-shrink-0">
      {[
        { dot: 'bg-[#D1FD52]',                         label: 'Optimal' },
        { dot: 'bg-orange-400',                         label: 'Fair'    },
        { dot: 'bg-red-400',                            label: 'Low'     },
        { dot: 'border-2 border-[#D1FD52] bg-white',   label: 'Current' },
      ].map(({ dot, label }) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
          <span className="text-white/40">{label}</span>
        </span>
      ))}
    </div>
  );
}

function SleepScatterChart({ scatterData, sleepHours, sleepQuality }) {
  const chartDataset = {
    datasets: [
      {
        label: 'Sleep Sessions',
        data: scatterData.map((d) => ({
          x: parseFloat(d.sleep_duration),
          y: parseInt(d.sleep_quality),
        })),
        backgroundColor: scatterData.map((d) =>
          getPointColor(parseFloat(d.sleep_duration), parseInt(d.sleep_quality))
        ),
        pointRadius:      6,
        pointHoverRadius: 8,
      },
      {
        label: 'Current',
        data: [{ x: sleepHours, y: sleepQuality }],
        backgroundColor: '#ffffff',
        pointRadius:      7,
        pointHoverRadius: 9,
        borderColor:      '#D1FD52',
        borderWidth:      2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${ctx.parsed.x}h · Quality ${ctx.parsed.y}/10`,
        },
        backgroundColor: '#1a1a1a',
        titleColor:  '#D1FD52',
        bodyColor:   '#e5e2e1',
        borderColor: '#333',
        borderWidth: 1,
        padding: 10,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text:    'Sleep Duration (hours)',
          color:   '#555',
          font:    { size: 10, weight: 'bold', family: 'Inter' },
        },
        min: 0, max: 13,
        ticks: { color: '#555', stepSize: 2, callback: (v) => `${v}h`, font: { size: 9 } },
        grid:  { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        title: {
          display: true,
          text:    'Quality (1–10)',
          color:   '#555',
          font:    { size: 10, weight: 'bold', family: 'Inter' },
        },
        min: 0, max: 11,
        ticks: { color: '#555', stepSize: 2, font: { size: 9 } },
        grid:  { color: 'rgba(255,255,255,0.04)' },
      },
    },
  };

  return (
    <div className="col-span-1 lg:col-span-8 bg-[#141414] rounded-2xl p-4 sm:p-6 md:p-8 border border-white/[0.04] shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 sm:mb-6">
        <div className="min-w-0 flex-1">
          <h3 className="text-neutral-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1 sm:mb-2">
            Sleep Duration vs Quality
          </h3>
          <p className="text-2xl sm:text-3xl md:text-4xl font-black font-['Manrope'] text-white leading-none">
            {sleepHours}h{' '}
            <span className="text-[#D1FD52] text-xs sm:text-sm font-bold ml-1 sm:ml-2">
              Q{sleepQuality}/10
            </span>
          </p>
        </div>
        <ScatterLegend />
      </div>
      {/* Chart height scales across breakpoints */}
      <div className="h-[190px] xs:h-[220px] sm:h-[250px] md:h-[280px] lg:h-[300px]">
        <Scatter data={chartDataset} options={chartOptions} />
      </div>
    </div>
  );
}

function SleepSlider({ label, valueLabel, labelColor, min, max, step, value, onChange, accent }) {
  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex justify-between text-[9px] text-white/20 font-black uppercase tracking-widest">
        <span>{label}</span>
        <span className={labelColor}>{valueLabel}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={onChange}
        // touch-action: pan-y lets the page scroll vertically while still
        // allowing horizontal drag on the range input on mobile
        style={{ touchAction: 'pan-y' }}
        className={`w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer ${accent}`}
      />
    </div>
  );
}

function SleepSyncCard({
  sleepHours,
  setSleepHours,
  sleepQuality,
  setSleepQuality,
  waterIntake,
  setWaterIntake,
  sleepStatus,
  saveStatus,
  onSave,
}) {
  const saveBadge = {
    saving: { text: 'Saving…', cls: 'text-neutral-400' },
    saved:  { text: '✓ Saved', cls: 'text-[#D1FD52]'   },
    error:  { text: '✕ Error', cls: 'text-red-400'      },
  };

  return (
    <div className="col-span-1 lg:col-span-4">
      <div className="bg-[#141414] rounded-2xl p-4 sm:p-6 md:p-8 border border-white/[0.04] shadow-sm h-full">
        {/* Status header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="p-2 sm:p-2.5 bg-white/[0.03] rounded-xl">
            <Icon name="bedtime" className="text-[#D1FD52] text-xl sm:text-2xl" fill={1} />
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 sm:px-3 py-1 rounded-md border ${sleepStatus.color} ${sleepStatus.border} ${sleepStatus.bg}`}
            >
              {sleepStatus.level}
            </span>
            <span className="text-[10px] font-bold text-white/40 uppercase">
              Score: {sleepStatus.score}%
            </span>
          </div>
        </div>

        <h4 className="text-lg sm:text-xl font-black font-['Manrope'] mb-1 text-white">
          Rest: <span className={sleepStatus.color}>{sleepHours}h</span>
        </h4>
        <p className="text-white/30 text-[11px] leading-relaxed mb-5 sm:mb-8 font-medium">
          {sleepStatus.label}
        </p>

        <div className="space-y-4 sm:space-y-6">
          <SleepSlider
            label="Duration"
            valueLabel={`${sleepHours} Hours`}
            labelColor="text-[#D1FD52]"
            min={0} max={12} step={0.5}
            value={sleepHours}
            onChange={(e) => setSleepHours(parseFloat(e.target.value))}
            accent="accent-[#D1FD52]"
          />
          <SleepSlider
            label="Quality"
            valueLabel={`${sleepQuality}/10`}
            labelColor="text-orange-400"
            min={1} max={10} step={1}
            value={sleepQuality}
            onChange={(e) => setSleepQuality(parseInt(e.target.value))}
            accent="accent-orange-400"
          />
          <SleepSlider
            label="Hydration"
            valueLabel={`${waterIntake} ml`}
            labelColor="text-blue-400"
            min={0} max={5000} step={250}
            value={waterIntake}
            onChange={(e) => setWaterIntake(parseInt(e.target.value))}
            accent="accent-blue-400"
          />

          <button
            onClick={onSave}
            disabled={saveStatus === 'saving'}
            className="w-full py-3 bg-[#D1FD52] hover:bg-[#c7f248] active:bg-[#b8e040] disabled:opacity-50 text-[#161f00] text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all shadow-[0_5px_15px_rgba(209,253,82,0.2)] touch-manipulation"
          >
            {saveStatus === 'saving' ? 'Syncing...' : 'Sync Sleep Data'}
          </button>

          {saveStatus !== 'idle' && saveStatus !== 'saving' && (
            <p className={`text-center text-[9px] font-black uppercase ${saveBadge[saveStatus].cls}`}>
              {saveBadge[saveStatus].text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ZoneBar({ zone }) {
  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-bold uppercase tracking-tighter gap-2">
        <span className="text-white/60 truncate">{zone.label}</span>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {zone.minutes !== undefined && (
            <span className="text-white/20 text-[9px] hidden sm:inline">{zone.minutes}min</span>
          )}
          <span className="text-white">{zone.value}</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full ${zone.color} transition-all duration-1000`}
          style={{ width: zone.value }}
        />
      </div>
    </div>
  );
}

function DistributionZones({ zones, zonesLoading }) {
  return (
    <div className="col-span-1 lg:col-span-12 bg-[#141414] rounded-2xl p-4 sm:p-6 md:p-8 border border-white/[0.04] shadow-sm">
      <div className="flex items-center justify-between mb-5 sm:mb-8">
        <h3 className="font-bold text-[10px] uppercase tracking-[0.25em] text-neutral-500">
          Distribution Zones
        </h3>
        {zonesLoading && (
          <span className="text-[9px] font-black uppercase tracking-widest text-neutral-600 animate-pulse">
            Loading…
          </span>
        )}
      </div>

      {zones.length === 0 ? (
        <p className="text-neutral-600 text-[11px] font-bold uppercase tracking-widest text-center py-6">
          No zone data for this period
        </p>
      ) : (
        // 1 col → 2 col → 3 col as viewport grows
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {zones.map((zone, i) => (
            <ZoneBar key={i} zone={zone} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

const Analytics = () => {
  const [timeframe, setTimeframe]       = useState('Weekly');
  const [sleepHours, setSleepHours]     = useState(7);
  const [sleepQuality, setSleepQuality] = useState(7);
  const [waterIntake, setWaterIntake]   = useState(0);
  const [scatterData, setScatterData]   = useState([]);
  const [zones, setZones]               = useState(DEFAULT_ZONES);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [saveStatus, setSaveStatus]     = useState('idle');
  const navigate  = useNavigate();
  const saveTimer = useRef(null);

  const loadZones = async () => {
    setZonesLoading(true);
    try {
      const data = await fetchZonesFromAPI(USER_ID, timeframe);
      setZones(data);
    } catch (err) {
      console.error('[Zones] Fetch error:', err);
      setZones(DEFAULT_ZONES);
    } finally {
      setZonesLoading(false);
    }
  };

  const loadSleepAndScatter = async () => {
    try {
      const [scatterRaw, todayData] = await Promise.all([
        fetchScatterData(USER_ID, timeframe),
        fetchTodaySleep(USER_ID),
      ]);
      setScatterData(scatterRaw);
      if (todayData?.sleep_duration) {
        setSleepHours(parseFloat(todayData.sleep_duration));
        if (todayData.sleep_quality)                setSleepQuality(todayData.sleep_quality);
        if (todayData.water_intake_ml !== undefined) setWaterIntake(todayData.water_intake_ml);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const handleSaveSleep = async () => {
    setSaveStatus('saving');
    try {
      await saveSleepData(USER_ID, {
        sleep_duration:  sleepHours,
        sleep_quality:   sleepQuality,
        recovery_score:  sleepStatus.score,
        water_intake_ml: waterIntake,
      });
      setSaveStatus('saved');
      loadSleepAndScatter();
      saveTimer.current = setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Sleep save error:', err);
      setSaveStatus('error');
      saveTimer.current = setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  useEffect(() => {
    loadSleepAndScatter();
    loadZones();
  }, [timeframe]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const sleepStatus = getSleepStatus(sleepHours, sleepQuality);

  return (
    // min-h-dvh uses dynamic viewport height — avoids the iOS toolbar problem
    <div className="flex flex-col md:flex-row min-h-screen min-h-dvh bg-[#0e0e0e] text-[#e5e2e1] font-['Inter'] selection:bg-[#c7f248] selection:text-[#161f00]">

      {/* Sidebar: hidden on mobile, shown on md+ */}
      <SidebarAnalytics />

      {/* Mobile bottom nav: shown below md */}
      <MobileBottomNav navigate={navigate} />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden
                      pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <TopNav userId={USER_ID} />

        <main className="p-3 xs:p-4 sm:p-6 md:p-8 lg:p-12 w-full max-w-[1400px] mx-auto">
          <PageHeader timeframe={timeframe} setTimeframe={setTimeframe} />

          {/*
            Grid:
              mobile  → single column stack (grid-cols-1)
              lg+     → 12-col grid: chart=8, sleep card=4, zones=12
          */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            <SleepScatterChart
              scatterData={scatterData}
              sleepHours={sleepHours}
              sleepQuality={sleepQuality}
            />

            <SleepSyncCard
              sleepHours={sleepHours}
              setSleepHours={setSleepHours}
              sleepQuality={sleepQuality}
              setSleepQuality={setSleepQuality}
              waterIntake={waterIntake}
              setWaterIntake={setWaterIntake}
              sleepStatus={sleepStatus}
              saveStatus={saveStatus}
              onSave={handleSaveSleep}
            />

            <DistributionZones zones={zones} zonesLoading={zonesLoading} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Analytics;