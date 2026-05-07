import { API_BASE_URL } from '../config/port';

export const handleLogout = async () => {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
};