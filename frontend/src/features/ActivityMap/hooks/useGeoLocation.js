import { useState, useEffect, useRef } from 'react';

const FALLBACK_COORDS = [14.6760, 121.0437];

export const useGeolocation = (isRecording) => {
  const [userLocation, setUserLocation]     = useState(null);
  const [startCoords, setStartCoords]       = useState(FALLBACK_COORDS);
  const [locationStatus, setLocationStatus] = useState('pending');
  const [mapCenter, setMapCenter]           = useState(FALLBACK_COORDS);
  const [path, setPath]                     = useState([FALLBACK_COORDS]);

  const watchIdRef = useRef(null);

  // Get initial position on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(c);
        setStartCoords(c);
        setMapCenter(c);
        setPath([c]);
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Watch position while recording
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
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isRecording]);

  return {
    userLocation,
    setUserLocation,
    startCoords,
    locationStatus,
    mapCenter,
    path,
    setPath,
  };
};