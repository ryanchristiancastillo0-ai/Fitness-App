 const Toast = ({ message, type, visible }) => {
  if (!visible) return null;
  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-full
        text-[11px] font-bold border backdrop-blur-md whitespace-nowrap transition-all
        ${type === 'error'
          ? 'bg-red-500/10 border-red-500/20 text-red-400'
          : 'bg-[#D1FD52]/10 border-[#D1FD52]/20 text-[#D1FD52]'}`}
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 6rem)' }}
    >
      {message}
    </div>
  );
};

export default Toast