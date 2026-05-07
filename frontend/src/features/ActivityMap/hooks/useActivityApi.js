import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/port';

const formatTime = (seconds) => {
  const s = parseInt(seconds) || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sc = s % 60;
  return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${sc.toString().padStart(2, '0')}`;
};

export const useActivityApi = ({ userId, activeTab, showToast, setRunAnalysis }) => {
  const [isSaving, setIsSaving]             = useState(false);
  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError]     = useState(null);
  const [stats, setStats]                   = useState(null);
  const [statsLoading, setStatsLoading]     = useState(false);
  const [statsError, setStatsError]         = useState(null);

  const fetchHistory = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/activity/${userId}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setHistory(await res.json().then(d => Array.isArray(d) ? d : []));
    } catch (err) {
      setHistoryError(err.message);
    } finally {
      if (!silent) setHistoryLoading(false);
    }
  }, [userId]);

  const fetchStats = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/activity/stats/${userId}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStats(await res.json());
    } catch (err) {
      setStatsError(err.message);
    } finally {
      if (!silent) setStatsLoading(false);
    }
  }, [userId]);

  const handleSaveActivity = async ({ finishedMetricsRef, finishedPathRef, finishedSplitsRef }) => {
    if (!userId) { showToast('⚠ Not logged in', 'error'); return; }
    setIsSaving(true);
    try {
      const m = finishedMetricsRef.current;
      const res = await fetch(`${API_BASE_URL}/api/activity/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          duration: m.time,
          distance: parseFloat((m.distance || 0).toFixed(2)),
          pace: m.pace,
          calories: m.calories,
          route: finishedPathRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);

      // AI run analysis after save
      const aiRes = await fetch(`${API_BASE_URL}/api/ai/run-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
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
        setRunAnalysis(aiData);
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

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/activity/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      showToast('Activity deleted');
      fetchHistory();
      fetchStats(true);
    } catch (err) {
      showToast(`⚠ Delete failed — ${err.message}`, 'error');
    }
  };

  // Auto-fetch when tab changes
  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
    if (activeTab === 'stats')   fetchStats();
  }, [activeTab, fetchHistory, fetchStats]);

  return {
    isSaving,
    history,
    historyLoading,
    historyError,
    stats,
    statsLoading,
    statsError,
    fetchHistory,
    fetchStats,
    handleSaveActivity,
    handleDelete,
  };
};