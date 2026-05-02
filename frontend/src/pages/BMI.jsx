import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, Topbar, MobileNav, Icon } from '../components';
import { API_BASE_URL } from '../config/port';
import { useAuth } from '../hooks/useAuth';
const BMI = () => {
  const navigate = useNavigate();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

const { user, loading, logout } = useAuth();
const USER_ID = user?.id;

  const [weight,       setWeight]       = useState('');
  const [height,       setHeight]       = useState('');
  const [age,          setAge]          = useState('');
  const [gender,       setGender]       = useState('other');
  const [bmi,          setBmi]          = useState(null);
  const [category,     setCategory]     = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAnalyzing,  setIsAnalyzing]  = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    if (!USER_ID) navigate('/login');
  }, [USER_ID, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const calculateBMI = async () => {
    if (!weight || !height) {
      setError('Please enter both weight and height.');
      return;
    }
    setError('');
    setIsAnalyzing(true);
    setAiSuggestion('');

    const heightM  = parseFloat(height) / 100;
    const bmiValue = parseFloat((parseFloat(weight) / (heightM * heightM)).toFixed(1));
    let cat = '';
    if (bmiValue < 18.5)    cat = 'Underweight';
    else if (bmiValue < 25) cat = 'Healthy Weight';
    else if (bmiValue < 30) cat = 'Overweight';
    else                     cat = 'Obese';
    setBmi(bmiValue);
    setCategory(cat);

    try {
      const res = await fetch(`${API_BASE_URL}/api/bmi/${USER_ID}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight_kg: parseFloat(weight),
          height_cm: parseFloat(height),
          age:       age    || null,
          gender:    gender || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save BMI');
      if (data.aiSuggestion) setAiSuggestion(data.aiSuggestion);

    } catch (err) {
      console.error('[BMI] Error:', err.message);
      setAiSuggestion(
        'Clinical Engine Offline: Focus on high-density nutrition and maintaining a consistent activity log to optimize your body composition.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // All categories use green or a darker green — no orange, no blue, no red
  const categoryColor = {
    'Underweight':    '#86efac', // light green
    'Healthy Weight': '#D1FD52', // brand green
    'Overweight':     '#4ade80', // medium green
    'Obese':          '#166534', // dark green
  };
  const badgeColor = categoryColor[category] || '#D1FD52';

  const inputCls = "w-full bg-black/40 border border-[#D1FD52]/10 rounded-2xl p-4 text-sm outline-none focus:border-[#D1FD52]/50 transition-all text-[#e5e2e1] placeholder-white/20";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e2e1] font-[Inter,sans-serif]">
      <div className="hidden md:block">
        <Sidebar
          onClick={handleLogout}
          expanded={sidebarExpanded}
          setExpanded={setSidebarExpanded}
        />
      </div>
      <Topbar sidebarExpanded={sidebarExpanded} userId={USER_ID} />

      <main className={`pt-[80px] pb-24 px-4 md:px-6 transition-all duration-400
        ${sidebarExpanded ? 'md:ml-[240px]' : 'md:ml-[72px]'}`}>

        <div className="max-w-[1100px] mx-auto">

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
              Vitals <span className="text-[#D1FD52]">Intelligence</span>
            </h1>
            <p className="text-[#D1FD52]/40 text-xs font-bold uppercase tracking-widest mt-2">
              Clinical Body Composition Analysis
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ── Input Form ── */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-black border border-[#D1FD52]/10 rounded-[2rem] p-6">
                <h2 className="text-[#D1FD52] font-black uppercase text-[10px] tracking-[0.25em] mb-6">
                  Metrics Input
                </h2>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-[#D1FD52]/40 font-bold mb-2 block">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="0"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-[#D1FD52]/40 font-bold mb-2 block">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="0"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-[#D1FD52]/40 font-bold mb-2 block">
                      Age (Optional)
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Enter age"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-[#D1FD52]/40 font-bold mb-2 block">
                      Gender (For Accuracy)
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-black border border-[#D1FD52]/10 rounded-2xl p-4 text-sm outline-none focus:border-[#D1FD52]/50 text-white appearance-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Prefer not to say</option>
                    </select>
                  </div>

                  {error && (
                    <p className="text-[#D1FD52] text-xs font-semibold">{error}</p>
                  )}

                  <button
                    onClick={calculateBMI}
                    disabled={isAnalyzing}
                    className="w-full py-4 bg-[#D1FD52] text-black font-black uppercase text-[11px] tracking-widest rounded-2xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Process Biometrics'}
                  </button>
                </div>
              </div>

              {/* BMI Scale */}
              <div className="bg-black border border-[#D1FD52]/10 rounded-[2rem] p-5">
                <h3 className="text-[#D1FD52] font-black uppercase text-[10px] tracking-[0.25em] mb-4">
                  BMI Scale
                </h3>
                <div className="space-y-2">
                  {[
                    { label: 'Underweight', range: '< 18.5',      color: '#86efac' },
                    { label: 'Healthy',     range: '18.5 – 24.9', color: '#D1FD52' },
                    { label: 'Overweight',  range: '25 – 29.9',   color: '#4ade80' },
                    { label: 'Obese',       range: '≥ 30',        color: '#166534' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                        <span className="text-xs text-white/60">{item.label}</span>
                      </div>
                      <span className="text-xs text-[#D1FD52]/30 font-mono">{item.range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Results ── */}
            <div className="lg:col-span-8 flex flex-col gap-6">

              {/* BMI Big Card */}
              <div className="bg-black border border-[#D1FD52]/10 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
                {/* Subtle green glow behind the number */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: bmi
                      ? `radial-gradient(ellipse at 30% 50%, ${badgeColor}08 0%, transparent 70%)`
                      : 'none',
                  }}
                />

                <div className="relative z-10">
                  <p className="text-[#D1FD52] font-black uppercase text-[11px] tracking-[0.4em] mb-2">
                    Calculated BMI
                  </p>
                  <h3
                    className="text-8xl md:text-9xl font-black italic tracking-tighter leading-none transition-all duration-500"
                    style={{ color: bmi ? badgeColor : '#e5e2e1' }}
                  >
                    {bmi || '—'}
                  </h3>
                  <div className="flex items-center gap-2 mt-4">
                    <span
                      className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500"
                      style={{
                        background: bmi ? `${badgeColor}15` : 'rgba(255,255,255,0.04)',
                        color:      bmi ? badgeColor         : 'rgba(255,255,255,0.2)',
                        border:     `1px solid ${bmi ? badgeColor + '30' : 'transparent'}`,
                      }}
                    >
                      {category || 'Awaiting Metrics'}
                    </span>
                  </div>
                </div>

                <div className="mt-8 md:mt-0 relative">
                  <div className="w-40 h-40 border-[12px] border-[#D1FD52]/5 rounded-full flex items-center justify-center relative">
                    <div
                      className="w-32 h-32 border-[12px] rounded-full transition-all duration-500"
                      style={{
                        borderColor: bmi ? `${badgeColor}30` : 'rgba(209,253,82,0.08)',
                        animation:   isAnalyzing ? 'pulse 1.5s infinite' : 'none',
                      }}
                    />
                    <Icon
                      name="monitoring"
                      className="absolute text-4xl"
                      style={{ color: bmi ? `${badgeColor}80` : 'rgba(209,253,82,0.15)' }}
                    />
                  </div>
                </div>
              </div>

              {/* AI Insight Card */}
              <div className="bg-black border border-[#D1FD52]/20 rounded-[2rem] p-8 relative min-h-[160px]">
                {/* Top-left accent bar */}
                <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-[#D1FD52]/60 via-[#D1FD52]/20 to-transparent rounded-full" />

                {isAnalyzing && (
                  <div className="absolute top-6 right-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#D1FD52] rounded-full animate-ping" />
                    <span className="text-[9px] font-black text-[#D1FD52] uppercase tracking-[0.2em]">
                      Clinical Analysis...
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#D1FD52] rounded-lg">
                    <Icon name="neurology" className="text-black text-xl" />
                  </div>
                  <h3 className="font-black uppercase text-sm tracking-[0.15em] text-[#D1FD52]">
                    Vitalis AI Recommendation
                  </h3>
                </div>

                <div className="text-lg font-medium leading-relaxed italic">
                  {isAnalyzing ? (
                    <span className="text-[#D1FD52]/30 animate-pulse">
                      Processing your biometrics...
                    </span>
                  ) : aiSuggestion ? (
                    <span className="text-white/80">{`"${aiSuggestion}"`}</span>
                  ) : (
                    <span className="text-white/15">
                      Please process your metrics to receive clinical insights...
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <div className="md:hidden"><MobileNav /></div>
    </div>
  );
};

export default BMI;