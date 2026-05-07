import React, { useState } from 'react';
import { useLogin } from '../hooks/useLogin';

const Login = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [focused,  setFocused]  = useState('');

  const { error, loading, handleSubmit, loginWithGoogle } = useLogin();

  return (
    <div className="relative min-h-screen w-full bg-[#0e0e0e] font-['DM_Sans'] text-[#e5e2e1] overflow-hidden flex items-center justify-center">
      {/* Layered Backgrounds */}
      <div className="fixed inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1800&q=80&auto=format&fit=crop')] bg-cover bg-[center_30%] brightness-[0.28] saturate-[0.7]" />
      <div className="vitalis-vignette fixed inset-0 z-[1]" />
      <div className="vitalis-grid fixed inset-0 z-[2]" />

      <div className="relative z-10 grid w-full min-h-screen lg:grid-cols-[1fr_480px]">

        {/* Left Hero Panel */}
        <div className="hidden lg:flex flex-col justify-center p-14 gap-4">
          <span className="text-[11px] font-semibold tracking-[0.35em] uppercase text-[#c7f248] opacity-80">
            Vitalis Performance OS
          </span>
          <h1 className="font-['Bebas_Neue'] text-[clamp(56px,6vw,88px)] leading-[0.95] tracking-wider">
            TRAIN<br />
            HARDER.<br />
            <span className="text-[#c7f248]">RECOVER</span><br />
            SMARTER.
          </h1>
          <p className="text-[13px] text-[#e5e2e1]/45 max-w-[320px] leading-relaxed font-light mt-1">
            AI-powered biometric tracking that adapts to your body in real time. Every rep, every rest, optimized.
          </p>

          <div className="flex gap-8 mt-6 pt-6 border-t border-white/10">
            <div className="flex flex-col">
              <span className="font-['Bebas_Neue'] text-3xl text-[#c7f248] leading-none">12K+</span>
              <span className="text-[10px] tracking-widest uppercase text-white/30">Athletes</span>
            </div>
            <div className="flex flex-col">
              <span className="font-['Bebas_Neue'] text-3xl text-[#c7f248] leading-none">98%</span>
              <span className="text-[10px] tracking-widest uppercase text-white/30">Recovery</span>
            </div>
          </div>
        </div>

        {/* Right Glass Panel */}
        <div className="flex items-center justify-center p-8">
          <div className="vitalis-card-animate relative w-full max-w-[400px] bg-[#121210]/65 backdrop-blur-[32px] saturate-[140%] border border-[#c7f248]/10 rounded-[20px] p-10 shadow-[0_32px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]">

            <div className="vitalis-scan-bar" />

            {/* Logo */}
            <div className="flex items-center gap-3 mb-9">
              <div className="w-9 h-9 bg-[#c7f248] rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-none stroke-[#161f00] stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
                  <path d="M3 12h3l3-8 4 16 3-10 2 2h3" />
                </svg>
              </div>
              <span className="font-['Bebas_Neue'] text-[22px] tracking-[0.12em]">VITALIS</span>
            </div>

            <h2 className="font-['Bebas_Neue'] text-[32px] tracking-wider leading-none mb-1.5">ACCESS PORTAL</h2>
            <p className="text-xs text-[#c4c9b0]/55 tracking-wide mb-8">Enter credentials to synchronize biometrics.</p>

            <form onSubmit={(e) => handleSubmit(e, { email, password })} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-[10px] font-semibold tracking-widest uppercase p-2.5 text-center">
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="relative">
                <label className={`block text-[10px] font-semibold tracking-[0.25em] uppercase mb-2 transition-colors ${focused === 'email' ? 'text-[#c7f248]' : 'text-white/50'}`}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-sm p-3.5 outline-none transition-all focus:border-[#c7f248]/50 focus:bg-[#c7f248]/5 focus:ring-4 focus:ring-[#c7f248]/10 placeholder:text-white/10"
                  placeholder="athlete@vitalis.io"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <label className={`block text-[10px] font-semibold tracking-[0.25em] uppercase mb-2 transition-colors ${focused === 'password' ? 'text-[#c7f248]' : 'text-white/50'}`}>
                  Password
                </label>
                <input
                  type="password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-sm p-3.5 outline-none transition-all focus:border-[#c7f248]/50 focus:bg-[#c7f248]/5 focus:ring-4 focus:ring-[#c7f248]/10 placeholder:text-white/10"
                  placeholder="••••••••••••"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                />
              </div>

              <div className="flex justify-end -mt-3">
                <a href="/reset-password" className="text-[10px] font-semibold tracking-widest uppercase text-[#acd52b]/70 hover:text-[#c7f248] transition-colors">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full bg-[#c7f248] text-[#161f00] font-bold text-[11px] tracking-[0.25em] uppercase p-4 rounded-xl shadow-[0_4px_24px_rgba(199,242,72,0.2)] hover:bg-[#acd52b] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex items-center justify-center gap-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                {loading ? (
                  <><div className="vitalis-spinner" /> Processing...</>
                ) : (
                  <>Initialize Session <span className="text-lg">→</span></>
                )}
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-[1px] bg-white/5" />
                <span className="text-[10px] tracking-[0.3em] uppercase text-white/20">or</span>
                <div className="flex-1 h-[1px] bg-white/5" />
              </div>

              <button
                type="button"
                onClick={() => loginWithGoogle()}
                className="w-full bg-white/5 border border-white/10 rounded-xl text-[11px] font-semibold tracking-widest uppercase p-3.5 flex items-center justify-center gap-2.5 hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </form>

            <div className="mt-7 text-center text-xs text-[#c4c9b0]/45">
              Don't have an account?
              <a href="/register" className="text-[#acd52b] font-semibold ml-1 hover:text-[#c7f248] transition-colors">Register</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;