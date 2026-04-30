import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { MobileNav, Sidebar, Topbar } from '../components';
import { API_BASE_URL } from '../config/port';

const socket = io(API_BASE_URL);

const Icon = ({ name, className = '', fill = 0, weight = 300 }) => (
  <span className={`material-symbols-outlined leading-none select-none ${className}`} style={{ fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}` }}>{name}</span>
);

const ClinicalMessenger = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [contacts, setContacts] = useState([]); // ONLY actual friends
  const [searchResults, setSearchResults] = useState([]); // Temporary search hits
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); 
  const [isAiTyping, setIsAiTyping] = useState(false); // ADDED: AI Typing state
  const scrollRef = useRef(null);

  const userId = 1; 

  // ADDED: Static AI Contact Definition
  const vitalistAiContact = {
    id: 'ai-bot',
    name: 'Vitalis AI',
    avatar_url: 'https://ui-avatars.com/api/?name=V&background=c7f248&color=131313&bold=true',
    is_online: 1,
    isAi: true
  };

  // --- 1. DEBOUNCED SEARCH ---
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    // Wait 500ms after last keystroke
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/users/search?query=${searchTerm}&excludeId=${userId}`
        );
        const data = await response.json();
        // Only show users who are NOT already in your contacts
        const filteredResults = data.filter(
          result => !contacts.some(friend => friend.id === result.id)
        );
        setSearchResults(filteredResults);
      } catch (error) {
        console.error("Search error:", error);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, userId, contacts]);

  // --- 2. LOAD ACTUAL FRIENDS ONLY ---
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        socket.emit('join-room', userId);
        const response = await fetch(`${API_BASE_URL}/api/contacts/${userId}`);
        const data = await response.json();
        setContacts(data);
        if (data.length > 0 && !activeContact) {
          setActiveContact(data[0]);
        }
      } catch (error) {
        console.error("Error loading contacts:", error);
      }
    };
    fetchContacts();
  }, [userId]);

  // --- 3. CHAT HISTORY ---
  useEffect(() => {
    if (!activeContact) return;

    // ADDED: Prevent fetching DB history for AI to avoid SQL errors, and inject default greeting
    if (activeContact.id === 'ai-bot') {
        setMessages([{
            content: "Hello Ryan. I am Vitalis AI. How can I assist you with your clinical goals today?",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: 0
        }]);
        return;
    }

    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/messages/${userId}/${activeContact.id}`);
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };
    fetchMessages();

    const handleNewMessage = (newMsg) => {
      if (newMsg.sender_id === activeContact.id || newMsg.receiver_id === activeContact.id) {
        setMessages((prev) => [...prev, newMsg]);
      }
    };
    socket.on('receive-chat', handleNewMessage);
    return () => socket.off('receive-chat', handleNewMessage);
  }, [activeContact, userId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeContact) return;

    // ADDED: Save input locally and clear field immediately
    const userMessageContent = inputValue;
    setInputValue('');

    const newMessage = { 
      content: userMessageContent, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      isMe: 1 
    };
    setMessages((prev) => [...prev, newMessage]);

    // ADDED: Routing logic for AI vs Human
    if (activeContact.id === 'ai-bot') {
        setIsAiTyping(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessageContent, userId })
            });
            const data = await response.json();

            const aiMessage = {
                content: data.reply || "System Error: Unable to reach AI pipeline.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMe: 0
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error("AI chat error:", error);
        } finally {
            setIsAiTyping(false);
        }
    } else {
        const payload = {
          sender_id: userId,
          receiver_id: activeContact.id,
          content: userMessageContent,
          latitude: null,
          longitude: null
        };
        socket.emit('send-chat', payload);
    }
  };

  const handleAddFriend = async (user) => {
    // Optimistic UI update: Add to sidebar instantly
    setContacts(prev => [user, ...prev]);
    setActiveContact(user);
    setSearchTerm('');
    setSearchResults([]);
    
    // Save to database
    try {
        await fetch(`${API_BASE_URL}/api/friends/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, friendId: user.id })
        });
    } catch (err) {
        console.error("Failed to save friend:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-[Inter,sans-serif] overflow-hidden">
      <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />
      <Topbar sidebarExpanded={sidebarExpanded} />

      <main className="pt-[64px] h-screen flex transition-all duration-[400ms]" style={{ marginLeft: sidebarExpanded ? 240 : 72 }}>
        
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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto no-scrollbar">
            {/* SEARCH RESULTS SECTION */}
            {searchResults.length > 0 && (
              <div className="bg-[#c7f248]/5 border-b border-[#c7f248]/10 pb-2">
                <p className="px-6 py-2 text-[10px] text-[#c7f248] font-bold uppercase tracking-widest">Global Results</p>
                {searchResults.map((user) => (
                  <div key={user.id} className="px-6 py-3 flex items-center justify-between hover:bg-white/5 group transition-all">
                    <div className="flex items-center gap-3">
                        <img className="w-8 h-8 rounded-full border border-white/10" src={user.avatar_url} alt="" />
                        <span className="text-sm font-medium">{user.name}</span>
                    </div>
                    <button 
                        onClick={() => handleAddFriend(user)}
                        className="flex items-center gap-1 px-2 py-1 bg-[#c7f248] text-black rounded-md text-[10px] font-bold hover:scale-105 transition-transform"
                    >
                        <Icon name="person_add" weight={600} className="text-xs" /> ADD
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ACTUAL CONTACTS SECTION */}
            <p className="px-6 py-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Your Friends</p>
            
            {/* ADDED: Hardcoded AI Contact in Sidebar */}
            <div 
                onClick={() => setActiveContact(vitalistAiContact)}
                className={`p-4 flex gap-4 cursor-pointer hover:bg-white/5 transition-colors ${activeContact?.id === 'ai-bot' ? 'bg-white/5 border-l-2 border-[#c7f248]' : ''}`}
            >
                <div className="relative">
                  <img className="w-12 h-12 rounded-full border border-white/10" src={vitalistAiContact.avatar_url} alt="" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0e0e0e] bg-[#c7f248]" />
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="text-sm font-bold truncate">{vitalistAiContact.name}</h3>
                  <p className="text-[10px] text-[#c7f248] uppercase tracking-widest font-bold">System Intelligence</p>
                </div>
            </div>

            {contacts.length === 0 ? (
                <p className="px-6 text-xs text-neutral-600 italic">No friends added yet. Use search above!</p>
            ) : (
                contacts.map((contact) => (
                <div 
                    key={contact.id} 
                    onClick={() => setActiveContact(contact)}
                    className={`p-4 flex gap-4 cursor-pointer hover:bg-white/5 transition-colors ${activeContact?.id === contact.id ? 'bg-white/5 border-l-2 border-[#c7f248]' : ''}`}
                >
                    <div className="relative">
                    <img className="w-12 h-12 rounded-full border border-white/10" src={contact.avatar_url} alt="" />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0e0e0e] ${contact.is_online ? 'bg-[#c7f248]' : 'bg-neutral-600'}`} />
                    </div>
                    <div className="flex-grow min-w-0">
                    <h3 className="text-sm font-bold truncate">{contact.name}</h3>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Clinical Advisor</p>
                    </div>
                </div>
                ))
            )}
          </div>
        </aside>

        <section className="flex-grow flex flex-col bg-[#131313]">
          {activeContact ? (
            <>
              <header className="h-20 px-8 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                  <img className="w-10 h-10 rounded-full" src={activeContact.avatar_url} alt="" />
                  <div>
                    <h1 className="text-lg font-bold">{activeContact.name}</h1>
                    <div className="flex items-center gap-2">
                       <span className={`w-1.5 h-1.5 rounded-full ${activeContact.is_online ? 'bg-[#c7f248] animate-pulse' : 'bg-neutral-600'}`} />
                       <span className="text-[10px] text-[#c7f248] uppercase tracking-widest font-medium">Active Session</span>
                    </div>
                  </div>
                </div>
              </header>

              <div ref={scrollRef} className="flex-grow overflow-y-auto p-8 flex flex-col gap-6 no-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={msg.id || idx} className={`flex flex-col gap-2 max-w-[75%] ${msg.isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.isMe ? 'bg-[#c7f248]/10 border border-[#c7f248]/20 text-[#c7f248] rounded-br-none' : 'bg-[#2a2a2a] text-white rounded-bl-none'}`}>
                            {msg.content}
                        </div>
                        <span className="text-[10px] text-neutral-500 font-medium">{msg.time}</span>
                    </div>
                ))}
                
                {/* ADDED: AI Typing Indicator */}
                {isAiTyping && (
                    <div className="flex flex-col gap-2 max-w-[75%] self-start items-start">
                        <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm bg-[#2a2a2a] text-white rounded-bl-none flex gap-1.5 items-center h-11">
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
              </div>

              <footer className="p-6">
                <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-2 flex items-center gap-2 shadow-xl">
                  <textarea 
                    className="flex-grow bg-transparent border-none outline-none text-sm text-white p-2 resize-none no-scrollbar" 
                    placeholder={`Reply to ${activeContact.name}...`}
                    rows="1"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
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