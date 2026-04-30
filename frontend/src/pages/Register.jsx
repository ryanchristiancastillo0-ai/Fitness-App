import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/port';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    goal: 'Peak Metabolic Efficiency',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Modal state

  const filledFields = [formData.name, formData.email, formData.password].filter(Boolean).length;
  const progressPct = Math.round((filledFields / 3) * 100);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          fitness_goal: formData.goal,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Initialization failed. System conflict.');
      
      if (data.success) {
        setShowSuccessModal(true); // Trigger modal instead of immediate navigate
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goals = [
    'Peak Metabolic Efficiency',
    'Muscle Hypertrophy',
    'Fat Loss Protocol',
    'Endurance & VO2 Max',
    'Athletic Performance',
    'Recovery Optimization',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center font-['DM_Sans',sans-serif] text-[#e5e2e1] overflow-hidden relative bg-[#0e0e0e]">
      <div className="bg-image fixed inset-0 z-0" />
      <div className="bg-vignette fixed inset-0 z-10" />
      <div className="bg-grid fixed inset-0 z-20" />

      {/* ── SUCCESS MODAL ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" />
          
          {/* Modal Card */}
          <div className="relative glass-card w-full max-w-[400px] border border-[#c7f248]/20 rounded-[24px] p-8 text-center overflow-hidden animate-in zoom-in-95 duration-300 shadow-[0_0_50px_rgba(199,242,72,0.15)]">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c7f248] to-transparent shadow-[0_0_15px_rgba(199,242,72,0.5)]" />
            
            {/* Success Icon */}
            <div className="w-20 h-20 bg-[#c7f248]/10 border border-[#c7f248]/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[inset_0_0_20px_rgba(199,242,72,0.1)]">
              <svg className="w-10 h-10 text-[#c7f248]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="font-['Bebas_Neue',sans-serif] text-3xl tracking-wider text-[#e5e2e1] mb-2 uppercase">Identity Encrypted</h2>
            <p className="text-[12px] text-[#c4c9b0]/60 tracking-wider mb-8 leading-relaxed uppercase">
              Your clinical athlete profile has been successfully initialized into the Vitalis Core.
            </p>

            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-[#c7f248] text-[#161f00] font-bold text-[11px] tracking-[0.2em] uppercase p-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:bg-[#d9ff66] hover:shadow-[0_0_20px_rgba(199,242,72,0.3)] active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
              </svg>
              Go Back to Login
            </button>
          </div>
        </div>
      )}

      <div className="relative z-30 w-full min-h-screen grid grid-cols-1 max-[960px]:grid-cols-1 min-[960px]:grid-cols-[1fr_500px]">

        {/* ── Left hero ── */}
        <div className="hidden min-[960px]:flex flex-col justify-center p-[64px_56px] gap-4">
          <span className="text-[11px] font-semibold tracking-[0.35em] uppercase text-[#c7f248] opacity-80">Vitalis Performance OS</span>
          <h1 className="font-['Bebas_Neue',sans-serif] text-[clamp(52px,5.5vw,82px)] leading-[0.95] text-[#e5e2e1] tracking-[0.02em]">
            BUILD<br />
            YOUR<br />
            <span className="text-[#c7f248]">ATHLETE</span><br />
            PROFILE.
          </h1>
          <p className="text-[13px] text-white/40 max-w-[320px] leading-[1.7] font-light mt-1">
            Choose your goal, sync your biometrics, and let the AI engine build a program around your biology.
          </p>
          <div className="flex flex-wrap gap-2 mt-5 pt-6 border-t border-white/5">
            {goals.map(g => (
              <span key={g} className="text-[10px] font-semibold tracking-[0.12em] uppercase py-[5px] px-3 rounded-full border border-[#c7f248]/15 text-[#c7f248]/50 bg-[#c7f248]/[0.04]">{g}</span>
            ))}
          </div>
        </div>

        {/* ── Right glass card ── */}
        <div className="flex items-center justify-center p-[40px_32px] max-[960px]:p-[32px_20px]">
          <div className="glass-card w-full max-w-[420px] border border-[#c7f248]/12 rounded-[20px] p-[40px_38px] relative overflow-hidden">
            <div className="scan-bar absolute left-0 right-0 top-0 h-[1px] rounded-t-[20px]" />

            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-7">
              <div className="w-[34px] h-[34px] bg-[#c7f248] rounded-lg flex items-center justify-center">
                <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12h3l3-8 4 16 3-10 2 2h3" stroke="#161f00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-['Bebas_Neue',sans-serif] text-[21px] tracking-[0.12em] text-[#e5e2e1]">VITALIS</span>
            </div>

            {/* Progress */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#c4c9b0]/35">Profile Setup</span>
              <span className="font-['Bebas_Neue',sans-serif] text-[16px] text-[#c7f248] leading-none">{progressPct}%</span>
            </div>
            <div className="h-[2px] bg-white/5 rounded-full mb-8 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#acd52b] to-[#c7f248] rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_8px_rgba(199,242,72,0.4)]" style={{ width: `${progressPct}%` }} />
            </div>

            <h2 className="font-['Bebas_Neue',sans-serif] text-[28px] tracking-[0.04em] text-[#e5e2e1] mb-1">CREATE IDENTITY</h2>
            <p className="text-[12px] text-[#c4c9b0]/50 tracking-[0.04em] mb-6">Initialize your clinical athlete profile.</p>

            <form onSubmit={handleRegister}>
              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-semibold tracking-[0.1em] uppercase py-2.5 px-3.5 mb-[18px] text-center">{error}</div>}

              {/* Name */}
              <div className="relative mb-[18px]">
                <label className={`block text-[10px] font-semibold tracking-[0.25em] uppercase mb-[7px] transition-colors duration-200 ${focused === 'name' ? 'text-[#c7f248]' : 'text-[#c4c9b0]/50'}`}>Full Name</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] text-[#e5e2e1] font-['DM_Sans',sans-serif] text-[14px] p-[12px_15px] outline-none transition-all duration-200 placeholder:text-white/15 focus:border-[#c7f248]/45 focus:bg-[#c7f248]/[0.04] focus:ring-[3px] focus:ring-[#c7f248]/10 box-border"
                  type="text"
                  placeholder="Your name"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused('')}
                />
              </div>

              {/* Email */}
              <div className="relative mb-[18px]">
                <label className={`block text-[10px] font-semibold tracking-[0.25em] uppercase mb-[7px] transition-colors duration-200 ${focused === 'email' ? 'text-[#c7f248]' : 'text-[#c4c9b0]/50'}`}>Email Address</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] text-[#e5e2e1] font-['DM_Sans',sans-serif] text-[14px] p-[12px_15px] outline-none transition-all duration-200 placeholder:text-white/15 focus:border-[#c7f248]/45 focus:bg-[#c7f248]/[0.04] focus:ring-[3px] focus:ring-[#c7f248]/10 box-border"
                  type="email"
                  placeholder="athlete@vitalis.io"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                />
              </div>

              {/* Password */}
              <div className="relative mb-[18px]">
                <label className={`block text-[10px] font-semibold tracking-[0.25em] uppercase mb-[7px] transition-colors duration-200 ${focused === 'password' ? 'text-[#c7f248]' : 'text-[#c4c9b0]/50'}`}>Password</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] text-[#e5e2e1] font-['DM_Sans',sans-serif] text-[14px] p-[12px_15px] outline-none transition-all duration-200 placeholder:text-white/15 focus:border-[#c7f248]/45 focus:bg-[#c7f248]/[0.04] focus:ring-[3px] focus:ring-[#c7f248]/10 box-border"
                  type="password"
                  placeholder="••••••••••••"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                />
              </div>

              {/* Goal */}
              <div className="relative mb-[18px]">
                <label className={`block text-[10px] font-semibold tracking-[0.25em] uppercase mb-[7px] transition-colors duration-200 ${focused === 'goal' ? 'text-[#c7f248]' : 'text-[#c4c9b0]/50'}`}>Primary Goal</label>
                <select
                  className="goal-select-custom w-full bg-white/5 border border-white/10 rounded-[10px] text-[#e5e2e1] font-['DM_Sans',sans-serif] text-[13px] p-[12px_15px] outline-none cursor-pointer appearance-none transition-all duration-200 focus:border-[#c7f248]/45 focus:ring-[3px] focus:ring-[#c7f248]/10 box-border"
                  value={formData.goal}
                  onChange={e => setFormData({ ...formData, goal: e.target.value })}
                  onFocus={() => setFocused('goal')}
                  onBlur={() => setFocused('')}
                >
                  {goals.map(g => (
                    <option className="bg-[#1a1a1a] text-[#e5e2e1]" key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <button className="btn-primary w-full bg-[#c7f248] text-[#161f00] font-['DM_Sans',sans-serif] font-bold text-[11px] tracking-[0.25em] uppercase p-[15px] rounded-[10px] cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 mt-1.5 relative overflow-hidden" type="submit" disabled={loading}>
                {loading ? (
                  <><div className="spinner w-[13px] h-[13px] rounded-full animate-spin border-2 border-black border-t-transparent" /> Initializing...</>
                ) : (
                  <>Initiate Optimization <span style={{ fontSize: 15 }}>→</span></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-[12px] text-[#c4c9b0]/45">
              Already have an account?
              <Link className="text-[#acd52b] font-semibold ml-1 no-underline transition-colors duration-200 hover:text-[#c7f248]" to="/login">Sign in</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;