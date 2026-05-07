import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { API_BASE_URL } from '../../../../config/port';
import {useAuth }from '../../../../hooks/useAuth';
export const useLogin = () => {
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate  = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e, { email, password }) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      const userId = data?.id || data?.user?.id;
      if (!userId) throw new Error('Login response did not include a user ID.');

      setUser(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (codeResponse) => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ code: codeResponse.code }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server response was not JSON. Check backend console.');
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Google synchronization failed.');

      const userId = data?.id || data?.user?.id;
      if (!userId) throw new Error('Google login response did not include a user ID.');

      setUser(data);
      navigate('/dashboard');
    } catch (err) {
      console.error('Google Login Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError:   () => setError('Google Authentication Interrupted.'),
    flow:      'auth-code',
  });

  return { error, loading, handleSubmit, loginWithGoogle };
};