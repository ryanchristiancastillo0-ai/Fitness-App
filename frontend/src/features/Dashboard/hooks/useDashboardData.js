import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../../config/port';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

const socket = io(SOCKET_URL, {
  withCredentials: true,
});

export const useDashboardData = (USER_ID) => {
  const [data, setData]       = useState({ stats: {}, profile: {} });
  const [insights, setInsights] = useState([]);
  const [biometrics, setBiometrics] = useState([]);

  useEffect(() => {
    if (!USER_ID) return;

    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/${USER_ID}`, {
          credentials: 'include',
        });
        const result = await response.json();

        const sleepRes  = await fetch(`${API_BASE_URL}/api/sleep/${USER_ID}/today`, {
          credentials: 'include',
        });
        const sleepData = await sleepRes.json();

        setData({
          ...result,
          stats: {
            ...result.stats,
            water_intake_ml: sleepData?.water_intake_ml || 0,
            sleep_duration:  sleepData?.sleep_duration  || 0,
            sleep_quality:   sleepData?.sleep_quality   || 0,
          },
        });

        const bioRes  = await fetch(`${API_BASE_URL}/api/sleep/${USER_ID}?range=D&metric=duration`, {
          credentials: 'include',
        });
        const bioData = await bioRes.json();
        if (Array.isArray(bioData) && bioData.length > 0) {
          setBiometrics(bioData);
        }

        if (result.insights) {
          setInsights(result.insights);
        }
      } catch (error) {
        console.error('Fetch Error:', error);
      }
    };

    fetchDashboardData();
    socket.emit('join-room', USER_ID);

    const handleNewBiometric = (newPoint) => {
      const normalised = {
        label: newPoint.recorded_at
          ? new Date(newPoint.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : newPoint.label ?? '--:--',
        value: newPoint.value ?? newPoint.sleep_duration ?? 0,
      };
      setBiometrics(prev => [...prev.slice(-19), normalised]);
    };

    const handleNewInsight = (insight) => {
      setInsights(prev => [insight, ...prev].slice(0, 5));
    };

    socket.on('new-biometric-data',   handleNewBiometric);
    socket.on('new-clinical-insight', handleNewInsight);

    return () => {
      socket.off('new-biometric-data',   handleNewBiometric);
      socket.off('new-clinical-insight', handleNewInsight);
    };
  }, [USER_ID]);

  return {
    data,
    insights,
    biometrics,
    setData,
    setInsights,
    setBiometrics
  };
};