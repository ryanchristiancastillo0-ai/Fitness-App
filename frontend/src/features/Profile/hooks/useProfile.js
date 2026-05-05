// hooks/useProfile.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config/port';
import { useAuth } from '../../../hooks/useAuth';
import { getAvatarUrl } from '../utils/avatar';

export const useProfile = () => {
  const navigate = useNavigate();
  const { user, loading, logout, setUser } = useAuth();
  const USER_ID = user?.id || null;

  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [isEditing, setIsEditing]   = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [sessions, setSessions]     = useState([]);

  const [formData, setFormData] = useState({
    fullName: '',
    email:    '',
    contact:  '',
    bio:      '',
  });
  const [savedData, setSavedData] = useState({ ...formData });

  // Avatar state lifted here so save can access it
  const [avatarSrc, setAvatarSrc]       = useState('');
  const [pendingAvatar, setPendingAvatar] = useState(null);

  // ── Guard ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  // ── Fetch sessions ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchSessions = async () => {
      if (!USER_ID) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/security`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch sessions');
        const data = await res.json();
        setSessions(data);
      } catch (err) {
        console.error('Security fetch error:', err);
      }
    };
    fetchSessions();
  }, [USER_ID]);

  // ── Fetch profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      if (!USER_ID) {
        if (!loading) setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/profile/${USER_ID}`, { credentials: 'include' });
        if (res.ok) {
          const dbData = await res.json();
          const mapped = {
            fullName: dbData.fullName || user?.name  || '',
            email:    dbData.email    || user?.email || '',
            contact:  dbData.contact  || '',
            bio:      dbData.bio      || user?.fitness_goal || '',
          };
          setFormData(mapped);
          setSavedData(mapped);
          const src = dbData.avatar_url || getAvatarUrl(USER_ID);
          setAvatarSrc(src);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [USER_ID]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleInputChange = (e, field) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handlePenClick = () => {
    if (isEditing) {
      setFormData({ ...savedData });
      setPendingAvatar(null);
      setAvatarSrc(user?.avatar_url || getAvatarUrl(USER_ID));
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Discard unsaved changes?')) {
      setFormData({ ...savedData });
      setPendingAvatar(null);
      setAvatarSrc(user?.avatar_url || getAvatarUrl(USER_ID));
      setIsEditing(false);
    }
  };

  const handleSave = async () => {
    if (!USER_ID) return;
    setIsSaving(true);
    try {
      const body = {
        fullName: formData.fullName,
        contact:  formData.contact,
        bio:      formData.bio,
      };
      if (pendingAvatar) {
        body.avatar_url = pendingAvatar.value; // works for both preset & upload
      }

      const res = await fetch(`${API_BASE_URL}/api/profile/update`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSavedData({ ...formData });
        setPendingAvatar(null);
        setIsEditing(false);
        setUser(prev => ({
          ...prev,
          name:       formData.fullName,
          avatar_url: body.avatar_url || prev.avatar_url,
        }));
        setShowModal(true);
        setTimeout(() => setShowModal(false), 3000);
      } else {
        alert('Sync Failed: Server Error');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Sync Failed: Check Connection');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return {
    user, loading, USER_ID,
    isLoading, isSaving, isEditing, showModal, sessions,
    formData, avatarSrc, pendingAvatar,
    setShowModal, setAvatarSrc, setPendingAvatar, setIsEditing,
    handleInputChange, handlePenClick, handleDiscard, handleSave, handleLogout,
  };
};