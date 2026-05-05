// hooks/useAvatar.js
import { useState, useRef } from 'react';
import { getAvatarUrl } from '../utils/avatar';

export const useAvatar = ({ setAvatarSrc, setPendingAvatar }) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploadPreview, setUploadPreview]       = useState(null);
  const fileInputRef = useRef(null);

  const handleSelectPreset = (seed) => {
    const url = getAvatarUrl(seed);
    setPendingAvatar({ type: 'preset', value: url });
    setUploadPreview(null);
    setAvatarSrc(url);
    setShowAvatarPicker(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setUploadPreview(base64);
      setPendingAvatar({ type: 'upload', value: base64 });
      setAvatarSrc(base64);
      setShowAvatarPicker(false);
    };
    reader.readAsDataURL(file);
  };

  return {
    showAvatarPicker, setShowAvatarPicker,
    uploadPreview,
    fileInputRef,
    handleSelectPreset,
    handleFileChange,
  };
};