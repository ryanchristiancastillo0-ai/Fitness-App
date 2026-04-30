import { useState, useEffect } from 'react';
import Icon from './Icon';
import { API_BASE_URL } from '../config/port';

const trendIcon = (trend) => {
  if (trend === 'up')   return { icon: 'trending_up',   color: '#4ade80' };
  if (trend === 'down') return { icon: 'trending_down', color: '#f87171' };
  return                       { icon: 'trending_flat', color: '#facc15' };
};

const categoryColor = (category) => {
  switch (category) {
    case 'Recovery Alert':    return '#f87171';
    case 'Hydration Warning': return '#60a5fa';
    case 'Performance Tip':   return '#D1FD52';
    case 'Rest Advisory':     return '#c084fc';
    default:                  return '#c7f248';
  }
};

const InsightCard = ({ item }) => {
  const accent = categoryColor(item.category);
  const { icon, color } = trendIcon(item.trend);
  return (
    <div
      className="rounded-r-lg p-4 border-l-[3px] bg-white/[0.03] transition-colors hover:bg-white/[0.06] flex-shrink-0"
      style={{ borderColor: accent }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: accent }}>
          {item.category}
        </span>
        <Icon name={icon} className="text-[14px]" style={{ color }} />
      </div>
      <p className="text-[12px] text-[#e5e2e1] leading-relaxed font-medium">
        {item.message}
      </p>
      {item.timestamp && (
        <div className="flex items-center gap-1 mt-3 opacity-40">
          <Icon name="schedule" className="text-[10px]" />
          <span className="text-[9px] font-bold uppercase tracking-tighter">
            {item.timestamp}
          </span>
        </div>
      )}
    </div>
  );
};

const ClinicalAssistant = ({ insights = [], water = 0, isAnalyzing = false, userId = null }) => {
  const [barWidth,      setBarWidth]     = useState(0);
  const [showHistory,    setShowHistory]  = useState(false);
  const [history,        setHistory]      = useState([]);
  const [historyLoad,    setHistoryLoad]  = useState(false);
  const [historyError, setHistoryError] = useState(false);

  const goal = 3000;

  useEffect(() => {
    if (isAnalyzing && showHistory) {
      setShowHistory(false);
    }
  }, [isAnalyzing, showHistory]);

  useEffect(() => {
    const numericWater = Number(water) || 0;
    const calculated   = Math.min((numericWater / goal) * 100, 100);
    const timer = setTimeout(() => setBarWidth(calculated), 100);
    return () => clearTimeout(timer);
  }, [water]);

  // ✅ AUTO-FETCH LATEST DATA IF INSIGHTS ARE EMPTY
  useEffect(() => {
    if (!userId || insights.length > 0) return;

    const fetchLatestIfEmpty = async () => {
      setHistoryLoad(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/ai/history/${userId}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Update internal history state if dashboard insights are currently empty
          setHistory(data);
        }
      } catch (err) {
        console.error('Initial fetch error:', err);
      } finally {
        setHistoryLoad(false);
      }
    };

    fetchLatestIfEmpty();
  }, [userId, insights.length]);

  useEffect(() => {
    if (!showHistory || !userId) return;

    const fetchHistory = async () => {
      setHistoryLoad(true);
      setHistoryError(false);
      try {
        const res  = await fetch(`${API_BASE_URL}/api/ai/history/${userId}`);
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('History fetch error:', err);
        setHistoryError(true);
      } finally {
        setHistoryLoad(false);
      }
    };

    fetchHistory();
  }, [showHistory, userId]);

  // Determine which data to show: 
  // 1. Explicit history mode
  // 2. Incoming fresh insights from props
  // 3. Fallback to locally fetched history if props are empty
  const activeInsights = showHistory ? history : (insights.length > 0 ? insights : history.slice(0, 5));

  return (
    <div className="h-full min-h-[500px] lg:h-[calc(100vh-120px)] bg-[#2a2a2a] border border-white/[0.05] rounded-[14px] p-[22px] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#45483e] flex items-center justify-center">
            <Icon name="auto_awesome" className="text-[#acd52b] text-[16px]" />
          </div>
          <span className="font-bold text-[13px] text-[#e5e2e1]">Clinical Assistant</span>
        </div>

        {isAnalyzing && (
          <div className="flex items-center gap-1.5 bg-[#D1FD52]/10 px-2.5 py-1 rounded-full border border-[#D1FD52]/20">
            <div className="w-1.5 h-1.5 bg-[#D1FD52] rounded-full animate-ping" />
            <span className="text-[8px] font-black text-[#D1FD52] uppercase tracking-widest">Scanning</span>
          </div>
        )}
      </div>

      <div className="mb-5 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Hydration</span>
          <span className={`text-[10px] font-black ${Number(water) < 1000 ? 'text-[#f87171]' : 'text-[#60a5fa]'}`}>
            {water} / {goal} ml
          </span>
        </div>
        <div className="h-1.5 bg-black/40 rounded-full w-full relative overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-in-out ${Number(water) < 1000 ? 'bg-[#f87171]' : 'bg-[#60a5fa]'}`}
            style={{ width: `${barWidth}%`, minWidth: barWidth > 0 ? '4px' : '0px' }}
          />
        </div>
      </div>

      <div className="mb-4 flex-shrink-0">
        <button
          onClick={() => setShowHistory(prev => !prev)}
          disabled={!userId || isAnalyzing}
          className={`
            w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg
            text-[10px] font-black uppercase tracking-widest
            border transition-all duration-200 cursor-pointer
            ${showHistory
              ? 'bg-[#c7f248]/10 border-[#c7f248]/30 text-[#c7f248]'
              : 'bg-white/[0.03] border-white/[0.06] text-[#555] hover:text-[#999] hover:border-white/10'
            }
            disabled:opacity-30 disabled:cursor-not-allowed
          `}
        >
          <Icon
            name={showHistory ? 'history_toggle_off' : 'manage_history'}
            className="text-[13px]"
          />
          {showHistory ? 'Show Recent' : 'Show All History'}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
          {showHistory ? 'Full AI History' : 'Recent Insights'}
        </span>
        {showHistory && !historyLoad && history.length > 0 && (
          <span className="text-[9px] font-black text-[#c7f248]/50">
            ({history.length})
          </span>
        )}
        <div className="flex-1 h-px bg-white/[0.04]" />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {historyLoad && (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-1.5 h-1.5 bg-[#c7f248] rounded-full animate-ping" />
              <span className="text-[10px] text-white/20 uppercase tracking-widest">Loading history...</span>
            </div>
          </div>
        )}

        {historyError && !historyLoad && (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-red-500/10 rounded-xl">
            <p className="text-[11px] text-red-400/50 italic text-center px-4">
              Failed to load history. Check your connection.
            </p>
          </div>
        )}

        {!historyLoad && !historyError && activeInsights.length === 0 && (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
            <p className="text-[11px] text-white/20 italic text-center px-4">
              {showHistory
                ? 'No history found. Your AI insights will appear here after analysis.'
                : 'Waiting for biometric data to assess health condition...'}
            </p>
          </div>
        )}

        {!historyLoad && !historyError && activeInsights.map((item, idx) => (
          <InsightCard key={item.id || idx} item={item} />
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(209,253,82,0.3); }
      `}} />
    </div>
  );
};

export default ClinicalAssistant;