import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Icon from '../components/Icon';

// ── Context ──────────────────────────────────────────────────────────────
const NotificationContext = createContext(null);
export const useNotification = () => useContext(NotificationContext);

// ── Toast Component ───────────────────────────────────────────────────────
const ICONS = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
};

const COLORS = {
  success: 'border-[#D1FD52]/30 text-[#D1FD52]',
  error: 'border-[#e05050]/30 text-[#e05050]',
  info: 'border-white/10 text-[#aaa]',
};

function Toast({ id, message, type, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <div
      className={`
        flex items-start gap-3 w-[320px] px-4 py-3
        bg-[#1a1a1a] border rounded-xl shadow-2xl
        transition-all duration-300 ease-out
        ${COLORS[type]}
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
      `}
    >
      <span className="material-icons text-[18px] mt-0.5 shrink-0">
         <Icon name={'check_circle'} className={'text-[16px]'}/>
      </span>
      <p className="text-[12px] text-[#e5e2e1] leading-relaxed flex-1 m-0">
        {message}
      </p>
      <button
        onClick={handleClose}
        className="text-[#555] hover:text-[#e5e2e1] transition-colors bg-transparent border-none cursor-pointer p-0 leading-none"
      >
       <Icon name={'close'} className={'text-[16px]'}/>
      </button>
    </div>
  );
}

// ── Toast Container ───────────────────────────────────────────────────────
function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-[72px] right-4 z-[100] flex flex-col gap-2">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}

// ── Provider (wrap your app with this) ───────────────────────────────────
export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  return (
    <NotificationContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </NotificationContext.Provider>
  );
}