import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar, Topbar, MobileNav, Icon } from '../../../components';

/**
 * MOCK DATA: Medical Professionals
 * All coaches are AI with distinct personalities and professions.
 */
const DOCTORS_DATA = {
  beginner: [
    { id: 1, name: "Dr. Sarah Mitchell", prof: "General Practitioner", personality: "Empathetic", avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200", age: 42, gender: "Female", experience: "15 Years", bio: "Dedicated to holistic patient care and preventative medicine." },
    { id: 2, name: "Dr. James Wilson", prof: "Family Physician", personality: "Patient", avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200", age: 55, gender: "Male", experience: "25 Years", bio: "Specializes in comprehensive healthcare for individuals and families." },
    { id: 3, name: "Dr. Elena Rodriguez", prof: "Pediatrician", personality: "Kind", avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200", age: 38, gender: "Female", experience: "10 Years", bio: "Passionate about child development and adolescent health." },
    { id: 4, name: "Dr. David Chen", prof: "Nutritionist", personality: "Practical", avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200&h=200", age: 45, gender: "Male", experience: "18 Years", bio: "Expert in dietary planning and metabolic health optimization." },
    { id: 5, name: "Dr. Lisa Park", prof: "Wellness Consultant", personality: "Gentle", avatar: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=200&h=200", age: 34, gender: "Female", experience: "8 Years", bio: "Focuses on stress management and lifestyle-based healing." },
  ],
  intermediate: [
    { id: 6, name: "Dr. Marcus Thorne", prof: "Cardiologist", personality: "Analytical", avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200", age: 50, gender: "Male", experience: "20 Years", bio: "Renowned for diagnosing complex cardiovascular conditions." },
    { id: 7, name: "Dr. Angela Voss", prof: "Dermatologist", personality: "Thorough", avatar: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=200&h=200", age: 41, gender: "Female", experience: "14 Years", bio: "Advanced expertise in clinical dermatology and skin pathology." },
    { id: 8, name: "Dr. Robert Hales", prof: "Orthopedic", personality: "Direct", avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200", age: 48, gender: "Male", experience: "19 Years", bio: "Specializes in joint reconstruction and sports injuries." },
    { id: 9, name: "Dr. Simon Lee", prof: "Endocrinologist", personality: "Meticulous", avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200&h=200", age: 53, gender: "Male", experience: "22 Years", bio: "Leading researcher in hormonal imbalances and diabetes care." },
    { id: 10, name: "Dr. Fiona Gray", prof: "Physical Therapist", personality: "Encouraging", avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200", age: 36, gender: "Female", experience: "11 Years", bio: "Dedicated to post-operative recovery and mobility enhancement." },
  ],
  advanced: [
    { id: 11, name: "Dr. Victor Von", prof: "Neurosurgeon", personality: "Intense", avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200", age: 58, gender: "Male", experience: "30 Years", bio: "Pioneer in minimally invasive brain and spinal cord surgeries." },
    { id: 12, name: "Dr. Claire Redfield", prof: "Virologist", personality: "Alert", avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200", age: 39, gender: "Female", experience: "12 Years", bio: "At the forefront of infectious disease control and immunology." },
    { id: 13, name: "Dr. Gregory House", prof: "Diagnostic Expert", personality: "Academic", avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200", age: 52, gender: "Male", experience: "24 Years", bio: "Specializes in solving rare and undiagnosed medical mysteries." },
    { id: 14, name: "Dr. Linda Hamilton", prof: "Trauma Surgeon", personality: "Steady", avatar: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=200&h=200", age: 46, gender: "Female", experience: "17 Years", bio: "Veteran of critical care and emergency surgical procedures." },
    { id: 15, name: "Dr. Arthur Dayne", prof: "Sports Medicine", personality: "Direct", avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200&h=200", age: 44, gender: "Male", experience: "16 Years", bio: "Consultant for professional athletes in peak performance recovery." },
  ]
};

// --- Sub-Component: Category Selection Card ---
const CategoryCard = ({ title, subtitle, description, onClick, color, imageUrl }) => (
  <button 
    onClick={onClick}
    className={`p-8 rounded-3xl border border-white/10 bg-white/5 hover:bg-${color}/10 hover:border-${color}/50 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-300 flex flex-col items-center justify-center gap-3 group`}
  >
    <div className={`w-24 h-24 mb-4 group-hover:scale-110 transition-transform`}>
        <img src={imageUrl} alt={title} className="w-full h-full object-cover rounded-full border-4 border-white/10 group-hover:border-white/50 transition-colors shadow-lg" />
    </div>
    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{title}</h3>
    <p className="text-xs text-white/50 text-center uppercase tracking-widest">{subtitle}</p>
    <p className="text-sm text-white/70 text-center mt-2 px-4 leading-relaxed">{description}</p>
  </button>
);

// --- Sub-Component: Doctor Profile Card ---
const DoctorCard = ({ doctor, onSelect }) => (
  <div 
    onClick={() => onSelect(doctor)}
    className="p-6 rounded-3xl border border-white/10 bg-white/5 hover:bg-[#D1FD52]/10 hover:border-[#D1FD52]/50 hover:-translate-y-2 cursor-pointer transition-all duration-300 flex flex-col items-center text-center group"
  >
    <div className="relative mb-4">
        <img src={doctor.avatar} alt={doctor.name} className="w-24 h-24 rounded-full object-cover border-4 border-white/10 group-hover:border-[#D1FD52] transition-colors" />
        <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#D1FD52] rounded-full border-4 border-[#131313]"></div>
    </div>
    <h4 className="text-lg font-bold text-white mb-1">{doctor.name}</h4>
    <p className="text-xs text-[#D1FD52] uppercase tracking-widest font-semibold mb-2">{doctor.prof}</p>
    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-white/60 italic mb-4">{doctor.personality} Manner</span>
    
    <div className="w-full border-t border-white/10 pt-4 mt-2 flex flex-col gap-2 text-left">
      <div className="flex justify-between text-[11px] text-white/70 uppercase tracking-wide">
        <span><strong className="text-white">Age:</strong> {doctor.age}</span>
        <span><strong className="text-white">Gender:</strong> {doctor.gender}</span>
      </div>
      <div className="text-[11px] text-white/70 uppercase tracking-wide">
        <strong className="text-white">Experience:</strong> {doctor.experience}
      </div>
      <p className="text-xs text-white/50 italic mt-2 leading-relaxed border-l-2 border-[#D1FD52]/50 pl-2">
        "{doctor.bio}"
      </p>
    </div>
  </div>
);

// --- Sub-Component: Chat Interface ---
const ChatInterface = ({ doctor, onShowAlert, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (doctor) {
      setMessages([{ sender: 'ai', text: `Good day. I am ${doctor.name}, your ${doctor.prof}. How are you feeling today? I'm here to provide ${doctor.personality} medical guidance.` }]);
    }
  }, [doctor]);

  const handleSend = () => {
    if (!input.trim()) {
        onShowAlert("Please type your concern first.");
        return;
    };
    
    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'ai', text: `[${doctor.name} Diagnostic]: I've received your input. Based on my clinical protocols, I recommend we monitor these symptoms closely...` }]);
    }, 800);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[650px] bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-fade-in">
      
      {/* Chat Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-white/[0.02] relative">
        <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <img src={doctor.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-[#D1FD52]/50" alt="" />
        <div>
            <span className="text-base font-bold text-white block">{doctor.name}</span>
            <span className="text-[10px] text-[#D1FD52] uppercase font-bold tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#D1FD52] rounded-full animate-pulse"></span>
                Consultation Active
            </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${m.sender === 'user' ? 'bg-[#D1FD52] text-black self-end rounded-br-none font-medium' : 'bg-white/10 text-white rounded-bl-none border border-white/5'}`}>
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-white/[0.02] border-t border-white/10 flex gap-3">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Describe your symptoms or ask a question..."
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm text-white outline-none focus:border-[#D1FD52]/50 focus:bg-white/10 transition-all"
        />
        <button onClick={handleSend} className="w-12 h-12 bg-[#D1FD52] rounded-2xl flex items-center justify-center text-black hover:bg-[#bbf033] active:scale-90 transition-all shadow-[0_0_15px_rgba(209,253,82,0.3)]">
          <Icon name="send" />
        </button>
      </div>
    </div>
  );
};

// --- Main Page Component ---
const VirtualClinic = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  
  // Layout State Management
  const [currentView, setCurrentView] = useState('categories'); // 'categories' | 'doctors' | 'chat'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Alert State
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const navigate = useNavigate();

  const triggerPopup = (msg) => {
    setAlertMessage(msg);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };

  // View Navigation Handlers
  const handleCategorySelect = (categoryKey) => {
    setSelectedCategory(categoryKey);
    setCurrentView('doctors');
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setCurrentView('chat');
    triggerPopup(`Connected to ${doctor.name}`);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCurrentView('categories');
  };

  const handleBackToDoctors = () => {
    setSelectedDoctor(null);
    setCurrentView('doctors');
  };

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-[Inter,sans-serif] relative overflow-hidden">
      
      {/* Dynamic Popup Notification */}
      <div className={`fixed top-24 right-6 z-[100] transition-all duration-500 transform ${showAlert ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        <div className="bg-[#D1FD52] text-black px-6 py-3 rounded-xl font-bold shadow-2xl flex items-center gap-3 border border-black/10">
            <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
            {alertMessage}
        </div>
      </div>

      <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />
      <Topbar sidebarExpanded={sidebarExpanded} userId={1} />

      <main className={`pt-[100px] pb-24 px-4 md:px-8 transition-all duration-400 ${sidebarExpanded ? 'md:ml-[240px]' : 'md:ml-[72px]'}`}>
        <div className="max-w-[1000px] mx-auto">
          
          {/* Dynamic Header based on view */}
          <div className="mb-10 text-center flex flex-col items-center">
            {currentView === 'categories' && (
                <>
                    <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase mb-3">
                        Virtual <span className="text-[#D1FD52]">Medical</span> Clinic
                    </h1>
                    <p className="text-white/50 text-base max-w-lg">Select a medical specialty below to view our roster of AI specialists and begin your consultation.</p>
                </>
            )}
            
            {currentView === 'doctors' && (
                <div className="w-full flex items-center justify-between">
                    <button 
                        onClick={handleBackToCategories}
                        className="flex items-center gap-2 text-white/50 hover:text-[#D1FD52] transition-colors text-sm font-bold uppercase tracking-widest"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        Back to Specialties
                    </button>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                        Select a <span className="text-[#D1FD52]">Specialist</span>
                    </h2>
                </div>
            )}
          </div>

          {/* VIEW 1: Categories / Specialties */}
          {currentView === 'categories' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
                <CategoryCard 
                    title="Primary Care" 
                    subtitle="General Practice & Wellness"
                    description="Comprehensive first-contact care focusing on everyday health, wellness checkups, and preventative medicine."
                    color="blue-400" 
                    imageUrl="https://images.unsplash.com/photo-1638202993928-7267aad84c31?auto=format&fit=crop&q=80&w=400&h=400"
                    onClick={() => handleCategorySelect('beginner')} 
                />
                <CategoryCard 
                    title="Specialists" 
                    subtitle="Cardio, Derma & Ortho"
                    description="Expert care for specific body systems, offering advanced diagnosis and targeted treatment plans."
                    color="purple-400" 
                    imageUrl="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&q=80&w=400&h=400"
                    onClick={() => handleCategorySelect('intermediate')} 
                />
                <CategoryCard 
                    title="Surgery & Tech" 
                    subtitle="Advanced Diagnostics"
                    description="High-level surgical consultations and cutting-edge medical technology for complex medical cases."
                    color="red-400" 
                    imageUrl="https://images.unsplash.com/photo-1551076805-e18690c5e525?auto=format&fit=crop&q=80&w=400&h=400"
                    onClick={() => handleCategorySelect('advanced')} 
                />
            </div>
          )}

          {/* VIEW 2: Doctor Selection Grid */}
          {currentView === 'doctors' && selectedCategory && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {DOCTORS_DATA[selectedCategory].map(doctor => (
                <DoctorCard 
                  key={doctor.id} 
                  doctor={doctor} 
                  onSelect={handleDoctorSelect} 
                />
              ))}
            </div>
          )}

          {/* VIEW 3: Active Chat Interface */}
          {currentView === 'chat' && selectedDoctor && (
            <div className="max-w-3xl mx-auto w-full">
                <ChatInterface 
                    doctor={selectedDoctor} 
                    onShowAlert={triggerPopup} 
                    onBack={handleBackToDoctors}
                />
            </div>
          )}

        </div>
      </main>

      <div className="md:hidden"><MobileNav /></div>

      {/* Basic global styles for animations (You can add these to your index.css) */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default VirtualClinic;