// src/hooks/useA11y.tsx
  import { useEffect, useRef } from 'react';
  import { FocusManager } from '@/lib/accessibility/focus-manager';
  
  interface UseA11yOptions {
    trapFocus?: boolean;
    autoFocus?: boolean;
    restoreFocus?: boolean;
    enableAriaAnnouncer?: boolean;
  }
  
  /**
   * Hook pour gérer l'accessibilité (a11y) des composants
   */
  export function useA11y(containerId: string, options: UseA11yOptions = {}) {
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);
    
    useEffect(() => {
      // Sauvegarder l'élément avec le focus actuel
      if (options.restoreFocus) {
        previousFocusRef.current = document.activeElement as HTMLElement;
      }
      
      // Piéger le focus s'il est activé
      if (options.trapFocus) {
        cleanupRef.current = FocusManager.trapFocus(containerId);
      }
      
      // Auto-focus sur le conteneur
      if (options.autoFocus) {
        const container = document.getElementById(containerId);
        if (container) {
          // Chercher le premier élément focusable
          const focusableElement = container.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          if (focusableElement) {
            focusableElement.focus();
          } else {
            // Si aucun élément focusable, rendre le conteneur focusable
            container.tabIndex = -1;
            container.focus();
          }
        }
      }
      
      return () => {
        // Nettoyer le piège de focus
        if (cleanupRef.current) {
          cleanupRef.current();
        }
        
        // Restaurer le focus précédent
        if (options.restoreFocus && previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }, [containerId, options.trapFocus, options.autoFocus, options.restoreFocus]);
    
    // Composant pour les annonces d'accessibilité
    const AriaAnnouncer = options.enableAriaAnnouncer 
      ? ({ message, assertive = false }: { message: string, assertive?: boolean }) => (
          <div 
            aria-live={assertive ? "assertive" : "polite"} 
            className="sr-only"
          >
            {message}
          </div>
        )
      : null;
    
    return { AriaAnnouncer };
  }