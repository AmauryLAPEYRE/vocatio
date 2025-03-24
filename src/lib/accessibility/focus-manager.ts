// src/lib/accessibility/focus-manager.ts

/**
 * Gestionnaire de focus pour améliorer l'accessibilité clavier
 */
export class FocusManager {
    /**
     * Éléments focusables dans un ordre séquentiel
     */
    private static focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
    /**
     * Met le focus sur un élément par ID
     * @param elementId ID de l'élément à focus
     * @returns true si le focus a été placé, false sinon
     */
    static focusElement(elementId: string): boolean {
      const element = document.getElementById(elementId);
      if (element) {
        element.focus();
        return true;
      }
      return false;
    }
  
    /**
     * Piège le focus à l'intérieur d'un conteneur (pour les modales, etc.)
     * @param containerId ID du conteneur où piéger le focus
     * @returns Fonction pour arrêter le piège de focus
     */
    static trapFocus(containerId: string): () => void {
      const container = document.getElementById(containerId);
      if (!container) return () => {};
      
      // Trouver tous les éléments focusables
      const focusableContent = container.querySelectorAll<HTMLElement>(this.focusableElements);
      if (focusableContent.length === 0) return () => {};
      
      const firstFocusableElement = focusableContent[0];
      const lastFocusableElement = focusableContent[focusableContent.length - 1];
      
      // Mettre le focus sur le premier élément
      firstFocusableElement.focus();
      
      // Gérer la navigation au clavier avec Tab
      const handleTabKey = (e: KeyboardEvent) => {
        // Vérifier si la touche Tab est pressée
        if (e.key !== 'Tab') return;
        
        // Tab sans Shift - aller au prochain élément
        if (!e.shiftKey && document.activeElement === lastFocusableElement) {
          e.preventDefault();
          firstFocusableElement.focus();
        }
        
        // Shift + Tab - aller à l'élément précédent
        if (e.shiftKey && document.activeElement === firstFocusableElement) {
          e.preventDefault();
          lastFocusableElement.focus();
        }
      };
      
      // Gérer la touche Escape pour fermer la modale
      const handleEscapeKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          // Chercher un bouton de fermeture
          const closeButton = container.querySelector<HTMLElement>('.close-button, [aria-label="Fermer"], [aria-label="Close"]');
          if (closeButton) {
            e.preventDefault();
            closeButton.click();
          }
        }
      };
      
      // Ajouter les gestionnaires d'événements
      document.addEventListener('keydown', handleTabKey);
      document.addEventListener('keydown', handleEscapeKey);
      
      // Retourner une fonction pour nettoyer
      return () => {
        document.removeEventListener('keydown', handleTabKey);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  
    /**
     * Restaure le focus à un élément après une action
     * @param elementId ID de l'élément qui avait le focus initialement
     */
    static restoreFocus(elementId: string): void {
      // Timeout pour permettre au DOM de s'actualiser
      setTimeout(() => {
        this.focusElement(elementId);
      }, 0);
    }
  
    /**
     * Ajoute un gestionnaire pour un déplacement facile entre sections via le clavier
     * @param sectionIds Liste des IDs des sections pour la navigation
     */
    static setUpSectionNavigation(sectionIds: string[]): () => void {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Alt + flèches pour naviguer entre sections
        if (e.altKey) {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            
            // Trouver l'index de la section actuelle
            const currentSection = sectionIds.find(id => 
              document.getElementById(id)?.contains(document.activeElement as Node)
            );
            
            if (currentSection) {
              const currentIndex = sectionIds.indexOf(currentSection);
              let nextIndex;
              
              if (e.key === 'ArrowDown') {
                nextIndex = (currentIndex + 1) % sectionIds.length;
              } else {
                nextIndex = (currentIndex - 1 + sectionIds.length) % sectionIds.length;
              }
              
              // Focus sur la prochaine section
              const nextSection = document.getElementById(sectionIds[nextIndex]);
              if (nextSection) {
                const focusableElement = nextSection.querySelector<HTMLElement>(this.focusableElements);
                if (focusableElement) {
                  focusableElement.focus();
                } else {
                  nextSection.tabIndex = -1;
                  nextSection.focus();
                }
              }
            }
          }
        }
      };
      
      // Ajouter l'écouteur d'événements
      document.addEventListener('keydown', handleKeyDown);
      
      // Retourner une fonction pour nettoyer
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }