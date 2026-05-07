import React, { useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Topbar, AnalyticsMobileNav } from '../../../components';
import SidebarAnalytics from '../../../components/sidebarAnalytics';
import { useAuth } from '../../../hooks/useAuth';
import 'leaflet/dist/leaflet.css';
import {
  RecenterMap, FitRoute, GpsBadge, HistoryTab, RouteReplay,
  RunAnalysisOverlay, RunControls, RunSummaryOverlay, StatsPanel, StatsTab, Toast,
} from '../components';
import { useNavigate } from 'react-router-dom';
import { useToast }        from './../hooks/useToast';
import { useGeolocation }  from './../hooks/useGeolocation';

import { useRunTimer }     from './../hooks/useRunTimer';
import { useRunControls }  from './../hooks/useRunControl';
import { useActivityApi }  from './../hooks/useActivityApi';
import { useWindowWidth }  from './../hooks/useWindowWidth';

// ─── Constants ────────────────────────────────────────────────────────────────
const FALLBACK_COORDS = [14.6760, 121.0437];

// ─── Offline queue helpers ────────────────────────────────────────────────────
const OFFLINE_QUEUE_KEY = 'vitalis_offline_queue';

const getOfflineQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

const pushToOfflineQueue = (payload) => {
  const queue = getOfflineQueue();
  queue.push({ ...payload, queuedAt: Date.now() });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

const clearOfflineQueue = () => localStorage.removeItem(OFFLINE_QUEUE_KEY);

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

// ─── Main Component ───────────────────────────────────────────────────────────
const ActivityMap = () => {
  const { user } = useAuth();
  const USER_ID = user?.id || null;
  const navigate = useNavigate();

  // UI state
  const [activeTab, setActiveTab]             = useState('run');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [runAnalysis, setRunAnalysis]         = useState(null);
  const [isOnline, setIsOnline]               = useState(navigator.onLine);
  const [pendingCount, setPendingCount]       = useState(() => getOfflineQueue().length);

  // ── Online/offline listeners ───────────────────────────────────────────────
  React.useEffect(() => {
    const goOnline = async () => {
      setIsOnline(true);
      await flushOfflineQueue();
    };
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [USER_ID]); // eslint-disable-line

  // ── Flush queued runs when back online ────────────────────────────────────
  const flushOfflineQueue = async () => {
    const queue = getOfflineQueue();
    if (!queue.length || !USER_ID) return;

    let flushed = 0;
    for (const item of queue) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/activity/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(item.payload),
        });
        if (res.ok) flushed++;
      } catch {
        break; // still offline, stop trying
      }
    }

    if (flushed === queue.length) {
      clearOfflineQueue();
      setPendingCount(0);
      showToast(`✓ ${flushed} offline run${flushed > 1 ? 's' : ''} synced!`);
    } else {
      // Remove only the ones that succeeded
      const remaining = queue.slice(flushed);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
      setPendingCount(remaining.length);
    }
  };

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { isLargeScreen }    = useWindowWidth();
  const { toast, showToast } = useToast();

  // isRecording bridge state (geolocation needs it but runControls owns it)
  const [isRecordingState, setIsRecordingState] = useState(false);

  const {
    userLocation,
    startCoords,
    locationStatus,
    mapCenter,
    path,
    setPath,
  } = useGeolocation(isRecordingState);

  const {
    metrics,
    splits,
    resetMetrics,
  } = useRunTimer(isRecordingState, locationStatus, setPath);

  const {
    isRecording:        rc_isRecording,
    hasPaused:          rc_hasPaused,
    runFinished:        rc_runFinished,
    finishedPathRef:    rc_finishedPathRef,
    finishedMetricsRef: rc_finishedMetricsRef,
    finishedSplitsRef:  rc_finishedSplitsRef,
    handleStartRun:     rc_handleStartRun,
    handlePauseResume:  rc_handlePauseResume,
    handleFinish:       rc_handleFinish,
    handleDiscard:      rc_handleDiscard,
  } = useRunControls({
    userLocation,
    startCoords,
    metrics,
    path,
    splits,
    resetMetrics,
    setPath,
  });

  // Sync isRecording → geolocation
  React.useEffect(() => {
    setIsRecordingState(rc_isRecording);
  }, [rc_isRecording]);

  const {
    isSaving,
    history,
    historyLoading,
    historyError,
    stats,
    statsLoading,
    statsError,
    fetchHistory,
    handleSaveActivity,
    handleDelete,
  } = useActivityApi({ userId: USER_ID, activeTab, showToast, setRunAnalysis });

  // ── Offline-aware save ─────────────────────────────────────────────────────
  const handleSave = async () => {
    const m = rc_finishedMetricsRef.current;
    const payload = {
      userId:   USER_ID,
      duration: m.time,
      distance: parseFloat((m.distance || 0).toFixed(2)),
      pace:     m.pace,
      calories: m.calories,
      route:    rc_finishedPathRef.current,
    };

    if (!isOnline) {
      pushToOfflineQueue({ payload });
      setPendingCount(getOfflineQueue().length);
      showToast('📶 Offline — run saved locally, will sync when reconnected', 'warn');
      rc_handleDiscard(FALLBACK_COORDS);
      return;
    }

    // Online — use normal save
    await handleSaveActivity({
      finishedMetricsRef: rc_finishedMetricsRef,
      finishedPathRef:    rc_finishedPathRef,
      finishedSplitsRef:  rc_finishedSplitsRef,
    });
  };

  const formatTime = (seconds) => {
    const s = parseInt(seconds) || 0;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${sc.toString().padStart(2, '0')}`;
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-row min-h-screen bg-[#131313] text-[#e5e2e1] overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <SidebarAnalytics onExpandChange={setSidebarExpanded} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar sidebarExpanded={sidebarExpanded} userId={USER_ID} />

        {/* ── Offline banner ── */}
        {!isOnline && (
          <div className="z-50 flex items-center justify-center gap-2 bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400">
              Offline — runs will sync when reconnected
              {pendingCount > 0 && ` · ${pendingCount} pending`}
            </span>
          </div>
        )}

        {/* ── Pending sync banner (online but has queued runs) ── */}
        {isOnline && pendingCount > 0 && (
          <div className="z-50 flex items-center justify-center gap-2 bg-[#D1FD52]/5 border-b border-[#D1FD52]/10 px-4 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#D1FD52] animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-[#D1FD52]">
              Syncing {pendingCount} offline run{pendingCount > 1 ? 's' : ''}…
            </span>
          </div>
        )}

        {/* Tab bar */}
        {!rc_runFinished && (
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

        <main className="flex-1 overflow-hidden relative">

          {/* ══ REPLAY MODE ══ */}
          {rc_runFinished && (
            <div className="relative h-full w-full">
              <MapContainer
                center={rc_finishedPathRef.current[0] || FALLBACK_COORDS}
                zoom={15}
                zoomControl={false}
                className="h-full w-full z-0"
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                <FitRoute path={rc_finishedPathRef.current} />
                <RouteReplay fullPath={rc_finishedPathRef.current} />
              </MapContainer>
              <RunSummaryOverlay
                metrics={rc_finishedMetricsRef.current}
                splits={rc_finishedSplitsRef.current}
                formatTime={formatTime}
                onSave={handleSave}
                onDiscard={() => rc_handleDiscard(FALLBACK_COORDS)}
                isSaving={isSaving}
                isOnline={isOnline}
              />
            </div>
          )}

          {/* ══ RUN TAB ══ */}
          {!rc_runFinished && activeTab === 'run' && (
            <div className="flex h-full">
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
                  <RecenterMap coords={path} isRecording={rc_isRecording} userLocation={userLocation} />
                </MapContainer>

                <GpsBadge locationStatus={locationStatus} />

                {locationStatus === 'denied' && (
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-[1000] bg-black/70 backdrop-blur-md px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-red-500/20 max-w-[160px] sm:max-w-[180px]">
                    <p className="text-[8px] text-red-400 font-semibold leading-relaxed">
                      Location denied. Enable in browser settings for real GPS.
                    </p>
                  </div>
                )}

                <RunControls
                  isRecording={rc_isRecording}
                  hasPaused={rc_hasPaused}
                  metricsTime={metrics.time}
                  onStart={rc_handleStartRun}
                  onPauseResume={rc_handlePauseResume}
                  onFinish={rc_handleFinish}
                />

                {!isLargeScreen && (
                  <StatsPanel
                    metrics={metrics}
                    splits={splits}
                    formatTime={formatTime}
                    isDesktop={false}
                  />
                )}
              </div>

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
          {!rc_runFinished && activeTab === 'history' && (
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
          {!rc_runFinished && activeTab === 'stats' && (
            <StatsTab
              stats={stats}
              statsLoading={statsLoading}
              statsError={statsError}
              formatTime={formatTime}
            />
          )}
        </main>
      </div>

      <div className="md:hidden">
        <AnalyticsMobileNav navigate={navigate} />
      </div>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      <RunAnalysisOverlay analysis={runAnalysis} onClose={() => setRunAnalysis(null)} />
    </div>
  );
};

export default ActivityMap;