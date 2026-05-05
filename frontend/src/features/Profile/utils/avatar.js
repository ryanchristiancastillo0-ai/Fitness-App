// utils/avatar.js
export const DEFAULT_AVATARS = [
  { id: 'avatar_1', seed: 'Felix',  label: 'Atlas'  },
  { id: 'avatar_2', seed: 'Zara',   label: 'Zara'   },
  { id: 'avatar_3', seed: 'Cyborg', label: 'Cyborg' },
  { id: 'avatar_4', seed: 'Nova',   label: 'Nova'   },
];

export const getAvatarUrl = (seed) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;