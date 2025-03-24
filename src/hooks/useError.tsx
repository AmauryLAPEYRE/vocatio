// src/hooks/useError.tsx
import { useState, useCallback } from 'react';
import { useToast } from './useToast';

interface UseErrorOptions {
  showToast?: boolean;
}

/**
 * Hook personnalisé pour gérer les erreurs de manière uniforme
 */
export function useError(options: UseErrorOptions = {}) {
  const [error, setError] = useState<Error | null>(null);
  const [isError, setIsError] = useState(false);
  const { showToast } = useToast();
  
  const handleError = useCallback((err: any, defaultType: string = 'unexpected') => {
    // Convertir l'erreur en objet Error si ce n'est pas déjà le cas
    const appError = err instanceof Error 
      ? err 
      : new Error(err?.message || 'Une erreur est survenue');
    
    // Journaliser l'erreur
    console.error('[ERROR]', appError);
    
    // Mettre à jour l'état
    setError(appError);
    setIsError(true);
    
    // Afficher un toast si l'option est activée
    if (options.showToast !== false) {
      showToast({
        message: appError.message,
        type: 'error',
        duration: 5000
      });
    }
    
    return appError;
  }, [showToast, options.showToast]);
  
  const clearError = useCallback(() => {
    setError(null);
    setIsError(false);
  }, []);
  
  return {
    error,
    isError,
    handleError,
    clearError
  };
}