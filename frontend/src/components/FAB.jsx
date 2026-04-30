import { useState } from 'react';

const FAB = ({ onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    calories: '',
    steps: '',
    minutes: '',
    water: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setIsOpen(false);
    setFormData({ calories: '', steps: '', minutes: '', water: '' });
  };

  return (
    <>
      {/* The Actual Plus Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-[#c7f248] rounded-full shadow-lg shadow-[#c7f248]/20 flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-50"
      >
        <span className="material-symbols-outlined text-[#131313] text-[32px] font-bold">add</span>
      </button>

      {/* Dark Theme Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Modal Container: Added max-height and overflow for small screens */}
          <div className="bg-[#1c1b1b] border border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[28px] p-6 md:p-8 shadow-2xl relative custom-scrollbar">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 md:mb-8 sticky top-0 bg-[#1c1b1b] z-10 pb-2">
              <div>
                <h2 className="text-xl font-bold text-[#e5e2e1]">Log Activity</h2>
                <p className="text-[10px] md:text-[11px] text-[#555] uppercase tracking-wider mt-1">Daily Biometric Entry</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-[#555] hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              
              {/* Calories Input */}
              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-[#555] mb-2 block tracking-widest ml-1">Calories Burned</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#555] group-focus-within:text-[#c7f248] transition-colors">
                    local_fire_department
                  </span>
                  <input 
                    type="number" 
                    required
                    placeholder="e.g. 500"
                    className="w-full bg-[#131313] border border-white/5 rounded-2xl py-3.5 md:py-4 pl-12 pr-4 text-white focus:border-[#c7f248]/50 focus:bg-[#151515] outline-none transition-all placeholder:text-[#333]"
                    value={formData.calories}
                    onChange={(e) => setFormData({...formData, calories: e.target.value})}
                  />
                </div>
              </div>

              {/* Steps & Minutes Row */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="relative">
                  <label className="text-[10px] uppercase font-bold text-[#555] mb-2 block tracking-widest ml-1">Steps</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-[#555] group-focus-within:text-[#c7f248] transition-colors text-[18px] md:text-[20px]">
                      footprint
                    </span>
                    <input 
                      type="number" 
                      placeholder="10000"
                      className="w-full bg-[#131313] border border-white/5 rounded-2xl py-3.5 md:py-4 pl-10 md:pl-11 pr-4 text-white focus:border-[#c7f248]/50 outline-none transition-all placeholder:text-[#333] text-sm md:text-base"
                      value={formData.steps}
                      onChange={(e) => setFormData({...formData, steps: e.target.value})}
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="text-[10px] uppercase font-bold text-[#555] mb-2 block tracking-widest ml-1">Duration</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-[#555] group-focus-within:text-[#c7f248] transition-colors text-[18px] md:text-[20px]">
                      timer
                    </span>
                    <input 
                      type="number" 
                      placeholder="Mins"
                      className="w-full bg-[#131313] border border-white/5 rounded-2xl py-3.5 md:py-4 pl-10 md:pl-11 pr-4 text-white focus:border-[#c7f248]/50 outline-none transition-all placeholder:text-[#333] text-sm md:text-base"
                      value={formData.minutes}
                      onChange={(e) => setFormData({...formData, minutes: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Water Intake */}
              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-[#555] mb-2 block tracking-widest ml-1">Water Intake (ml)</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#555] group-focus-within:text-[#c7f248] transition-colors text-[20px]">
                    water_drop
                  </span>
                  <input 
                    type="number" 
                    placeholder="e.g. 2500"
                    className="w-full bg-[#131313] border border-white/5 rounded-2xl py-3.5 md:py-4 pl-12 pr-4 text-white focus:border-[#c7f248]/50 outline-none transition-all placeholder:text-[#333]"
                    value={formData.water}
                    onChange={(e) => setFormData({...formData, water: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-[#c7f248] text-[#131313] font-bold py-4 md:py-5 rounded-2xl mt-2 md:mt-4 hover:shadow-[0_0_20px_rgba(199,242,72,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined font-bold text-[20px]">check_circle</span>
                <span className="text-sm md:text-base">Update Vitalis Dashboard</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FAB;