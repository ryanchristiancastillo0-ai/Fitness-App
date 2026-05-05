// Profile.jsx
import React from 'react';
import { Sidebar, MobileNav, Topbar } from '../../../components';
import { useProfile } from '../hooks/useProfile';
import { useAvatar } from '../hooks/useAvatar';
import AvatarPickerModal from '../components/AvatarPickerModal';
import AvatarCard        from '../components/AvatarCard';
import SecurityCard      from '../components/SecurityCard';
import PersonalInfoForm  from '../components/PersonalInfoForm';
import SuccessModal from '../components/SucessModal';

const Profile = () => {
  const {
    USER_ID,
    loading, isLoading, isSaving, isEditing, showModal, sessions,
    formData, avatarSrc, pendingAvatar,
    setShowModal, setAvatarSrc, setPendingAvatar, setIsEditing,
    handleInputChange, handlePenClick, handleDiscard, handleSave, handleLogout,
  } = useProfile();

  const {
    showAvatarPicker, setShowAvatarPicker,
    uploadPreview,
    fileInputRef,
    handleSelectPreset,
    handleFileChange,
  } = useAvatar({ setAvatarSrc, setPendingAvatar });

  // ── Sidebar expand state (local UI only) ──────────────────────────────────
  const [expanded, setExpanded] = React.useState(false);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center text-[#D1FD52]">
        Initializing Neural Profile...
      </div>
    );
  }
  if (!USER_ID) return null;

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] font-['Inter'] selection:bg-[#c7f248] selection:text-[#161f00] flex relative overflow-x-hidden">

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showModal && (
        <SuccessModal onClose={() => setShowModal(false)} />
      )}

      {showAvatarPicker && (
        <AvatarPickerModal
          avatarSrc={avatarSrc}
          uploadPreview={uploadPreview}
          fileInputRef={fileInputRef}
          onClose={() => setShowAvatarPicker(false)}
          onSelectPreset={handleSelectPreset}
          onFileChange={handleFileChange}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <Sidebar expanded={expanded} setExpanded={setExpanded} onClick={handleLogout} />

      <div className={`flex-1 flex flex-col transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${expanded ? 'md:ml-60' : 'md:ml-[72px]'}`}>

        <Topbar />

        <main className="p-6 md:p-12 max-w-[1400px] mx-auto w-full pb-32 md:pb-12 mt-7">

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-['Manrope'] font-black text-white tracking-tighter mb-2">
              Profile Configuration
            </h1>
            <p className="text-[10px] text-white/30 font-bold tracking-[0.2em] uppercase">
              Client ID: VTS-00{USER_ID}
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left column */}
            <div className="lg:col-span-4 space-y-8">
              <AvatarCard
                USER_ID={USER_ID}
                avatarSrc={avatarSrc}
                formData={formData}
                isEditing={isEditing}
                pendingAvatar={pendingAvatar}
                onPenClick={handlePenClick}
                onOpenAvatarPicker={() => setShowAvatarPicker(true)}
              />
              <SecurityCard sessions={sessions} />
            </div>

            {/* Right column */}
            <div className="lg:col-span-8 space-y-8">
              <PersonalInfoForm
                formData={formData}
                isEditing={isEditing}
                onInputChange={handleInputChange}
              />

              {/* Save / Discard row */}
              {isEditing && (
                <div className="flex justify-end gap-8 pt-6" style={{ animation: 'fadeIn 0.2s ease' }}>
                  <button
                    onClick={handleDiscard}
                    className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-white transition-colors"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-[#c7f248] text-[#161f00] px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all disabled:opacity-60 disabled:cursor-wait"
                  >
                    {isSaving ? 'Syncing...' : 'Save Configuration'}
                  </button>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden">
        <MobileNav />
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Profile;