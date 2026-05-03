import { useEffect } from 'react';
import { saveSleepData } from '../services/sleepService';


export const useSleepActions = ({
  USER_ID,
  sleepHours,
  sleepQuality,
  waterIntake,
  sleepStatus,
  setSaveStatus,
  loadSleepAndScatter,
  saveTimer
}) => {

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
    return () => clearTimeout(saveTimer.current);
  }, []);

  return { handleSaveSleep };
};