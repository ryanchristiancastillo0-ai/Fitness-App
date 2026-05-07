import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../../../config/port';

export const useMessages = (userId, activeContact, user, socketRef) => {
  const [messages,    setMessages]    = useState([]);
  const [inputValue,  setInputValue]  = useState('');
  const [isAiTyping,  setIsAiTyping]  = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

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

    // ── Real-time socket listener ─────────────────────────────────────────
    // Remove any stale listeners before adding a fresh one to prevent stacking
    const socket = socketRef.current;
    if (!socket) return;

    socket.off('receive-chat');

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
      socketRef.current.emit('send-chat', {
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

  return {
    messages,
    inputValue,
    setInputValue,
    isAiTyping,
    loadingMsgs,
    handleSendMessage,
  };
};