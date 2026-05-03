import { useEffect } from 'react';
import { fetchZonesFromAPI,fetchScatterData,fetchTodaySleep,saveSleepData,DEFAULT_ZONES } from '../services/sleepService';

export const useAnalyticsData = ({
  USER_ID,
  timeframe,
  setZones,
  setZonesLoading,
  setScatterData,
  setSleepHours,
  setSleepQuality,
  setWaterIntake
}) => {

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
        if (todayData.sleep_quality)
          setSleepQuality(todayData.sleep_quality);
        if (todayData.water_intake_ml !== undefined)
          setWaterIntake(todayData.water_intake_ml);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    if (!USER_ID) return;
    loadSleepAndScatter();
    loadZones();
  }, [timeframe, USER_ID]);

};