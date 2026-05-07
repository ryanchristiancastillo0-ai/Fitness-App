import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/port';

export const useContacts = (userId) => {
  const [contacts,      setContacts]      = useState([]);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [searchResults, setSearchResults] = useState([]);

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
      setSearchResults(Array.isArray(data) ? data : []);
console.log('search raw data:', data);          // what the backend returned
console.log('current contacts:', contacts);     // what contacts look like
        
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, userId, contacts]);

  // ── Add friend ────────────────────────────────────────────────────────────
  const handleAddFriend = async (friendUser, setActiveContact) => {
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

  return {
    contacts,
    setContacts,
    searchTerm,
    setSearchTerm,
    searchResults,
    handleAddFriend,
  };
};