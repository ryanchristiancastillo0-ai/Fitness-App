export const handleLogout = async () => {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include', // 🔥 VERY IMPORTANT
    });
  } catch (error) {
    console.error('Logout failed:', error);
  } finally {
    window.location.href = '/login'; // force redirect
  }
};