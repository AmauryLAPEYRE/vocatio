// src/components/common/AccessibleModal.tsx
  import React, { useEffect } from 'react';
  import { useA11y } from '@/hooks/useA11y';
  
  interface AccessibleModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    className?: string;
    modalId?: string;
  }
  
  export function AccessibleModal({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    className = '',
    modalId = 'a11y-modal'
  }: AccessibleModalProps) {
    // Utiliser le hook d'accessibilité
    useA11y(modalId, {
      trapFocus: isOpen,
      autoFocus: isOpen,
      restoreFocus: true
    });
    
    // Gérer la touche Escape
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen, onClose]);
    
    // Empêcher le défilement du corps lorsque la modale est ouverte
    useEffect(() => {
      if (isOpen) {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        
        return () => {
          document.body.style.overflow = originalStyle;
        };
      }
    }, [isOpen]);
    
    if (!isOpen) return null;
    
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${modalId}-title`}
        onClick={(e) => {
          // Fermer seulement si le clic est sur l'arrière-plan
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          id={modalId}
          className={`bg-white rounded-lg shadow-xl max-w-xl mx-auto p-6 ${className}`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 id={`${modalId}-title`} className="text-xl font-bold">
              {title}
            </h2>
            <button
              className="close-button bg-gray-200 p-1 rounded-full hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={onClose}
              aria-label="Fermer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div>
            {children}
          </div>
        </div>
      </div>
    );
  }