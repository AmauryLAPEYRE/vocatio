// src/components/common/Loader.tsx
import React from 'react';

interface LoaderProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
}

export function Loader({ text, size = 'medium' }: LoaderProps) {
  // Définir les tailles du loader
  const sizeClass = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  }[size];
  
  return (
    <div className="flex flex-col items-center">
      // src/components/common/Loader.tsx
      <div className={`animate-spin rounded-full border-t-2 border-blue-500 border-opacity-50 border-r-2 border-b-2 ${sizeClass}`} role="status" />
      {text && <p className="mt-3 text-gray-600 text-sm">{text}</p>}
    </div>
  );
}