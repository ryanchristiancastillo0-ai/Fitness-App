import React, { useState, useEffect } from "react";
import SidebarAnalytics from "../../../components/sidebarAnalytics";
import Icon from "../../../components/Icon";
import { API_BASE_URL } from "../../../config/port";
import { AnalyticsMobileNav } from "../../../components";
import { useNavigate } from "react-router-dom";

const Log = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate()
  const userId = 1; // Replace with your auth logic

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/logs/history/${userId}`);
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        console.error("Log Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#e5e2e1] font-['Inter'] flex flex-col md:flex-row">
      {/* Sidebar - Assuming it handles its own responsiveness */}
      <SidebarAnalytics />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-20 transition-all duration-500 overflow-hidden">
        
        {/* Header Section */}
        <header className="p-5 md:p-8 border-b border-white/[0.03] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white">
              Session <span className="text-[#D1FD52]">History</span>
            </h1>
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.4em] text-white/30 mt-2 md:mt-3">
              Neural Tracking & Performance Archives
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-black text-[#D1FD52] uppercase tracking-widest block">Total Records</span>
            <span className="text-2xl md:text-3xl font-black text-white">
              {history.length.toString().padStart(2, '0')}
            </span>
          </div>
        </header>

        {/* Table Section */}
        <main className="p-4 md:p-8">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-[3rem] overflow-hidden backdrop-blur-md">
            {/* Horizontal scroll wrapper for the table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-6 md:px-10 py-5 md:py-7 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Reference ID</th>
                    <th className="px-6 md:px-10 py-5 md:py-7 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Status</th>
                    <th className="px-6 md:px-10 py-5 md:py-7 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Start Time</th>
                    <th className="px-6 md:px-10 py-5 md:py-7 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">End Time</th>
                    <th className="px-6 md:px-10 py-5 md:py-7 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="p-20 text-center animate-pulse text-[#D1FD52] font-black uppercase tracking-widest">
                        Accessing Archives...
                      </td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-20 text-center text-white/20 font-bold uppercase tracking-widest">
                        No Records Found
                      </td>
                    </tr>
                  ) : (
                    history.map((session) => (
                      <tr key={session.id} className="hover:bg-white/[0.02] transition-all group">
                        <td className="px-6 md:px-10 py-5 md:py-7 font-mono text-xs text-white/60">
                          #VTL-{session.id.toString().padStart(4, '0')}
                        </td>
                        <td className="px-6 md:px-10 py-5 md:py-7">
                          <span className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D1FD52] shadow-[0_0_8px_#D1FD52]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#D1FD52]">
                              {session.status}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 md:px-10 py-5 md:py-7 text-sm font-medium text-white/80">
                          {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="block text-[9px] text-white/20 uppercase mt-1">
                            {new Date(session.start_time).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 md:px-10 py-5 md:py-7 text-sm font-medium text-white/80">
                          {session.end_time ? new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                        </td>
                        <td className="px-6 md:px-10 py-5 md:py-7 font-black text-white group-hover:text-[#D1FD52] transition-colors">
                          {session.end_time ? 
                            `${Math.round((new Date(session.end_time) - new Date(session.start_time)) / 60000)} MINS` 
                            : "INCOMPLETE"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      <AnalyticsMobileNav navigate={navigate} />
    </div>
  );
};

export default Log;