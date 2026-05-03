import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Sidebar, MobileNav, Topbar } from '../components';
import { API_BASE_URL } from '../config/port';
import { useAuth } from '../hooks/useAuth';


// ── 4 Default avatar seeds ────────────────────────────────────────────────────
const DEFAULT_AVATARS = [
  { id: 'avatar_1', seed: 'Felix',   label: 'Atlas'   },
  { id: 'avatar_2', seed: 'Zara',    label: 'Zara'    },
  { id: 'avatar_3', seed: 'Cyborg',  label: 'Cyborg'  },
  { id: 'avatar_4', seed: 'Nova',    label: 'Nova'    },
];

const getAvatarUrl = (seed) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

const Profile = () => {
  const navigate  = useNavigate();
  const { user, loading, logout, setUser } = useAuth();
const USER_ID = user?.id || null;
  // Basta taga kuha ari ng Device


useEffect(() => {
  const fetchSessions = async () => {
    if (!USER_ID) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/security`,
        {
          credentials: 'include',
        }
      );

      if (!res.ok) throw new Error("Failed to fetch sessions");

      const data = await res.json();
      setSessions(data); // 🔥 STORE IT
    } catch (err) {
      console.error("Security fetch error:", err);
    }
  };

  fetchSessions();
}, [USER_ID]);

  // ─── Guard: redirect if not authenticated ─────────────────────────────────
  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);


  // ─── UI State ─────────────────────────────────────────────────────────────
  const [expanded,        setExpanded]        = useState(false);
  const [isEditing,       setIsEditing]       = useState(false);
  const [isLoading,       setIsLoading]       = useState(true);
  const [isSaving,        setIsSaving]        = useState(false);
  const [showModal,       setShowModal]       = useState(false);
  const [showAvatarPicker,setShowAvatarPicker]= useState(false);
  
  // ─── Avatar State ─────────────────────────────────────────────────────────
  // avatarSrc = the full URL currently displayed
  // pendingAvatar = { type: 'preset'|'upload', value: url } — not yet saved
  const [avatarSrc,    setAvatarSrc]    = useState('');
  const [pendingAvatar,setPendingAvatar]= useState(null);
  const [uploadPreview,setUploadPreview]= useState(null); // base64 preview
  const fileInputRef = useRef(null);
  const [sessions, setSessions] = useState([]);

  // ─── Form State ───────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    fullName: '',
    email:    '',
    contact:  '',
    bio:      ''
  });
  const [savedData, setSavedData] = useState({ ...formData });

  // ─── Preferences State ────────────────────────────────────────────────────

  // ─── Fetch profile from backend ───────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      if (!USER_ID) {
        if (!loading) setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile/${USER_ID}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const dbData = await res.json();
          const mapped = {
            fullName: dbData.fullName || user?.name  || '',
            email:    dbData.email    || user?.email || '',
            contact:  dbData.contact  || '',
            bio:      dbData.bio      || user?.fitness_goal || ''
          };
          setFormData(mapped);
          setSavedData(mapped);

          // Set avatar from DB, fallback to dicebear seed
          const src = dbData.avatar_url || getAvatarUrl(USER_ID);
          setAvatarSrc(src);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [USER_ID]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleInputChange = (e, field) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const togglePreference = (id) => {
    setPreferences(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const handlePenClick = () => {
    if (isEditing) {
      setFormData({ ...savedData });
      setPendingAvatar(null);
      setUploadPreview(null);
      setAvatarSrc(user?.avatar_url || getAvatarUrl(USER_ID));
      setIsEditing(false);
      setShowAvatarPicker(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Discard unsaved changes?')) {
      setFormData({ ...savedData });
      setPendingAvatar(null);
      setUploadPreview(null);
      setAvatarSrc(user?.avatar_url || getAvatarUrl(USER_ID));
      setIsEditing(false);
      setShowAvatarPicker(false);
    }
  };

  // ── Avatar picker handlers ─────────────────────────────────────────────────
  const handleSelectPreset = (seed) => {
    const url = getAvatarUrl(seed);
    setPendingAvatar({ type: 'preset', value: url });
    setUploadPreview(null);
    setAvatarSrc(url);
    setShowAvatarPicker(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setUploadPreview(base64);
      setPendingAvatar({ type: 'upload', value: base64 });
      setAvatarSrc(base64);
      setShowAvatarPicker(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!USER_ID) return;
    setIsSaving(true);
    try {
      // Build body — include avatar if changed
      const body = {
        fullName: formData.fullName,
        contact:  formData.contact,
        bio:      formData.bio,
      };

      if (pendingAvatar) {
        if (pendingAvatar.type === 'preset') {
          body.avatar_url = pendingAvatar.value;
        } else if (pendingAvatar.type === 'upload') {
          // Send base64; backend stores it (or swap for multipart if you prefer)
          body.avatar_url = pendingAvatar.value;
        }
      }

      const res = await fetch(`${API_BASE_URL}/api/profile/update`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSavedData({ ...formData });
        setPendingAvatar(null);
        setIsEditing(false);
        setShowAvatarPicker(false);
        setUser(prev => ({
          ...prev,
          name:       formData.fullName,
          avatar_url: body.avatar_url || prev.avatar_url,
        }));
        setShowModal(true);
        setTimeout(() => setShowModal(false), 3000);
      } else {
        alert('Sync Failed: Server Error');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Sync Failed: Check Connection');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const inputClass = (editable) =>
    `bg-transparent border-0 border-b py-2 font-medium transition-all outline-none w-full ${
      editable
        ? 'border-[#c7f248] text-white focus:border-[#c7f248] focus:ring-0 cursor-text'
        : 'border-white/[0.08] text-white/60 cursor-default select-none'
    }`;

  // ─── Guards ───────────────────────────────────────────────────────────────
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

      {/* ── SUCCESS MODAL ──────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="bg-[#141414] border border-[#c7f248]/30 p-8 rounded-2xl shadow-2xl relative z-10 max-w-sm w-full text-center transform animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-[#c7f248]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="check" className="text-[#c7f248] text-3xl" />
            </div>
            <h3 className="text-xl font-['Manrope'] font-black text-white mb-2 uppercase tracking-tighter">Sync Successful</h3>
            <p className="text-white/40 text-xs font-medium leading-relaxed">Your neural profile has been securely updated within the Clinical Vault.</p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-8 w-full py-3 bg-[#c7f248] text-[#161f00] text-[10px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 transition-all"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* ── AVATAR PICKER MODAL ────────────────────────────────────────────── */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowAvatarPicker(false)}
          />
          <div className="bg-[#141414] border border-white/[0.08] p-8 rounded-2xl shadow-2xl relative z-10 max-w-sm w-full"
               style={{ animation: 'fadeIn 0.2s ease' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-['Manrope'] font-black text-white uppercase tracking-tighter">Choose Avatar</h3>
              <button onClick={() => setShowAvatarPicker(false)}>
                <Icon name="close" className="text-white/30 hover:text-white transition-colors text-lg" />
              </button>
            </div>

            {/* Default avatar grid */}
            <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold mb-4">Default Characters</p>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {DEFAULT_AVATARS.map(av => {
                const url = getAvatarUrl(av.seed);
                const isActive = avatarSrc === url;
                return (
                  <button
                    key={av.id}
                    onClick={() => handleSelectPreset(av.seed)}
                    className={`flex flex-col items-center gap-1.5 group`}
                  >
                    <div className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${
                      isActive ? 'border-[#c7f248] shadow-[0_0_12px_#c7f24840]' : 'border-white/10 hover:border-[#c7f248]/50'
                    }`}>
                      <img src={url} alt={av.label} className="w-full h-full object-cover" />
                    </div>
                    <span className={`text-[8px] uppercase tracking-widest font-bold transition-colors ${
                      isActive ? 'text-[#c7f248]' : 'text-white/30 group-hover:text-white/60'
                    }`}>{av.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Upload custom */}
            <div className="border-t border-white/[0.06] pt-5">
              <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold mb-4">Custom Upload</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 border border-dashed border-white/20 hover:border-[#c7f248]/50 rounded-xl flex items-center justify-center gap-3 transition-all group"
              >
                <Icon name="upload" className="text-white/30 group-hover:text-[#c7f248] transition-colors text-lg" />
                <span className="text-[10px] font-bold text-white/30 group-hover:text-white/60 uppercase tracking-widest transition-colors">
                  Upload Photo
                </span>
              </button>
              {uploadPreview && (
                <div className="mt-4 flex items-center gap-3 bg-[#0e0e0e] p-3 rounded-xl border border-[#c7f248]/20">
                  <img src={uploadPreview} alt="Preview" className="w-10 h-10 rounded-full object-cover border border-[#c7f248]/40" />
                  <span className="text-[10px] text-[#c7f248] font-bold uppercase tracking-widest">Custom photo selected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
      <Sidebar expanded={expanded} setExpanded={setExpanded} onClick={handleLogout} />

      <div className={`flex-1 flex flex-col transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${expanded ? 'md:ml-60' : 'md:ml-[72px]'}`}>

        {/* ── TOPBAR ───────────────────────────────────────────────────────── */}
      <Topbar/>

        {/* ── MAIN ─────────────────────────────────────────────────────────── */}
        <main className="p-6 md:p-12 max-w-[1400px] mx-auto w-full pb-32 md:pb-12 mt-7">
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-['Manrope'] font-black text-white tracking-tighter mb-2">
              Profile Configuration
            </h1>
            <p className="text-[10px] text-white/30 font-bold tracking-[0.2em] uppercase">
              Client ID: VTS-00{USER_ID}
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
            <div className="lg:col-span-4 space-y-8">

              {/* Avatar card */}
              <section className="bg-[#141414] p-8 rounded-2xl border-l-2 border-[#c7f248]/30 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c7f248]/5 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="flex flex-col items-center text-center">
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
                      onClick={handlePenClick}
                      className={`absolute bottom-1 right-1 p-2 rounded-full shadow-xl active:scale-90 transition-all duration-200 ${
                        isEditing ? 'bg-white text-[#161f00] ring-2 ring-[#c7f248]' : 'bg-[#c7f248] text-[#161f00]'
                      }`}
                    >
                      <Icon name={isEditing ? 'close' : 'edit'} className="text-[14px]" fill={1} />
                    </button>

                    {/* Camera icon — only in edit mode */}
                    {isEditing && (
                      <button
                        onClick={() => setShowAvatarPicker(true)}
                        className="absolute top-1 right-1 p-1.5 rounded-full bg-[#0e0e0e] border border-white/10 shadow-xl hover:border-[#c7f248]/50 hover:bg-[#1a1a1a] active:scale-90 transition-all duration-200"
                        title="Change avatar"
                      >
                        <Icon name="photo_camera" className="text-white/50 hover:text-[#c7f248] text-[13px] transition-colors" />
                      </button>
                    )}
                  </div>

                  <h2 className="text-2xl font-['Manrope'] font-bold text-white">{formData.fullName || 'New Athlete'}</h2>
                  <p className="text-[#c7f248] text-[10px] font-bold uppercase tracking-[0.25em] mt-1.5">Elite Tier Member</p>

                  {isEditing && (
                    <div className="flex flex-col items-center gap-2 mt-3">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#c7f248] bg-[#c7f248]/10 px-3 py-1 rounded-full border border-[#c7f248]/20 animate-pulse">
                        Edit Mode Active
                      </span>
                      <button
                        onClick={() => setShowAvatarPicker(true)}
                        className="text-[9px] font-bold uppercase tracking-widest text-white/30 hover:text-[#c7f248] transition-colors flex items-center gap-1.5"
                      >
                        <Icon name="photo_camera" className="text-[11px]" />
                        Change Avatar
                      </button>
                    </div>
                  )}

                  {/* Pending avatar badge */}
                  {pendingAvatar && (
                    <span className="mt-2 text-[9px] font-bold uppercase tracking-widest text-white/50 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                      ★ New avatar pending save
                    </span>
                  )}

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

              {/* Security card */}
              <section className="bg-[#141414] p-8 rounded-2xl border border-white/[0.04]">
  <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-6">
    Security Access
  </h3>

  <div className="space-y-4">
    {sessions.length === 0 ? (
      <p className="text-white/30 text-[10px]">No sessions found</p>
    ) : (
      sessions.map((session) => (
        <div key={session.id} className="flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <Icon name="laptop_mac" className="text-white/20" />
            
            <div className="text-xs">
              <p className="text-white font-semibold">
                {session.os} • {session.location}
              </p>
              <p className="text-white/30 text-[10px]">
                {session.is_current ? "Active now" : session.last_active}
              </p>
            </div>
          </div>

          {session.is_current && (
            <span className="text-[9px] text-[#c7f248] font-bold bg-[#c7f248]/10 px-2 py-0.5 rounded uppercase">
              Current
            </span>
          )}
        </div>
      ))
    )}
  </div>
</section>
            </div>

            {/* ── RIGHT COLUMN ─────────────────────────────────────────────── */}
            <div className="lg:col-span-8 space-y-8">

              {/* Personal Information form */}
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
                      onChange={e => handleInputChange(e, 'fullName')}
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
                      onChange={e => handleInputChange(e, 'contact')}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-2 mt-4">
                    <label className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Medical Biography</label>
                    <textarea
                      className={inputClass(isEditing)}
                      rows="3"
                      value={formData.bio}
                      onChange={e => handleInputChange(e, 'bio')}
                      readOnly={!isEditing}
                    />
                  </div>
                </div>
              </section>

              {/* Preferences + Subscription */}
       

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

      {/* ── MOBILE NAV ───────────────────────────────────────────────────────── */}
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