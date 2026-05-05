// components/PersonalInfoForm.jsx
import React from 'react';
import { Icon } from '../../../components';

const inputClass = (editable) =>
  `bg-transparent border-0 border-b py-2 font-medium transition-all outline-none w-full ${
    editable
      ? 'border-[#c7f248] text-white focus:border-[#c7f248] focus:ring-0 cursor-text'
      : 'border-white/[0.08] text-white/60 cursor-default select-none'
  }`;

const PersonalInfoForm = ({ formData, isEditing, onInputChange }) => {
  return (
    <section className="bg-[#141414] p-8 md:p-10 rounded-2xl border border-white/[0.04]">
      <h3 className="text-xl font-['Manrope'] font-bold text-white mb-10 flex items-center gap-3">
        <Icon name="tune" className="text-[#c7f248]" />
        Personal Information
        <span className={`ml-auto text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
          isEditing
            ? 'text-[#c7f248] bg-[#c7f248]/10 border-[#c7f248]/20'
            : 'text-white/20 bg-white/5 border-white/[0.04]'
        }`}>
          {isEditing ? '✎ Editing' : '🔒 Locked'}
        </span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
        <div className="flex flex-col gap-2">
          <label className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Full Name</label>
          <input
            className={inputClass(isEditing)}
            type="text"
            value={formData.fullName}
            onChange={e => onInputChange(e, 'fullName')}
            readOnly={!isEditing}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Clinical Email</label>
          <input
            className={inputClass(false)}
            type="email"
            value={formData.email}
            readOnly
          />
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Emergency Contact</label>
          <input
            className={inputClass(isEditing)}
            type="text"
            value={formData.contact}
            onChange={e => onInputChange(e, 'contact')}
            readOnly={!isEditing}
          />
        </div>

        <div className="md:col-span-2 flex flex-col gap-2 mt-4">
          <label className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Medical Biography</label>
          <textarea
            className={inputClass(isEditing)}
            rows="3"
            value={formData.bio}
            onChange={e => onInputChange(e, 'bio')}
            readOnly={!isEditing}
          />
        </div>
      </div>
    </section>
  );
};

export default PersonalInfoForm;