import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/port';

const usePlans = () => {
  const [USER_ID, setUSER_ID] = useState(null);
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [detailPlan, setDetailPlan] = useState(null);
  const [trackerPlan, setTrackerPlan] = useState(null);
  const [trackerContent, setTrackerContent] = useState([]);
  const [trackerProgress, setTrackerProgress] = useState([]);

  // ✅ Cookie-based auth — get user via /api/auth/me
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: USER_ID, planId }),
      });
      if (res.ok) {
        fetchMarketplace();
      }
    } catch (err) {
      console.error('Enrollment failed:', err);
    }
  };

  const startTracker = async (plan) => {
    setDetailPlan(null);
    try {
      const [contentRes, progressRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/plans/content/${plan.id}`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/plans/progress/${USER_ID}/${plan.id}`, { credentials: 'include' }),
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
        method: 'POST',
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

  const closeTracker = () => {
    setTrackerPlan(null);
    fetchMarketplace();
  };

  const enrolledCount = trainingPlans.filter(p => p.is_enrolled === 1).length;

  return {
    // state
    loading,
    trainingPlans,
    enrolledCount,
    detailPlan,
    trackerPlan,
    trackerContent,
    trackerProgress,
    // setters
    setDetailPlan,
    // handlers
    handleEnroll,
    startTracker,
    handleCompleteDay,
    closeTracker,
  };
};

export default usePlans;