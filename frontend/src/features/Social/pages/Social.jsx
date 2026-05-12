import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { MobileNav, Sidebar, Topbar } from '../../../components';
import { useAuth } from '../../../hooks/useAuth';
import { useContacts } from '../hooks/useContact';
import { useMessages } from '../hooks/useMessages';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

const Icon = ({ name, className = '', fill = 0, weight = 300 }) => (
  <span
    className={`material-symbols-outlined leading-none select-none ${className}`}
    style={{ fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}` }}
  >
    {name}
  </span>
);

const AI_CONTACT = {
  id: 'ai-bot',
  name: 'Vitalis AI',
  avatar_url: 'https://ui-avatars.com/api/?name=V&background=c7f248&color=131313&bold=true',
  is_online: 1,
  isAi: true,
};

const ClinicalMessenger = () => {
  const { user, loading } = useAuth();
  const userId = user?.id || null;

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeContact,   setActiveContact]   = useState(null);

  // Controls whether the contact list panel is visible on mobile
  const [showContactPanel, setShowContactPanel] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const scrollRef = useRef(null);
  const socketRef = useRef(null);

  // ── Create socket once, disconnect cleanly on unmount ────────────────────
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { withCredentials: true });
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // ── Join socket room ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !socketRef.current) return;
    socketRef.current.emit('join-room', userId);
  }, [userId]);

  const {
    contacts,
    searchTerm,
    setSearchTerm,
    searchResults,
    handleAddFriend,
  } = useContacts(userId);

  const {
    messages,
    inputValue,
    setInputValue,
    isAiTyping,
    loadingMsgs,
    handleSendMessage,
  } = useMessages(userId, activeContact, user, socketRef);

  // ── Auto-scroll on new messages ──────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiTyping]);

  // ── On mobile: selecting a contact hides the contact list and shows chat ──
  const handleSelectContact = (contact) => {
    setActiveContact(contact);
    setShowContactPanel(false); // on small screens, switch to chat view
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-[Inter,sans-serif] overflow-hidden">
      <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />
      <Topbar sidebarExpanded={sidebarExpanded} userId={userId} />

      <main
        className="pt-[64px] h-screen flex transition-all duration-[400ms]"
        style={{ marginLeft: isMobile ? 0 : sidebarExpanded ? 240 : 72 }}
      >
        {/*
          ── Responsive layout strategy ───────────────────────────────────────
          • Mobile  (<768px / md): single-column; contact panel and chat panel
            stack — only one is visible at a time. We toggle via showContactPanel.
            The sidebar margin is overridden to 0 on very small screens so the
            collapsed sidebar doesn't steal space (it overlays instead).
          • Tablet  (md–lg): both panels visible side-by-side; contact list
            narrows to w-64.
          • Desktop (lg+): original layout, contact list at w-80.
          ─────────────────────────────────────────────────────────────────── */}

        {/* ── Contact sidebar ── */}
        <aside
          className={`
            border-r border-white/5 bg-[#0e0e0e] flex flex-col shrink-0
            /* Mobile: full-width, toggle visibility */
            w-full md:w-64 lg:w-80
            ${showContactPanel ? 'flex' : 'hidden'}
            md:flex
          `}
        >
          <div className="p-4 md:p-6 border-b border-white/5 space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-bold text-[#c7f248]">Vitalis Messenger</h2>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-[#c7f248]">
                <Icon name="search" className="text-lg" weight={500} />
              </div>
              <input
                type="text"
                placeholder="Search global users..."
                className="w-full bg-[#131313] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none focus:border-[#c7f248]/50 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto no-scrollbar">
            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="bg-[#c7f248]/5 border-b border-[#c7f248]/10 pb-2">
                <p className="px-4 md:px-6 py-2 text-[10px] text-[#c7f248] font-bold uppercase tracking-widest">
                  Global Results
                </p>
                {searchResults.map(u => (
                  <div
                    key={u.id}
                    className="px-4 md:px-6 py-3 flex items-center justify-between hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        className="w-8 h-8 rounded-full border border-white/10"
                        src={u.avatar_url}
                        alt={u.name}
                      />
                      <span className="text-sm font-medium truncate max-w-[120px]">{u.name}</span>
                    </div>
                    <button
                      onClick={() => handleAddFriend(u, setActiveContact)}
                      className="flex items-center gap-1 px-2 py-1 bg-[#c7f248] text-black rounded-md text-[10px] font-bold hover:scale-105 transition-transform shrink-0"
                    >
                      <Icon name="person_add" weight={600} className="text-xs" /> ADD
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="px-4 md:px-6 py-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
              Your Friends
            </p>

            {/* AI contact — always pinned at top */}
            <div
              onClick={() => handleSelectContact(AI_CONTACT)}
              className={`p-3 md:p-4 flex gap-3 md:gap-4 cursor-pointer hover:bg-white/5 transition-colors ${
                activeContact?.id === 'ai-bot' ? 'bg-white/5 border-l-2 border-[#c7f248]' : ''
              }`}
            >
              <div className="relative shrink-0">
                <img
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10"
                  src={AI_CONTACT.avatar_url}
                  alt="Vitalis AI"
                />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border-2 border-[#0e0e0e] bg-[#c7f248]" />
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="text-sm font-bold truncate">{AI_CONTACT.name}</h3>
                <p className="text-[10px] text-[#c7f248] uppercase tracking-widest font-bold">
                  System Intelligence
                </p>
              </div>
            </div>

            {/* Human contacts from DB */}
            {contacts.length === 0 ? (
              <p className="px-4 md:px-6 text-xs text-neutral-600 italic">
                No friends added yet. Use search above!
              </p>
            ) : (
              contacts.map(contact => (
                <div
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className={`p-3 md:p-4 flex gap-3 md:gap-4 cursor-pointer hover:bg-white/5 transition-colors ${
                    activeContact?.id === contact.id
                      ? 'bg-white/5 border-l-2 border-[#c7f248]'
                      : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10"
                      src={contact.avatar_url}
                      alt={contact.name}
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border-2 border-[#0e0e0e] ${
                        contact.is_online ? 'bg-[#c7f248]' : 'bg-neutral-600'
                      }`}
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="text-sm font-bold truncate">{contact.name}</h3>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                      Clinical Advisor
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ── Chat panel ── */}
        <section
          className={`
            flex-grow flex flex-col bg-[#131313] min-w-0
            /* Mobile: hide when contact panel is shown */
            ${!showContactPanel ? 'flex' : 'hidden'}
            md:flex
          `}
        >
          {activeContact ? (
            <>
              <header className="h-16 md:h-20 px-4 md:px-8 flex items-center border-b border-white/5 gap-3 md:gap-4 shrink-0">
                {/* Back button — mobile only */}
                <button
                  className="md:hidden p-1 -ml-1 text-neutral-400 hover:text-[#c7f248] transition-colors"
                  onClick={() => setShowContactPanel(true)}
                  aria-label="Back to contacts"
                >
                  <Icon name="arrow_back" weight={500} className="text-xl" />
                </button>

                <img
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0"
                  src={activeContact.avatar_url}
                  alt={activeContact.name}
                />
                <div className="min-w-0">
                  <h1 className="text-base md:text-lg font-bold truncate">{activeContact.name}</h1>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        activeContact.is_online ? 'bg-[#c7f248] animate-pulse' : 'bg-neutral-600'
                      }`}
                    />
                    <span className="text-[10px] text-[#c7f248] uppercase tracking-widest font-medium truncate">
                      Active Session
                    </span>
                  </div>
                </div>
              </header>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-grow overflow-y-auto p-4 md:p-8 flex flex-col gap-4 md:gap-6 no-scrollbar"
              >
                {loadingMsgs ? (
                  <div className="flex-grow flex items-center justify-center text-neutral-600 text-xs">
                    Loading messages…
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col gap-1.5 md:gap-2 max-w-[85%] sm:max-w-[78%] md:max-w-[75%] ${
                        msg.isMe ? 'self-end items-end' : 'self-start items-start'
                      }`}
                    >
                      <div
                        className={`px-3 py-2.5 md:px-4 md:py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          msg.isMe
                            ? `bg-[#c7f248]/10 border border-[#c7f248]/20 text-[#c7f248] rounded-br-none${
                                msg.failed ? ' opacity-50' : ''
                              }`
                            : 'bg-[#2a2a2a] text-white rounded-bl-none'
                        }`}
                      >
                        {msg.content}
                        {msg.failed && (
                          <span className="ml-2 text-[10px] text-red-400">Failed to send</span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500 font-medium">{msg.time}</span>
                    </div>
                  ))
                )}

                {/* AI typing indicator */}
                {isAiTyping && (
                  <div className="flex flex-col gap-2 max-w-[75%] self-start items-start">
                    <div className="px-4 py-3 rounded-2xl bg-[#2a2a2a] rounded-bl-none flex gap-1.5 items-center h-11">
                      <span
                        className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Input footer */}
              <footer className="p-3 pb-20 md:p-6 md:pb-6 shrink-0">
                <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-2 flex items-center gap-2 shadow-xl">
                  <textarea
                    className="flex-grow bg-transparent border-none outline-none text-sm text-white p-2 resize-none no-scrollbar"
                    placeholder={`Reply to ${activeContact.name}...`}
                    rows="1"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-[#c7f248] text-[#161f00] p-2.5 rounded-xl disabled:opacity-50 active:scale-95 transition-all shrink-0"
                    disabled={!inputValue.trim()}
                  >
                    <Icon name="send" weight={600} />
                  </button>
                </div>
              </footer>
            </>
          ) : (
            /* Empty state — only visible on md+ since mobile shows contact panel instead */
            <div className="flex-grow flex flex-col items-center justify-center text-neutral-500 gap-4">
              <Icon name="forum" className="text-5xl opacity-20" />
              <p className="text-sm font-medium text-center px-4">
                Select a clinician to begin your session.
              </p>
            </div>
          )}
        </section>
      </main>

      <MobileNav />
    </div>
  );
};

export default ClinicalMessenger;