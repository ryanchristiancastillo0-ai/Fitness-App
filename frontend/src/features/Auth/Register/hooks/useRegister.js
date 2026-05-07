import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../../config/port';

export const useRegister = () => {
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e, formData) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:         formData.name,
          email:        formData.email,
          password:     formData.password,
          fitness_goal: formData.goal,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Initialization failed. System conflict.');
      if (data.success) setShowSuccessModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModalConfirm = () => navigate('/login');

  return { loading, error, showSuccessModal, handleRegister, handleModalConfirm };
};