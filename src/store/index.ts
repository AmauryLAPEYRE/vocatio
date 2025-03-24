// src/store/index.ts
import { useCVStore } from './cv-store';
import { useJobStore } from './job-store';
import { useMatchingStore } from './matching-store';
import { useLetterStore } from './letter-store';
import { create } from 'zustand';
import { CVStore } from 'src/types/cv.types';
import { JobStore } from 'src/types/job.types';
import { MatchingStore } from 'src/types/matching.types';
import { LetterStore } from 'src/types/letter.types';

// Type pour l'état combiné
type CombinedState = {
  // Propriétés de convenance calculées
  hasCV: boolean;
  hasJobOffer: boolean;
  hasAnalysis: boolean;
  hasOptimizedCV: boolean;
  hasCoverLetter: boolean;
  
  // Stores individuels
  cv: Omit<CVStore, 'setOriginalCV' | 'setOptimizedCV' | 'reset'>;
  job: Omit<JobStore, 'setJobData' | 'setJobSkills' | 'setJobRequirements' | 'reset'>;
  matching: Omit<MatchingStore, 'setMatchingData' | 'reset'>;
  letter: Omit<LetterStore, 'setLetterContent' | 'updateLetterContent' | 'reset'>;
};

// Créer le hook store combiné
export const useStore = create<CombinedState>(() => ({
  hasCV: false,
  hasJobOffer: false,
  hasAnalysis: false,
  hasOptimizedCV: false,
  hasCoverLetter: false,
  
  // Initialiser les stores individuels avec leurs valeurs par défaut
  cv: {
    originalContent: null,
    optimizedContent: null,
    fileName: null,
    fileType: null,
    uploadDate: null
  },
  job: {
    content: null,
    companyName: null,
    jobTitle: null,
    jobLocation: null,
    skills: null,
    requirements: null,
    uploadDate: null
  },
  matching: {
    analyzed: false,
    matchingScore: null,
    analysis: null,
    matchedSkills: null,
    tokenUsage: null
  },
  letter: {
    content: null,
    style: null,
    generationDate: null,
    customizations: null,
    tokenUsage: null
  }
}));

// Mettre à jour le store combiné lorsque les stores individuels changent
if (typeof window !== 'undefined') {
  // S'assurer que ce code s'exécute uniquement côté client
  useCVStore.subscribe((state) => {
    useStore.setState({
      hasCV: state.originalContent !== null,
      hasOptimizedCV: state.optimizedContent !== null,
      cv: {
        originalContent: state.originalContent,
        optimizedContent: state.optimizedContent,
        fileName: state.fileName,
        fileType: state.fileType,
        uploadDate: state.uploadDate
      }
    });
  });

  useJobStore.subscribe((state) => {
    useStore.setState({
      hasJobOffer: state.content !== null,
      job: {
        content: state.content,
        companyName: state.companyName,
        jobTitle: state.jobTitle,
        jobLocation: state.jobLocation,
        skills: state.skills,
        requirements: state.requirements,
        uploadDate: state.uploadDate
      }
    });
  });

  useMatchingStore.subscribe((state) => {
    useStore.setState({
      hasAnalysis: state.analyzed,
      matching: {
        analyzed: state.analyzed,
        matchingScore: state.matchingScore,
        analysis: state.analysis,
        matchedSkills: state.matchedSkills,
        tokenUsage: state.tokenUsage
      }
    });
  });

  useLetterStore.subscribe((state) => {
    useStore.setState({
      hasCoverLetter: state.content !== null,
      letter: {
        content: state.content,
        style: state.style,
        generationDate: state.generationDate,
        customizations: state.customizations,
        tokenUsage: state.tokenUsage
      }
    });
  });
}

// Exporter également les stores individuels
export { useCVStore, useJobStore, useMatchingStore, useLetterStore };