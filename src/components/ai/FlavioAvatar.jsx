import React from 'react';

// Opções de avatares do consultor
export const FLAVIO_AVATARS = {
  avatar1: {
    id: 'avatar1',
    name: 'Flávio',
    gender: 'male',
    emoji: '👨‍💼',
    description: 'Profissional clássico',
    gradient: 'from-blue-600 to-indigo-600'
  },
  avatar2: {
    id: 'avatar2',
    name: 'Flávio',
    gender: 'male',
    emoji: '👨🏾‍💼',
    description: 'Consultor experiente',
    gradient: 'from-purple-600 to-pink-600'
  },
  avatar3: {
    id: 'avatar3',
    name: 'Flávio',
    gender: 'male',
    emoji: '👨🏻‍💼',
    description: 'Estrategista financeiro',
    gradient: 'from-emerald-600 to-teal-600'
  },
  avatar4: {
    id: 'avatar4',
    name: 'Flávia',
    gender: 'female',
    emoji: '👩‍💼',
    description: 'Profissional clássica',
    gradient: 'from-rose-600 to-pink-600'
  },
  avatar5: {
    id: 'avatar5',
    name: 'Flávia',
    gender: 'female',
    emoji: '👩🏾‍💼',
    description: 'Consultora experiente',
    gradient: 'from-orange-600 to-amber-600'
  },
  avatar6: {
    id: 'avatar6',
    name: 'Flávia',
    gender: 'female',
    emoji: '👩🏻‍💼',
    description: 'Estrategista financeira',
    gradient: 'from-violet-600 to-purple-600'
  }
};

export default function FlavioAvatar({ avatarId = 'avatar1', size = 'md', className = '' }) {
  const avatar = FLAVIO_AVATARS[avatarId] || FLAVIO_AVATARS.avatar1;
  
  const sizes = {
    sm: {
      container: 'w-8 h-8',
      emoji: 'text-xl',
    },
    md: {
      container: 'w-10 h-10',
      emoji: 'text-2xl',
    },
    lg: {
      container: 'w-14 h-14',
      emoji: 'text-3xl',
    },
    xl: {
      container: 'w-20 h-20',
      emoji: 'text-5xl',
    },
    xxl: {
      container: 'w-24 h-24',
      emoji: 'text-6xl',
    }
  };
  
  const sizeConfig = sizes[size] || sizes.md;
  
  return (
    <div 
      className={`${sizeConfig.container} bg-gradient-to-br ${avatar.gradient} rounded-full flex items-center justify-center shadow-lg flex-shrink-0 ${className}`}
      title={avatar.description}
    >
      <span className={`${sizeConfig.emoji}`} role="img" aria-label={avatar.name}>
        {avatar.emoji}
      </span>
    </div>
  );
}