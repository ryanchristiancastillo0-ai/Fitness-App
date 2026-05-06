import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Topbar, MobileNav } from '../../../components';
import SidebarAnalytics from '../../../components/sidebarAnalytics';
import { useAuth } from '../../../hooks/useAuth';
import 'leaflet/dist/leaflet.css';
import { useAICoach } from '../../CameraWorkout/hooks/useAiCoach';
import { API_BASE_URL } from '../../../config/port';
import { RecenterMap,FitRoute,GpsBadge,HistoryTab,RouteReplay,RunAnalsisOverlay,
  RunControls,RunSummaryOverlay,StatsPanel,StatsTab,Toast
 } from '../components';

// ─── Constants ────────────────────────────────────────────────────────────────
const FALLBACK_COORDS = [14.6760, 121.0437];

// ─── Icons ────────────────────────────────────────────────────────────────────
const createUserIcon = () =>
  L.divIcon({
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `
      <div style="width:20px;height:20px;border-radius:50%;background:#D1FD52;border:3px solid #fff;box-shadow:0 0 0 4px rgba(209,253,82,0.3);position:relative;">
        <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(209,253,82,0.15);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      </div>
      <style>@keyframes ping{0%{transform:scale(1);opacity:1}75%{transform:scale(2);opacity:0}100%{transform:scale(2.5);opacity:0}}</style>
    `,
  });

const createStartIcon = () =>
  L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:50%;background:#22c55e;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;box-shadow:0 2px 12px rgba(34,197,94,0.5);">S</div>`,
  });

const createFinishIcon = () =>
  L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:50%;background:#ef4444;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;box-shadow:0 2px 12px rgba(239,68,68,0.5);">F</div>`,
  });





// ─── AI Run Analysis Overlay ──────────────────────────────────────────────────


// ─── Toast ────────────────────────────────────────────────────────────────────


// ─── Animated route replay ────────────────────────────────────────────────────


// ─── Post-run summary overlay ─────────────────────────────────────────────────


// ─── Live stats bottom sheet (mobile) / side panel (desktop) ─────────────────

// ─── Run control buttons ──────────────────────────────────────────────────────

// ─── GPS Badge ────────────────────────────────────────────────────────────────


// ─── History Tab ──────────────────────────────────────────────────────────────

// ─── Stats Tab ────────────────────────────────────────────────────────────────

// ─── Main Component ───────────────────────────────────────────────────────────
const ActivityMap = () => {
  const { user } = useAuth();
  const USER_ID = user?.id || null;

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isLargeScreen = windowWidth >= 1024;

  // Geolocation
  const [userLocation, setUserLocation]     = useState(null);
  const [startCoords, setStartCoords]       = useState(FALLBACK_COORDS);
  const [locationStatus, setLocationStatus] = useState('pending');
  const [mapCenter, setMapCenter]           = useState(FALLBACK_COORDS);

  // AI ari
    const [runAnalysis, setRunAnalysis] = useState(null);
   

  // UI
  const [activeTab, setActiveTab] = useState('run');
  const [toast, setToast]         = useState({ visible: false, message: '', type: 'ok' });
  const [isSaving, setIsSaving]   = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false); // ← ADD THIS

  // Run state
  const [isRecording, setIsRecording] = useState(false);
  const [hasPaused, setHasPaused]     = useState(false);
  const [runFinished, setRunFinished] = useState(false);
  const [metrics, setMetrics]         = useState({ time: 0, distance: 0, pace: "0'00\"", calories: 0 });
  const [path, setPath]               = useState([FALLBACK_COORDS]);
  const [splits, setSplits]           = useState([]);

  const timerRef           = useRef(null);
  const splitsRef          = useRef([]);
  const lastSplitRef       = useRef(0);
  const watchIdRef         = useRef(null);
  const finishedPathRef    = useRef([]);
  const finishedMetricsRef = useRef({});
  const finishedSplitsRef  = useRef([]);

  // History & stats
  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError]     = useState(null);
  const [stats, setStats]                   = useState(null);
  const [statsLoading, setStatsLoading]     = useState(false);
  const [statsError, setStatsError]         = useState(null);

  // ─── Geolocation on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setLocationStatus('denied'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(c); setStartCoords(c); setMapCenter(c); setPath([c]);
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // ─── GPS watch while recording ───────────────────────────────────────────
  useEffect(() => {
    if (isRecording && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const c = [pos.coords.latitude, pos.coords.longitude];
          setPath(prev => [...prev, c]);
          setUserLocation(c);
        },
        null,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [isRecording]);

  // ─── Toast helper ────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'ok') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2800);
  }, []);

  const formatTime = (seconds) => {
    const s = parseInt(seconds) || 0;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${sc.toString().padStart(2, '0')}`;
  };

  // ─── Timer + mock movement ───────────────────────────────────────────────
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setMetrics(prev => {
          const t  = prev.time + 1;
          const d  = prev.distance + 0.002;
          const ps = d > 0 ? t / d : 0;
          const pm = Math.floor(ps / 60);
          const pc = Math.floor(ps % 60);
          const pace = `${pm}'${pc.toString().padStart(2, '0')}"`;
          const cal  = Math.floor(d * 60);
          const km   = Math.floor(d);
          if (km > lastSplitRef.current) {
            lastSplitRef.current = km;
            const ns = { km: splitsRef.current.length + 1, pace };
            splitsRef.current = [...splitsRef.current, ns];
            setSplits([...splitsRef.current]);
          }
          return { time: t, distance: d, pace, calories: cal };
        });
        if (locationStatus !== 'granted') {
          setPath(prev => {
            const last = prev[prev.length - 1];
            return [...prev, [last[0] + (Math.random() - 0.48) * 0.0003, last[1] + 0.00018]];
          });
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording, locationStatus]);

  // ─── Run controls ────────────────────────────────────────────────────────
  const handleStartRun = () => {
    const origin = userLocation || startCoords;
    setMetrics({ time: 0, distance: 0, pace: "0'00\"", calories: 0 });
    setPath([origin]); setSplits([]);
    splitsRef.current = []; lastSplitRef.current = 0;
    setHasPaused(false); setRunFinished(false);
    setIsRecording(true);
  };

  const handlePauseResume = () => { setIsRecording(p => !p); setHasPaused(true); };

  const handleFinish = () => {
    setIsRecording(false);
    clearInterval(timerRef.current);
    finishedPathRef.current    = [...path];
    finishedMetricsRef.current = { ...metrics };
    finishedSplitsRef.current  = [...splits];
    setRunFinished(true);
  };

  const handleDiscard = () => {
    setRunFinished(false);
    setMetrics({ time: 0, distance: 0, pace: "0'00\"", calories: 0 });
    setPath([userLocation || startCoords]); setSplits([]);
    splitsRef.current = []; lastSplitRef.current = 0;
    setHasPaused(false);
  };

  // ─── API calls ───────────────────────────────────────────────────────────
const handleSaveActivity = async () => {
  if (!USER_ID) { showToast('⚠ Not logged in', 'error'); return; }
  setIsSaving(true);
  try {
    const m = finishedMetricsRef.current;
    const res = await fetch(`${API_BASE_URL}/api/activity/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        userId: USER_ID, duration: m.time,
        distance: parseFloat((m.distance || 0).toFixed(2)),
        pace: m.pace, calories: m.calories, route: finishedPathRef.current,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);

    // ✅ Trigger AI run analysis after save
    const aiRes = await fetch(`${API_BASE_URL}/api/ai/run-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        userId: USER_ID,
        run: {
          distance: parseFloat((m.distance || 0).toFixed(2)),
          duration: formatTime(m.time),
          pace:     m.pace,
          calories: m.calories,
          splits:   finishedSplitsRef.current,
        },
      }),
    });
    const aiData = await aiRes.json();
    if (aiData && !aiData.error) {
      setRunAnalysis(aiData); // ← show the overlay
    }

    showToast('✓ Run saved!');
    fetchHistory(true);
    fetchStats(true);
  } catch (err) {
    showToast(`⚠ Save failed — ${err.message}`, 'error');
  } finally {
    setIsSaving(false);
  }
};

  const fetchHistory = useCallback(async (silent = false) => {
    if (!USER_ID) return;
    if (!silent) setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/activity/${USER_ID}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setHistory(await res.json().then(d => Array.isArray(d) ? d : []));
    } catch (err) { setHistoryError(err.message); }
    finally { if (!silent) setHistoryLoading(false); }
  }, [USER_ID]);

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/activity/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      showToast('Activity deleted'); fetchHistory(); fetchStats(true);
    } catch (err) { showToast(`⚠ Delete failed — ${err.message}`, 'error'); }
  };

  const fetchStats = useCallback(async (silent = false) => {
    if (!USER_ID) return;
    if (!silent) setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/activity/stats/${USER_ID}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStats(await res.json());
    } catch (err) { setStatsError(err.message); }
    finally { if (!silent) setStatsLoading(false); }
  }, [USER_ID]);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
    if (activeTab === 'stats')   fetchStats();
  }, [activeTab, fetchHistory, fetchStats]);

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    // ↓ Outer wrapper: full screen flex ROW — sidebar + content side by side
    <div
      className="flex flex-row min-h-screen bg-[#131313] text-[#e5e2e1] overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Sidebar: sits in the flex row, pushes content naturally ── */}
     <SidebarAnalytics onExpandChange={setSidebarExpanded} />

      {/* ── Everything to the right of sidebar ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Topbar */}
              <Topbar sidebarExpanded={sidebarExpanded} userId={USER_ID} />

        {/* Tab bar — hidden during replay */}
        {!runFinished && (
          <div className="flex mt-17 border-b border-white/5 bg-[#0e0e0e] z-50">
            {['run', 'history', 'stats'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 sm:py-3 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] border-b-2 transition-all
                  ${activeTab === tab
                    ? 'text-[#D1FD52] border-[#D1FD52]'
                    : 'text-white/30 border-transparent hover:text-white/50'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* ── Main content area ── */}
        <main className="flex-1 overflow-hidden relative">

          {/* ══ REPLAY MODE ══ */}
          {runFinished && (
            <div className="relative h-full w-full">
              <MapContainer
                center={finishedPathRef.current[0] || FALLBACK_COORDS}
                zoom={15}
                zoomControl={false}
                className="h-full w-full z-0"
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                <FitRoute path={finishedPathRef.current} />
                <RouteReplay fullPath={finishedPathRef.current} />
              </MapContainer>
              <RunSummaryOverlay
                metrics={finishedMetricsRef.current}
                splits={finishedSplitsRef.current}
                formatTime={formatTime}
                onSave={handleSaveActivity}
                onDiscard={handleDiscard}
                isSaving={isSaving}
              />
            </div>
          )}

          {/* ══ RUN TAB ══ */}
          {!runFinished && activeTab === 'run' && (
            <div className="flex h-full">

              {/* MAP area */}
              <div className="flex-1 relative bg-[#1a1a1a] min-w-0 overflow-hidden">
                <MapContainer
                  center={mapCenter}
                  zoom={16}
                  zoomControl={false}
                  className="absolute inset-0 z-0"
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  />
                  {path.length > 1 && (
                    <Polyline positions={path} pathOptions={{ color: '#D1FD52', weight: 5, opacity: 0.85 }} />
                  )}
                  {userLocation && <Marker position={userLocation} icon={createUserIcon()} />}
                  <RecenterMap coords={path} isRecording={isRecording} userLocation={userLocation} />
                </MapContainer>

                {/* GPS badge */}
                <GpsBadge locationStatus={locationStatus} />

                {/* GPS denied hint */}
                {locationStatus === 'denied' && (
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-[1000] bg-black/70 backdrop-blur-md px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-red-500/20 max-w-[160px] sm:max-w-[180px]">
                    <p className="text-[8px] text-red-400 font-semibold leading-relaxed">
                      Location denied. Enable in browser settings for real GPS.
                    </p>
                  </div>
                )}

                {/* Run controls */}
                <RunControls
                  isRecording={isRecording}
                  hasPaused={hasPaused}
                  metricsTime={metrics.time}
                  onStart={handleStartRun}
                  onPauseResume={handlePauseResume}
                  onFinish={handleFinish}
                />

                {/* Mobile stats sheet */}
                {!isLargeScreen && (
                  <StatsPanel
                    metrics={metrics}
                    splits={splits}
                    formatTime={formatTime}
                    isDesktop={false}
                  />
                )}
              </div>

              {/* Desktop side panel */}
              {isLargeScreen && (
                <StatsPanel
                  metrics={metrics}
                  splits={splits}
                  formatTime={formatTime}
                  isDesktop={true}
                />
              )}
            </div>
          )}

          {/* ══ HISTORY TAB ══ */}
          {!runFinished && activeTab === 'history' && (
            <HistoryTab
              history={history}
              historyLoading={historyLoading}
              historyError={historyError}
              formatTime={formatTime}
              onRefresh={() => fetchHistory()}
              onDelete={handleDelete}
            />
          )}

          {/* ══ STATS TAB ══ */}
          {!runFinished && activeTab === 'stats' && (
            <StatsTab
              stats={stats}
              statsLoading={statsLoading}
              statsError={statsError}
              formatTime={formatTime}
            />
          )}
        </main>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden">
        <MobileNav />
      </div>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      <RunAnalysisOverlay analysis={runAnalysis} onClose={() => setRunAnalysis(null)} />
    </div>
  );
};

export default ActivityMap;