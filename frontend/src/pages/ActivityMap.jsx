import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Sidebar, Topbar, MobileNav } from '../components';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL } from '../config/port';
import 'leaflet/dist/leaflet.css';

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

// ─── Map helpers ──────────────────────────────────────────────────────────────
const RecenterMap = ({ coords, isRecording, userLocation }) => {
  const map = useMap();
  const didFlyRef = useRef(false);

  useEffect(() => {
    if (userLocation && !didFlyRef.current) {
      didFlyRef.current = true;
      map.flyTo(userLocation, 16, { animate: true, duration: 1.5 });
    }
  }, [userLocation, map]);

  useEffect(() => {
    if (isRecording && coords.length > 0) {
      map.panTo(coords[coords.length - 1]);
    }
  }, [coords, map, isRecording]);

  return null;
};

const FitRoute = ({ path }) => {
  const map = useMap();
  useEffect(() => {
    if (path.length > 1) {
      map.fitBounds(L.latLngBounds(path), { padding: [60, 60], animate: true, duration: 1.2 });
    }
  }, [path, map]);
  return null;
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, visible }) => {
  if (!visible) return null;
  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-full
        text-[11px] font-bold border backdrop-blur-md whitespace-nowrap transition-all
        ${type === 'error'
          ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : 'bg-[#D1FD52]/10 border-[#D1FD52]/20 text-[#D1FD52]'}`}
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 6rem)' }}
    >
      {message}
    </div>
  );
};

// ─── Animated route replay ────────────────────────────────────────────────────
const RouteReplay = ({ fullPath }) => {
  const [drawnPath, setDrawnPath] = useState([fullPath[0]]);
  const [isDone, setIsDone] = useState(false);
  const frameRef = useRef(null);
  const indexRef = useRef(1);
  const PPF = Math.max(1, Math.ceil(fullPath.length / 120));

  useEffect(() => {
    indexRef.current = 1;
    setDrawnPath([fullPath[0]]);
    setIsDone(false);
    const tick = () => {
      if (indexRef.current >= fullPath.length) { setIsDone(true); return; }
      indexRef.current = Math.min(indexRef.current + PPF, fullPath.length);
      setDrawnPath(fullPath.slice(0, indexRef.current));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [fullPath, PPF]);

  return (
    <>
      <Polyline positions={fullPath} pathOptions={{ color: '#D1FD52', weight: 4, opacity: 0.12 }} />
      <Polyline positions={drawnPath} pathOptions={{ color: '#D1FD52', weight: 5, opacity: 0.9 }} />
      <Marker position={fullPath[0]} icon={createStartIcon()} />
      {!isDone && drawnPath.length > 0 && (
        <Marker position={drawnPath[drawnPath.length - 1]} icon={createUserIcon()} />
      )}
      {isDone && (
        <Marker position={fullPath[fullPath.length - 1]} icon={createFinishIcon()} />
      )}
    </>
  );
};

// ─── Post-run summary overlay ─────────────────────────────────────────────────
const RunSummaryOverlay = ({ metrics, splits, formatTime, onSave, onDiscard, isSaving }) => (
  <div className="absolute inset-0 z-[500] pointer-events-none">
    {/* Top badge */}
    <div className="absolute top-0 left-0 right-0 pointer-events-auto">
      <div className="flex items-start justify-center pt-3 sm:pt-4 px-4">
        <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl px-4 sm:px-5 py-2 sm:py-2.5 text-center">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-[#D1FD52]">Run Complete</p>
          <p className="text-[9px] sm:text-[10px] text-white/40 mt-0.5">Route replaying below</p>
        </div>
      </div>
    </div>

    {/* Bottom panel */}
    <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
      <div
        className="bg-gradient-to-t from-black via-black/96 to-transparent pt-8 sm:pt-10 px-3 sm:px-4 md:px-6"
        style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom, 0px) + 5rem))' }}
      >
        {/* Stats grid */}
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
          {[
            { val: (metrics.distance || 0).toFixed(2), label: 'Distance', unit: 'km'   },
            { val: formatTime(metrics.time),            label: 'Time',     unit: ''     },
            { val: metrics.pace || '–',                 label: 'Pace',     unit: '/km'  },
            { val: metrics.calories || 0,               label: 'Calories', unit: 'kcal' },
          ].map(({ val, label, unit }) => (
            <div key={label} className="bg-white/5 border border-white/5 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-center">
              <p className="text-base sm:text-lg md:text-xl font-black italic tracking-tighter text-white leading-none">
                {val}
                {unit && <span className="text-[9px] sm:text-[10px] text-white/30 font-semibold ml-0.5">{unit}</span>}
              </p>
              <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.18em] text-white/30 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Splits */}
        {splits.length > 0 && (
          <div className="mb-3 sm:mb-4 max-h-[72px] sm:max-h-[80px] overflow-y-auto space-y-1.5 scrollbar-none">
            {splits.map(s => (
              <div key={s.km} className="flex justify-between bg-white/5 border border-white/5 rounded-xl px-3 sm:px-4 py-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">KM {s.km}</span>
                <span className="text-[10px] font-black italic text-[#D1FD52]">{s.pace}</span>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={onDiscard}
            disabled={isSaving}
            className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full py-2.5 sm:py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-40"
          >
            Discard
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 bg-[#D1FD52] text-black rounded-full py-2.5 sm:py-3 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSaving && <span className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
            {isSaving ? 'Saving…' : 'Save Run'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─── Live stats bottom sheet (mobile) / side panel (desktop) ─────────────────
const StatsPanel = ({ metrics, splits, formatTime, isDesktop }) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isDesktop) {
    return (
      <div className="w-[300px] xl:w-[340px] 2xl:w-[380px] flex-shrink-0 bg-[#131313] flex flex-col gap-4 xl:gap-5 p-4 xl:p-5 overflow-y-auto border-l border-white/5">
        <h2 className="text-base xl:text-lg font-black italic tracking-tighter uppercase text-white/90">Run Session</h2>

        <div className="grid grid-cols-2 gap-2 xl:gap-3">
          {[
            { label: 'Time',      val: formatTime(metrics.time)    },
            { label: 'Dist (km)', val: metrics.distance.toFixed(2) },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white/5 p-3 xl:p-4 rounded-2xl border border-white/5">
              <p className="text-[9px] text-white/30 uppercase font-black tracking-[0.2em] mb-1">{label}</p>
              <h3 className="text-xl xl:text-2xl font-black italic tracking-tighter">{val}</h3>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-3 xl:p-4 rounded-2xl bg-[#D1FD52]/5 border border-[#D1FD52]/10">
          <div className="flex items-center gap-2 xl:gap-3">
            <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-[#D1FD52] flex items-center justify-center text-black font-black text-sm">P</div>
            <div>
              <p className="text-xs font-bold text-white">Pace</p>
              <p className="text-[9px] text-white/40 uppercase">Min/KM</p>
            </div>
          </div>
          <span className="text-lg xl:text-xl font-black italic text-[#D1FD52]">{metrics.pace}</span>
        </div>

        <div className="flex items-center justify-between p-3 xl:p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 xl:gap-3">
            <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 font-black text-sm">C</div>
            <div>
              <p className="text-xs font-bold text-white">Calories</p>
              <p className="text-[9px] text-white/40 uppercase">Est.</p>
            </div>
          </div>
          <span className="text-lg xl:text-xl font-black italic">{metrics.calories}</span>
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-3 px-1">Splits</p>
          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[200px] xl:max-h-none scrollbar-none">
            {splits.length === 0
              ? <p className="text-[10px] text-white/20 text-center py-3">No splits yet</p>
              : splits.map(s => (
                  <div key={s.km} className="flex justify-between px-3 py-2 xl:py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[9px] font-bold text-white/40">KM {s.km}</span>
                    <span className="text-[10px] font-black italic text-[#D1FD52]">{s.pace}</span>
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    );
  }

  // Mobile bottom sheet — sits ABOVE the mobile nav (80px) + safe area
  return (
    <div
      className="absolute left-0 right-0 z-[800] px-3 sm:px-4 pointer-events-auto"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)' }}
    >
      {!sheetOpen ? (
        <button
          onClick={() => setSheetOpen(true)}
          className="w-full bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div>
              <p className="text-[8px] text-white/30 uppercase font-black tracking-widest">Time</p>
              <p className="text-sm sm:text-base font-black italic text-white">{formatTime(metrics.time)}</p>
            </div>
            <div className="w-px h-6 sm:h-7 bg-white/10" />
            <div>
              <p className="text-[8px] text-white/30 uppercase font-black tracking-widest">Dist</p>
              <p className="text-sm sm:text-base font-black italic text-white">{metrics.distance.toFixed(2)} km</p>
            </div>
            <div className="w-px h-6 sm:h-7 bg-white/10" />
            <div>
              <p className="text-[8px] text-white/30 uppercase font-black tracking-widest">Pace</p>
              <p className="text-sm sm:text-base font-black italic text-[#D1FD52]">{metrics.pace}</p>
            </div>
          </div>
          <span className="text-white/30 text-base sm:text-lg ml-2">↑</span>
        </button>
      ) : (
        <div className="w-full bg-[#131313]/95 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#D1FD52]">Run Session</p>
            <button
              onClick={() => setSheetOpen(false)}
              className="text-white/30 text-xs sm:text-sm hover:text-white transition-colors"
            >
              ↓ Close
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4">
            {[
              { label: 'Time',      val: formatTime(metrics.time)    },
              { label: 'Dist (km)', val: metrics.distance.toFixed(2) },
              { label: 'Pace',      val: metrics.pace                },
              { label: 'Cal',       val: metrics.calories            },
            ].map(({ label, val }) => (
              <div key={label} className="bg-white/5 rounded-xl p-2.5 sm:p-3 border border-white/5">
                <p className="text-[8px] text-white/30 uppercase font-black tracking-widest mb-0.5">{label}</p>
                <p className="text-lg sm:text-xl font-black italic tracking-tighter">{val}</p>
              </div>
            ))}
          </div>
          {splits.length > 0 && (
            <div className="max-h-[90px] sm:max-h-[100px] overflow-y-auto space-y-1.5 scrollbar-none">
              {splits.map(s => (
                <div key={s.km} className="flex justify-between px-3 py-1.5 sm:py-2 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[9px] font-bold text-white/40">KM {s.km}</span>
                  <span className="text-[10px] font-black italic text-[#D1FD52]">{s.pace}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Run control buttons ──────────────────────────────────────────────────────
const RunControls = ({ isRecording, hasPaused, metricsTime, onStart, onPauseResume, onFinish }) => (
  <div
    className="absolute z-[1000] left-1/2 -translate-x-1/2 w-max"
    // FIX: on mobile, sit above MobileNav (~80px) + safe area; on md+ use 1.25rem
    style={{
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)',
    }}
  >
    {/* On md+ we override with a Tailwind class via a wrapper */}
    <div className="md:!bottom-5 relative">
      {!isRecording && !hasPaused && metricsTime === 0 ? (
        <button
          onClick={onStart}
          className="bg-[#D1FD52] text-black px-8 sm:px-10 md:px-12 py-3 sm:py-4 rounded-full font-black uppercase italic tracking-tighter
            hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(209,253,82,0.25)] text-sm sm:text-base"
        >
          Start Activity
        </button>
      ) : (
        <div className="flex items-center gap-2 sm:gap-3 bg-[#1a1a1a]/90 backdrop-blur-md p-1.5 sm:p-2 rounded-full border border-white/10 shadow-2xl">
          <button
            onClick={onPauseResume}
            className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          >
            <span className="text-[9px] sm:text-[10px] font-black">{isRecording ? 'PAUSE' : 'RESUME'}</span>
          </button>
          <button
            onClick={onFinish}
            className="bg-red-500/20 text-red-400 px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-full font-bold uppercase text-[9px] sm:text-[10px] tracking-widest hover:bg-red-500 hover:text-white active:scale-95 transition-all"
          >
            Finish
          </button>
        </div>
      )}
    </div>
  </div>
);

// ─── GPS Badge ────────────────────────────────────────────────────────────────
const GpsBadge = ({ locationStatus }) => (
  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-[1000] flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl border border-white/10">
    <div
      className={`w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0
        ${locationStatus === 'granted' ? 'bg-[#D1FD52]' : locationStatus === 'pending' ? 'bg-yellow-400' : 'bg-red-400'}`}
    />
    <span
      className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest
        ${locationStatus === 'granted' ? 'text-[#D1FD52]' : locationStatus === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}
    >
      {locationStatus === 'granted' ? 'GPS Active' : locationStatus === 'pending' ? 'Locating…' : 'GPS Off'}
    </span>
  </div>
);

// ─── History Tab ──────────────────────────────────────────────────────────────
const HistoryTab = ({ history, historyLoading, historyError, formatTime, onRefresh, onDelete }) => (
  <div className="h-full overflow-y-auto">
    <div className="p-3 sm:p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h2 className="text-base sm:text-lg md:text-xl font-black italic tracking-tighter uppercase text-white/90">
          Activity History
        </h2>
        <button
          onClick={onRefresh}
          className="text-[10px] font-black uppercase tracking-[0.15em] text-[#D1FD52] hover:opacity-70 transition-opacity"
        >
          ↺ Refresh
        </button>
      </div>

      {historyLoading && (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <div className="w-6 h-6 border-2 border-white/10 border-t-[#D1FD52] rounded-full animate-spin" />
        </div>
      )}
      {historyError && (
        <div className="text-center py-16 sm:py-20 text-red-400 text-sm">
          ⚠ {historyError}<br />
          <span className="text-white/30 text-xs">Is your backend running?</span>
        </div>
      )}
      {!historyLoading && !historyError && history.length === 0 && (
        <div className="text-center py-16 sm:py-20 text-white/20">
          <div className="text-3xl sm:text-4xl mb-3">🏃</div>
          <p className="text-sm">No activities yet. Complete a run!</p>
        </div>
      )}
      {!historyLoading && !historyError && history.length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          {history.map(activity => {
            const d = new Date(activity.created_at || Date.now());
            return (
              <div
                key={activity.id}
                className="bg-[#1a1a1a] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 hover:border-[#D1FD52]/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <p className="text-[9px] sm:text-[10px] text-white/30 font-semibold">
                    {d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' · '}
                    {d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#D1FD52] bg-[#D1FD52]/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">Run</span>
                    <button
                      onClick={() => onDelete(activity.id)}
                      className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/15 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {[
                    { val: parseFloat(activity.distance || 0).toFixed(2), label: 'km'   },
                    { val: formatTime(activity.duration),                  label: 'time' },
                    { val: activity.pace || '–',                           label: 'pace' },
                    { val: activity.calories || 0,                         label: 'kcal' },
                  ].map(({ val, label }) => (
                    <div key={label}>
                      <p className="text-sm sm:text-base md:text-lg font-black italic tracking-tight text-white">{val}</p>
                      <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.15em] text-white/25">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

// ─── Stats Tab ────────────────────────────────────────────────────────────────
const StatsTab = ({ stats, statsLoading, statsError, formatTime }) => (
  <div className="h-full overflow-y-auto">
    <div className="p-3 sm:p-4 md:p-6">
      <h2 className="text-base sm:text-lg md:text-xl font-black italic tracking-tighter uppercase text-white/90 mb-4 sm:mb-5">
        Summary Stats
      </h2>
      {statsLoading && (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <div className="w-6 h-6 border-2 border-white/10 border-t-[#D1FD52] rounded-full animate-spin" />
        </div>
      )}
      {statsError && (
        <div className="text-center py-16 sm:py-20 text-red-400 text-sm">⚠ {statsError}</div>
      )}
      {!statsLoading && !statsError && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 max-w-2xl">
          {[
            { label: 'Total Runs',      val: stats.totalRuns ?? '–',                          unit: ''     },
            { label: 'Total Distance',  val: parseFloat(stats.totalDistance || 0).toFixed(1), unit: 'km'   },
            { label: 'Total Time',      val: formatTime(parseInt(stats.totalDuration) || 0),  unit: ''     },
            { label: 'Calories Burned', val: parseInt(stats.totalCalories) || 0,              unit: 'kcal' },
          ].map(({ label, val, unit }) => (
            <div key={label} className="bg-[#1a1a1a] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5">
              <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-1.5 sm:mb-2">{label}</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-black italic tracking-tighter text-[#D1FD52]">
                {val}
                {unit && <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-white/30 ml-1">{unit}</span>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ActivityMap = () => {
  const { user, logout } = useAuth();
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

  // UI
  // FIX: sidebar uses same pattern as Dashboard
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeTab, setActiveTab]             = useState('run');
  const [toast, setToast]                     = useState({ visible: false, message: '', type: 'ok' });
  const [isSaving, setIsSaving]               = useState(false);

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
      showToast('✓ Run saved!');
      handleDiscard(); fetchHistory(true); fetchStats(true);
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

  // ─── Sidebar margin helpers — identical pattern to Dashboard ─────────────
  const sidebarW  = sidebarExpanded ? 'md:ml-[240px]' : 'md:ml-[72px] ml-0';
  const tabLeft   = sidebarExpanded ? 'md:left-[240px]' : 'md:left-[72px] left-0';

  const handleLogout = async () => {
    await logout();
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-[#131313] text-[#e5e2e1] overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* FIX: Sidebar — same pattern as Dashboard: hidden on mobile, fixed on desktop */}
      <div className="hidden md:block">
        <Sidebar
          expanded={sidebarExpanded}
          setExpanded={setSidebarExpanded}
          onClick={handleLogout}
        />
      </div>

      {/* Topbar */}
      <Topbar sidebarExpanded={sidebarExpanded} userId={USER_ID} />

      {/* Tab bar — hidden during replay */}
      {!runFinished && (
        <div
          className={`fixed top-[60px] z-50 flex border-b border-white/5 bg-[#0e0e0e] transition-all duration-300 ${tabLeft} right-0`}
        >
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

      {/* ── Main ── */}
      <main
        className={`${runFinished ? 'pt-[60px]' : 'pt-[104px]'} h-screen ${sidebarW} transition-all duration-300`}
      >

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

      {/* Mobile nav */}
      <div className="md:hidden">
        <MobileNav />
      </div>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
};

export default ActivityMap;