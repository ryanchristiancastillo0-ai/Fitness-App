import React, { useState, useEffect } from 'react';
import { Icon, Sidebar } from '../components';
import { API_BASE_URL } from '../config/port';

const Profile = () => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // New: Modal State

  // ✅ DYNAMIC USER DETECTION
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const USER_ID = storedUser?.id || storedUser?.user?.id;

  // 1. Form State (Physician Removed)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contact: '',
    bio: ''
  });

  const [savedData, setSavedData] = useState({ ...formData });

  // 2. Preferences State
  const [preferences, setPreferences] = useState([
    { id: 'dark_mode', title: 'Dark Aesthetic', desc: 'Obsidian OLED Mode', active: true },
    { id: 'bio_sync', title: 'Biometrics Sync', desc: 'Real-time telemetry', active: true },
    { id: 'privacy', title: 'Privacy Stealth', desc: 'Mask public API data', active: false }
  ]);

  useEffect(() => {
    const fetchProfile = async () => {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        setIsLoading(false);
        return;
      }

      const userData = JSON.parse(savedUser);
      const userId = userData.id;

      try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${userId}`);
        
        if (response.ok) {
          const dbData = await response.json();
          const mappedData = {
            fullName: dbData.fullName || userData.name || '',
            email:    dbData.email || userData.email || '',
            contact:  dbData.contact || '', 
            bio:      dbData.bio || userData.fitness_goal || ''
          };
          setFormData(mappedData);
          setSavedData(mappedData);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Handlers
  const handleInputChange = (e, field) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const togglePreference = (id) => {
    setPreferences(prev => prev.map(p =>
      p.id === id ? { ...p, active: !p.active } : p
    ));
  };

  const handlePenClick = () => {
    if (isEditing) {
      setFormData({ ...savedData });
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  // --- FIXED SAVE DATA TO BACKEND ---
  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/update/${USER_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          contact: formData.contact,
          bio: formData.bio
          // Physician removed as per instructions
        }),
      });

      if (response.ok) {
        setSavedData({ ...formData });
        setIsEditing(false);
        
        // Sync Local Storage
        const updatedStorage = { ...storedUser, name: formData.fullName };
        localStorage.setItem('user', JSON.stringify(updatedStorage));
        
        // Trigger Theme-Aligned Modal
        setShowModal(true);
        setTimeout(() => setShowModal(false), 3000); // Auto-hide after 3s
      } else {
        alert('Sync Failed: Server Error');
      }
    } catch (error) {
      alert('Sync Failed: Check Connection');
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Discard unsaved changes?')) {
      setFormData({ ...savedData });
      setIsEditing(false);
    }
  };

  const inputClass = (editable) =>
    `bg-transparent border-0 border-b py-2 font-medium transition-all outline-none w-full ${
      editable
        ? 'border-[#c7f248] text-white focus:border-[#c7f248] focus:ring-0 cursor-text'
        : 'border-white/[0.08] text-white/60 cursor-default select-none'
    }`;

  if (isLoading) return <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center text-[#D1FD52]">Initializing Neural Profile...</div>;

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e5e2e1] font-['Inter'] selection:bg-[#c7f248] selection:text-[#161f00] flex relative overflow-x-hidden">
      
      {/* SUCCESS MODAL - ALIGNED WITH THEME */}
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

      <Sidebar expanded={expanded} setExpanded={setExpanded} />

      <div className={`flex-1 flex flex-col transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${expanded ? 'md:ml-60' : 'md:ml-[72px]'}`}>
        <header className="sticky top-0 z-40 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-white/[0.06] h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <span className="text-lg font-black tracking-tighter text-[#D1FD52] font-['Manrope'] md:hidden uppercase">Vitalis</span>
            <nav className="hidden md:flex gap-8 text-[11px] uppercase font-bold tracking-[0.15em] font-['Manrope']">
              <a className="text-neutral-500 hover:text-[#D1FD52] transition-colors" href="#">Overview</a>
              <a className="text-neutral-500 hover:text-[#D1FD52] transition-colors" href="#">Biometrics</a>
              <a className="text-[#D1FD52]" href="#">Profile</a>
            </nav>
          </div>

          <div className="flex items-center gap-5">
            <Icon name="notifications" className="text-neutral-500 hover:text-[#D1FD52] cursor-pointer text-[20px]" />
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#c7f248]/40 bg-[#1c1b1b]">
              <img alt="User Profile" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.fullName}`} className="w-full h-full object-cover opacity-90" />
            </div>
          </div>
        </header>

        <main className="p-6 md:p-12 max-w-[1400px] mx-auto w-full pb-32 md:pb-12">
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-['Manrope'] font-black text-white tracking-tighter mb-2">Profile Configuration</h1>
            <p className="text-[10px] text-white/30 font-bold tracking-[0.2em] uppercase">Client ID: VTS-00{USER_ID || 'UNSET'}</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-8">
              <section className="bg-[#141414] p-8 rounded-2xl border-l-2 border-[#c7f248]/30 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c7f248]/5 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full border border-[#c7f248]/30 p-1.5 bg-[#0e0e0e]">
                      <div className="w-full h-full rounded-full overflow-hidden">
                        <img className="w-full h-full object-cover grayscale-[0.2]" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop" alt={formData.fullName} />
                      </div>
                    </div>
                    <button onClick={handlePenClick} className={`absolute bottom-1 right-1 p-2 rounded-full shadow-xl active:scale-90 transition-all duration-200 ${isEditing ? 'bg-white text-[#161f00] ring-2 ring-[#c7f248]' : 'bg-[#c7f248] text-[#161f00]'}`}>
                      <Icon name={isEditing ? 'close' : 'edit'} className="text-[14px]" fill={1} />
                    </button>
                  </div>
                  <h2 className="text-2xl font-['Manrope'] font-bold text-white">{formData.fullName || 'New Athlete'}</h2>
                  <p className="text-[#c7f248] text-[10px] font-bold uppercase tracking-[0.25em] mt-1.5">Elite Tier Member</p>
                  {isEditing && <span className="mt-3 text-[9px] font-bold uppercase tracking-widest text-[#c7f248] bg-[#c7f248]/10 px-3 py-1 rounded-full border border-[#c7f248]/20 animate-pulse">Edit Mode Active</span>}
                  <div className="mt-8 w-full grid grid-cols-2 gap-4">
                    <div className="bg-[#0e0e0e] p-4 rounded-xl border border-white/[0.03]"><span className="block text-[9px] text-white/20 uppercase tracking-widest mb-1">Blood Type</span><span className="text-lg font-bold font-['Manrope']">A- Negative</span></div>
                    <div className="bg-[#0e0e0e] p-4 rounded-xl border border-white/[0.03]"><span className="block text-[9px] text-white/20 uppercase tracking-widest mb-1">VO2 Max</span><span className="text-lg font-bold font-['Manrope'] text-[#c7f248]">58.4</span></div>
                  </div>
                </div>
              </section>

              <section className="bg-[#141414] p-8 rounded-2xl border border-white/[0.04]">
                <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-6">Security Access</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <Icon name="laptop_mac" className="text-white/20 group-hover:text-[#c7f248] transition-colors" />
                      <div className="text-xs"><p className="text-white font-semibold">macOS • London, UK</p><p className="text-white/30 text-[10px]">Active now</p></div>
                    </div>
                    <span className="text-[9px] text-[#c7f248] font-bold bg-[#c7f248]/10 px-2 py-0.5 rounded uppercase tracking-tighter">Current</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="lg:col-span-8 space-y-8">
              <section className="bg-[#141414] p-8 md:p-10 rounded-2xl border border-white/[0.04]">
                <h3 className="text-xl font-['Manrope'] font-bold text-white mb-10 flex items-center gap-3">
                  <Icon name="tune" className="text-[#c7f248]" />
                  Personal Information
                  <span className={`ml-auto text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${isEditing ? 'text-[#c7f248] bg-[#c7f248]/10 border-[#c7f248]/20' : 'text-white/20 bg-white/5 border-white/[0.04]'}`}>
                    {isEditing ? '✎ Editing' : '🔒 Locked'}
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                  <div className="flex flex-col gap-2 relative group">
                    <label className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Full Name</label>
                    <input className={inputClass(isEditing)} type="text" value={formData.fullName} onChange={(e) => handleInputChange(e, 'fullName')} readOnly={!isEditing} />
                  </div>
                  <div className="flex flex-col gap-2 relative group">
                    <label className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Clinical Email</label>
                    <input className={inputClass(isEditing)} type="email" value={formData.email} onChange={(e) => handleInputChange(e, 'email')} readOnly={!isEditing} />
                  </div>
                  <div className="flex flex-col gap-2 relative group md:col-span-2">
                    <label className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Emergency Contact</label>
                    <input className={inputClass(isEditing)} type="text" value={formData.contact} onChange={(e) => handleInputChange(e, 'contact')} readOnly={!isEditing} />
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-2 mt-4">
                    <label className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Medical Biography</label>
                    <textarea className={inputClass(isEditing)} rows="3" value={formData.bio} onChange={(e) => handleInputChange(e, 'bio')} readOnly={!isEditing} />
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[#141414] p-8 rounded-2xl border border-white/[0.04]">
                  <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-8">System Sync</h3>
                  <div className="space-y-8">
                    {preferences.map((pref) => (
                      <div key={pref.id} className="flex items-center justify-between group">
                        <div>
                          <p className="text-sm font-semibold text-white/90">{pref.title}</p>
                          <p className="text-[9px] text-white/20 uppercase tracking-widest">{pref.desc}</p>
                        </div>
                        <div onClick={() => togglePreference(pref.id)} className={`w-10 h-5 rounded-full relative cursor-pointer flex items-center px-1 transition-colors ${pref.active ? 'bg-[#c7f248]' : 'bg-white/10'}`}>
                          <div className={`w-3 h-3 rounded-full transition-transform ${pref.active ? 'bg-[#161f00] translate-x-5' : 'bg-white/20'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#141414] p-8 rounded-2xl border border-[#c7f248]/5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Subscription</h3>
                    <div className="flex items-end gap-3 mb-4"><span className="text-5xl font-['Manrope'] font-black text-[#c7f248]">V+</span><span className="text-xs font-bold text-white mb-2 uppercase tracking-widest">Atelier</span></div>
                    <p className="text-[11px] text-white/40 leading-relaxed mb-8">Next renewal: Dec 12, 2026.</p>
                  </div>
                  <button onClick={() => alert('Redirecting...')} className="w-full py-4 bg-[#1c1b1b] text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl border border-white/[0.04] hover:bg-[#252525] transition-colors">Manage Tier</button>
                </div>
              </section>

              {isEditing && (
                <div className="flex justify-end gap-8 pt-6 animate-[fadeIn_0.2s_ease]">
                  <button onClick={handleDiscard} className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-white transition-colors">Discard Changes</button>
                  <button onClick={handleSave} className="bg-[#c7f248] text-[#161f00] px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Save Configuration</button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;