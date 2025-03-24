// src/components/common/LoadingState.tsx
import React from 'react';

interface LoadingStateProps {
  text?: string;
  subText?: string;
  progress?: number;
  size?: 'small' | 'medium' | 'large';
  isFullScreen?: boolean;
  isTransparent?: boolean;
  showSpinner?: boolean;
  showProgress?: boolean;
  className?: string;
}

export function LoadingState({
  text = 'Chargement en cours...',
  subText,
  progress,
  size = 'medium',
  isFullScreen = false,
  isTransparent = false,
  showSpinner = true,
  showProgress = false,
  className = ''
}: LoadingStateProps) {
  // Tailles pour les différentes variantes
  const spinnerSizes = {
    small: 'w-5 h-5',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };
  
  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-xl'
  };
  
  const subTextSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };
  
  // Calcul du pourcentage pour la barre de progression
  const progressPercent = progress !== undefined ? Math.min(Math.max(progress, 0), 100) : 0;
  
  // Classes pour le conteneur
  const containerClasses = [
    isFullScreen ? 'fixed inset-0 z-50 flex items-center justify-center' : 'flex flex-col items-center justify-center py-8',
    isTransparent ? 'bg-white bg-opacity-80' : 'bg-white',
    className
  ].join(' ');
  
  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <div className="flex flex-col items-center justify-center space-y-4">
        {showSpinner && (
          <div className={`animate-spin rounded-full border-t-2 border-blue-500 border-opacity-50 border-r-2 border-b-2 ${spinnerSizes[size]}`} />
        )}
        
        {text && (
          <p className={`font-medium text-gray-700 ${textSizes[size]}`}>{text}</p>
        )}
        
        {subText && (
          <p className={`text-gray-500 ${subTextSizes[size]}`}>{subText}</p>
        )}
        
        {showProgress && progress !== undefined && (
          <div className="w-full max-w-md">
            <div className="relative pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {progressPercent.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex h-2 mb-4 overflow-hidden text-xs bg-blue-200 rounded">
                <div 
                  style={{ width: `${progressPercent}%` }}
                  className="flex flex-col justify-center text-center text-white bg-blue-500 shadow-none whitespace-nowrap transition-all duration-300 ease-in-out"
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}