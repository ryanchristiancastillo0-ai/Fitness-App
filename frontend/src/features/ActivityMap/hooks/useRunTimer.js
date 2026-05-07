import { useState, useEffect, useRef } from 'react';

export const useRunTimer = (isRecording, locationStatus, setPath) => {
  const [metrics, setMetrics] = useState({ time: 0, distance: 0, pace: "0'00\"", calories: 0 });
  const [splits, setSplits]   = useState([]);

  const timerRef       = useRef(null);
  const splitsRef      = useRef([]);
  const lastSplitRef   = useRef(0);

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

        // Mock movement when GPS is not available
        if (locationStatus !== 'granted') {
          setPath(prev => {
            const last = prev[prev.length - 1];
            return [
              ...prev,
              [
                last[0] + (Math.random() - 0.48) * 0.0003,
                last[1] + 0.00018,
              ],
            ];
          });
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording, locationStatus, setPath]);

  const resetMetrics = () => {
    setMetrics({ time: 0, distance: 0, pace: "0'00\"", calories: 0 });
    setSplits([]);
    splitsRef.current = [];
    lastSplitRef.current = 0;
  };

  return {
    metrics,
    splits,
    splitsRef,
    resetMetrics,
  };
};