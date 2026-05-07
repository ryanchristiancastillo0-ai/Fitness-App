import { useState, useCallback } from 'react';

export const useToast = (duration = 2800) => {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'ok' });

  const showToast = useCallback((message, type = 'ok') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), duration);
  }, [duration]);

  return { toast, showToast };
};