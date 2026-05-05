// components/AvatarCard.jsx
import React from 'react';
import { Icon } from '../../../components';
import { getAvatarUrl } from '../utils/avatar';

const AvatarCard = ({
  USER_ID,
  avatarSrc,
  formData,
  isEditing,
  pendingAvatar,
  onPenClick,
  onOpenAvatarPicker,
}) => {
  return (
    <section className="bg-[#141414] p-8 rounded-2xl border-l-2 border-[#c7f248]/30 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#c7f248]/5 rounded-full blur-3xl -mr-16 -mt-16" />
      <div className="flex flex-col items-center text-center">

        {/* Avatar ring */}
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full border border-[#c7f248]/30 p-1.5 bg-[#0e0e0e]">
            <div className="w-full h-full rounded-full overflow-hidden">
              <img
                className="w-full h-full object-cover grayscale-[0.2]"
                src={avatarSrc || getAvatarUrl(USER_ID)}
                alt={formData.fullName}
              />
            </div>
          </div>

          {/* Edit / Close button */}
          <button
            onClick={onPenClick}
            className={`absolute bottom-1 right-1 p-2 rounded-full shadow-xl active:scale-90 transition-all duration-200 ${
              isEditing
                ? 'bg-white text-[#161f00] ring-2 ring-[#c7f248]'
                : 'bg-[#c7f248] text-[#161f00]'
            }`}
          >
            <Icon name={isEditing ? 'close' : 'edit'} className="text-[14px]" fill={1} />
          </button>

          {/* Camera icon — only in edit mode */}
          {isEditing && (
            <button
              onClick={onOpenAvatarPicker}
              className="absolute top-1 right-1 p-1.5 rounded-full bg-[#0e0e0e] border border-white/10 shadow-xl hover:border-[#c7f248]/50 hover:bg-[#1a1a1a] active:scale-90 transition-all duration-200"
              title="Change avatar"
            >
              <Icon name="photo_camera" className="text-white/50 hover:text-[#c7f248] text-[13px] transition-colors" />
            </button>
          )}
        </div>

        <h2 className="text-2xl font-['Manrope'] font-bold text-white">
          {formData.fullName || 'New Athlete'}
        </h2>
        <p className="text-[#c7f248] text-[10px] font-bold uppercase tracking-[0.25em] mt-1.5">
          Elite Tier Member
        </p>

        {isEditing && (
          <div className="flex flex-col items-center gap-2 mt-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#c7f248] bg-[#c7f248]/10 px-3 py-1 rounded-full border border-[#c7f248]/20 animate-pulse">
              Edit Mode Active
            </span>
            <button
              onClick={onOpenAvatarPicker}
              className="text-[9px] font-bold uppercase tracking-widest text-white/30 hover:text-[#c7f248] transition-colors flex items-center gap-1.5"
            >
              <Icon name="photo_camera" className="text-[11px]" />
              Change Avatar
            </button>
          </div>
        )}

        {pendingAvatar && (
          <span className="mt-2 text-[9px] font-bold uppercase tracking-widest text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            ★ New avatar pending save
          </span>
        )}

        {/* Stats */}
        <div className="mt-8 w-full grid grid-cols-2 gap-4">
          <div className="bg-[#0e0e0e] p-4 rounded-xl border border-white/[0.03]">
            <span className="block text-[9px] text-white/20 uppercase tracking-widest mb-1">Blood Type</span>
            <span className="text-lg font-bold font-['Manrope']">A- Negative</span>
          </div>
          <div className="bg-[#0e0e0e] p-4 rounded-xl border border-white/[0.03]">
            <span className="block text-[9px] text-white/20 uppercase tracking-widest mb-1">VO2 Max</span>
            <span className="text-lg font-bold font-['Manrope'] text-[#c7f248]">58.4</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AvatarCard;