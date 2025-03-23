// src/store/index.ts
import { useCVStore } from './cv-store';
import { useJobStore } from './job-store';
import { useMatchingStore } from './matching-store';
import { useLetterStore } from './letter-store';
import { create } from 'zustand';

// Type pour l'état combiné
type CombinedState = {
  // Propriétés de convenance calculées
  hasCV: boolean;
  hasJobOffer: boolean;
  hasAnalysis: boolean;
  hasOptimizedCV: boolean;
  hasCoverLetter: boolean;
};

// Créer le hook store combiné
export const useStore = create<CombinedState>(() => ({
  hasCV: false,
  hasJobOffer: false,
  hasAnalysis: false,
  hasOptimizedCV: false,
  hasCoverLetter: false
}));

// Mettre à jour le store combiné lorsque les stores individuels changent
if (typeof window !== 'undefined') {
  // S'assurer que ce code s'exécute uniquement côté client
  useCVStore.subscribe((state) => {
    useStore.setState({
      hasCV: state.originalContent !== null,
      hasOptimizedCV: state.optimizedContent !== null
    });
  });

  useJobStore.subscribe((state) => {
    useStore.setState({
      hasJobOffer: state.content !== null
    });
  });

  useMatchingStore.subscribe((state) => {
    useStore.setState({
      hasAnalysis: state.analyzed
    });
  });

  useLetterStore.subscribe((state) => {
    useStore.setState({
      hasCoverLetter: state.content !== null
    });
  });
}

// Exporter également les stores individuels
export { useCVStore, useJobStore, useMatchingStore, useLetterStore };