// components/SuccessModal.jsx
import React from 'react';
import { Icon } from '../../../components';

const SuccessModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="bg-[#141414] border border-[#c7f248]/30 p-8 rounded-2xl shadow-2xl relative z-10 max-w-sm w-full text-center transform animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-[#c7f248]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon name="check" className="text-[#c7f248] text-3xl" />
        </div>
        <h3 className="text-xl font-['Manrope'] font-black text-white mb-2 uppercase tracking-tighter">
          Sync Successful
        </h3>
        <p className="text-white/40 text-xs font-medium leading-relaxed">
          Your neural profile has been securely updated within the Clinical Vault.
        </p>
        <button
          onClick={onClose}
          className="mt-8 w-full py-3 bg-[#c7f248] text-[#161f00] text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 transition-all"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;