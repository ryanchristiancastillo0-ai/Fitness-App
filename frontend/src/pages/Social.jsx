import React, { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { MobileNav, Sidebar, Topbar } from '../components';
import { API_BASE_URL } from '../config/port';
import { useAuth } from '../hooks/useAuth';

// Make sure VITE_SOCKET_URL is set in your .env:
//   VITE_SOCKET_URL=http://localhost:8000
// And API_BASE_URL in config/port.js should be:
//   export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

// Create socket ONCE outside the component so it doesn't reconnect on re-renders
const socket = io(SOCKET_URL, { withCredentials: true });

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
  const [contacts,        setContacts]        = useState([]);
  const [searchResults,   setSearchResults]   = useState([]);
  const [activeContact,   setActiveContact]   = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [inputValue,      setInputValue]      = useState('');
  const [searchTerm,      setSearchTerm]      = useState('');
  const [isAiTyping,      setIsAiTyping]      = useState(false);
  const [loadingMsgs,     setLoadingMsgs]     = useState(false);

  const scrollRef = useRef(null);

  // ── Auto-scroll on new messages ──────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiTyping]);

  // ── Join socket room ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    socket.emit('join-room', userId);
  }, [userId]);

  // ── Load friends from DB ──────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const fetchContacts = async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/api/contacts/${userId}`, { credentials: 'include' });
        const data = await res.json();
        setContacts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error loading contacts:', err);
      }
    };
    fetchContacts();
  }, [userId]);

  // ── Load message history when active contact changes ─────────────────────
  useEffect(() => {
    if (!activeContact) return;

    if (activeContact.id === 'ai-bot') {
      setMessages([{
        content: `Hello ${user?.name ?? ''}! I'm Vitalis AI. How can I assist you with your clinical goals today?`,
        time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe:    0,
      }]);
      return;
    }

    const fetchMessages = async () => {
      setLoadingMsgs(true);
      try {
        const res  = await fetch(
          `${API_BASE_URL}/api/messages/${userId}/${activeContact.id}`,
          { credentials: 'include' }
        );
        const data = await res.json();
        setMessages(Array.isArray(data) ? data.map(m => ({ ...m, isMe: Number(m.isMe) })) : []);
      } catch (err) {
        console.error('Error loading messages:', err);
        setMessages([]);
      } finally {
        setLoadingMsgs(false);
      }
    };
    fetchMessages();

    // ── Real-time socket listener for this conversation ──────────────────
    const handleNewMessage = (newMsg) => {
      if (
        newMsg.sender_id === activeContact.id ||
        newMsg.receiver_id === activeContact.id
      ) {
        setMessages(prev => [
          ...prev,
          { ...newMsg, isMe: newMsg.sender_id === userId ? 1 : 0 },
        ]);
      }
    };
    socket.on('receive-chat', handleNewMessage);
    return () => socket.off('receive-chat', handleNewMessage);
  }, [activeContact, userId]);

  // ── Debounced user search ─────────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(
          `${API_BASE_URL}/api/users/search?query=${encodeURIComponent(searchTerm)}&excludeId=${userId}`,
          { credentials: 'include' }
        );
        const data = await res.json();
        setSearchResults(
          Array.isArray(data) ? data.filter(r => !contacts.some(c => c.id === r.id)) : []
        );
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, userId, contacts]);

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !activeContact) return;

    const content = inputValue.trim();
    setInputValue('');

    // Optimistic UI: show message immediately before server confirms
    const optimistic = {
      content,
      time:  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe:  1,
      _temp: true,
    };
    setMessages(prev => [...prev, optimistic]);

    // ── AI path ───────────────────────────────────────────────────────────
    if (activeContact.id === 'ai-bot') {
      setIsAiTyping(true);
      try {
        const res  = await fetch(`${API_BASE_URL}/api/ai-chat`, {
          method:      'POST',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'include',
          body:        JSON.stringify({ message: content, userId }),
        });
        if (!res.ok) throw new Error(`AI API error: ${res.status}`);
        const data = await res.json();
        setMessages(prev => [...prev, {
          content: data.reply || 'System Error: Unable to reach AI pipeline.',
          time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe:    0,
        }]);
      } catch (err) {
        console.error('AI chat error:', err);
        setMessages(prev => [...prev, {
          content: 'System Error: Unable to reach AI pipeline.',
          time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe:    0,
        }]);
      } finally {
        setIsAiTyping(false);
      }
      return;
    }

    // ── Human path: save to DB first, then socket emit ────────────────────
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ sender_id: userId, receiver_id: activeContact.id, content }),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      const saved = await res.json();

      // Replace optimistic with DB-confirmed message (has real id + timestamp)
      setMessages(prev =>
        prev.map(m => (m._temp && m.content === content) ? { ...saved, isMe: 1 } : m)
      );

      // Broadcast to receiver's socket room
      socket.emit('send-chat', {
        ...saved,
        sender_id:   userId,
        receiver_id: activeContact.id,
      });
    } catch (err) {
      console.error('Send message error:', err);
      // Mark the optimistic message as failed
      setMessages(prev =>
        prev.map(m => (m._temp && m.content === content) ? { ...m, failed: true } : m)
      );
    }
  }, [inputValue, activeContact, userId]);

  // ── Add friend ────────────────────────────────────────────────────────────
  const handleAddFriend = async (friendUser) => {
    setContacts(prev => [friendUser, ...prev]);
    setActiveContact(friendUser);
    setSearchTerm('');
    setSearchResults([]);
    try {
      await fetch(`${API_BASE_URL}/api/friends/add`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ userId, friendId: friendUser.id }),
      });
    } catch (err) {
      console.error('Failed to save friend:', err);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-[Inter,sans-serif] overflow-hidden">
      <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />
      <Topbar sidebarExpanded={sidebarExpanded} userId={userId} />

      <main
        className="pt-[64px] h-screen flex transition-all duration-[400ms]"
        style={{ marginLeft: sidebarExpanded ? 240 : 72 }}
      >
        {/* ── Contact sidebar ── */}
        <aside className="w-80 border-r border-white/5 bg-[#0e0e0e] flex flex-col shrink-0">
          <div className="p-6 border-b border-white/5 space-y-4">
            <h2 className="text-xl font-bold text-[#c7f248]">Vitalis Messenger</h2>
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
                <p className="px-6 py-2 text-[10px] text-[#c7f248] font-bold uppercase tracking-widest">
                  Global Results
                </p>
                {searchResults.map(u => (
                  <div
                    key={u.id}
                    className="px-6 py-3 flex items-center justify-between hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        className="w-8 h-8 rounded-full border border-white/10"
                        src={u.avatar_url}
                        alt={u.name}
                      />
                      <span className="text-sm font-medium">{u.name}</span>
                    </div>
                    <button
                      onClick={() => handleAddFriend(u)}
                      className="flex items-center gap-1 px-2 py-1 bg-[#c7f248] text-black rounded-md text-[10px] font-bold hover:scale-105 transition-transform"
                    >
                      <Icon name="person_add" weight={600} className="text-xs" /> ADD
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="px-6 py-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
              Your Friends
            </p>

            {/* AI contact — always pinned at top */}
            <div
              onClick={() => setActiveContact(AI_CONTACT)}
              className={`p-4 flex gap-4 cursor-pointer hover:bg-white/5 transition-colors ${
                activeContact?.id === 'ai-bot' ? 'bg-white/5 border-l-2 border-[#c7f248]' : ''
              }`}
            >
              <div className="relative">
                <img
                  className="w-12 h-12 rounded-full border border-white/10"
                  src={AI_CONTACT.avatar_url}
                  alt="Vitalis AI"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0e0e0e] bg-[#c7f248]" />
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
              <p className="px-6 text-xs text-neutral-600 italic">
                No friends added yet. Use search above!
              </p>
            ) : (
              contacts.map(contact => (
                <div
                  key={contact.id}
                  onClick={() => setActiveContact(contact)}
                  className={`p-4 flex gap-4 cursor-pointer hover:bg-white/5 transition-colors ${
                    activeContact?.id === contact.id
                      ? 'bg-white/5 border-l-2 border-[#c7f248]'
                      : ''
                  }`}
                >
                  <div className="relative">
                    <img
                      className="w-12 h-12 rounded-full border border-white/10"
                      src={contact.avatar_url}
                      alt={contact.name}
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0e0e0e] ${
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
        <section className="flex-grow flex flex-col bg-[#131313]">
          {activeContact ? (
            <>
              <header className="h-20 px-8 flex items-center border-b border-white/5 gap-4">
                <img
                  className="w-10 h-10 rounded-full"
                  src={activeContact.avatar_url}
                  alt={activeContact.name}
                />
                <div>
                  <h1 className="text-lg font-bold">{activeContact.name}</h1>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        activeContact.is_online ? 'bg-[#c7f248] animate-pulse' : 'bg-neutral-600'
                      }`}
                    />
                    <span className="text-[10px] text-[#c7f248] uppercase tracking-widest font-medium">
                      Active Session
                    </span>
                  </div>
                </div>
              </header>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-grow overflow-y-auto p-8 flex flex-col gap-6 no-scrollbar"
              >
                {loadingMsgs ? (
                  <div className="flex-grow flex items-center justify-center text-neutral-600 text-xs">
                    Loading messages…
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col gap-2 max-w-[75%] ${
                        msg.isMe ? 'self-end items-end' : 'self-start items-start'
                      }`}
                    >
                      <div
                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
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
              <footer className="p-6">
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
                    className="bg-[#c7f248] text-[#161f00] p-2.5 rounded-xl disabled:opacity-50 active:scale-95 transition-all"
                    disabled={!inputValue.trim()}
                  >
                    <Icon name="send" weight={600} />
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-neutral-500 gap-4">
              <Icon name="forum" className="text-5xl opacity-20" />
              <p className="text-sm font-medium">Select a clinician to begin your session.</p>
            </div>
          )}
        </section>
      </main>

      <MobileNav />
    </div>
  );
};

export default ClinicalMessenger;