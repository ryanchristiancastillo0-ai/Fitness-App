import { API_BASE_URL } from '../../../config/port';

export const useActivityLogger = (
  USER_ID,
  { setData, setBiometrics, biometrics, generateClinicalInsight }
) => {

  const handleLogActivity = async (formData) => {
    try {
      const calories = formData.calories ? parseInt(formData.calories) : 0;
      const steps    = formData.steps    ? parseInt(formData.steps)    : 0;
      const minutes  = formData.minutes  ? parseInt(formData.minutes)  : 0;

      const hasActivity =
        calories > 0 || steps > 0 || minutes > 0;

      if (hasActivity) {
        await fetch(`${API_BASE_URL}/api/logs/${USER_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            calories,
            steps,
            minutes,
          }),
        });
      }

      const [updatedRes, bioRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dashboard/${USER_ID}`, {
          credentials: 'include',
        }),
        fetch(`${API_BASE_URL}/api/sleep/${USER_ID}?range=D&metric=duration`, {
          credentials: 'include',
        }),
      ]);

      const updatedData = await updatedRes.json();
      const freshBiometrics = await bioRes.json();

      const latestSleepRes = await fetch(
        `${API_BASE_URL}/api/sleep/${USER_ID}/today`,
        { credentials: 'include' }
      );

      const latestSleep = await latestSleepRes.json();

      console.log('[DASHBOARD] Latest sleep:', latestSleep);

      const newStats = {
        ...updatedData.stats,
        water_intake_ml: latestSleep?.water_intake_ml || 0,
        sleep_duration:  latestSleep?.sleep_duration  || 0,
        sleep_quality:   latestSleep?.sleep_quality   || 0,
      };

      setData(prev => ({
        ...prev,
        ...updatedData,
        stats: newStats,
      }));

      if (Array.isArray(freshBiometrics)) {
        setBiometrics(freshBiometrics);
      }

      generateClinicalInsight(
        Array.isArray(freshBiometrics) ? freshBiometrics : biometrics,
        newStats
      );

    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  return { handleLogActivity };
};