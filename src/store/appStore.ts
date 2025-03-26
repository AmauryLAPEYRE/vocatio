// src/store/appStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CVData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    linkedin?: string;
    website?: string;
    summary: string;
  };
  skills: string[];
  experiences: {
    company: string;
    title: string;
    location?: string;
    startDate: string;
    endDate: string;
    description: string;
    achievements?: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    description?: string;
  }[];
  certifications?: {
    name: string;
    issuer: string;
    date: string;
    description?: string;
  }[];
  languages?: {
    language: string;
    proficiency: string;
  }[];
  projects?: {
    name: string;
    description: string;
    url?: string;
    startDate?: string;
    endDate?: string;
    technologies?: string[];
  }[];
  matchScore?: number;
}

export interface JobData {
  title: string;
  company?: string;
  location?: string;
  description: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  responsibilities?: string[];
  qualifications?: string[];
  educationLevel?: string;
  experienceLevel?: string;
}

export interface AppState {
  // CV data
  originalCV: CVData | null;
  optimizedCV: CVData | null;
  selectedTemplateId: string | null;
  
  // Job data
  jobPosting: JobData | null;
  
  // App state
  currentStep: number;
  isLoading: boolean;
  error: string | null;
  
  // Files
  cvFile: File | null;
  
  // Actions
  setOriginalCV: (cv: CVData | null) => void;
  setOptimizedCV: (cv: CVData | null) => void;
  setJobPosting: (job: JobData | null) => void;
  setSelectedTemplateId: (id: string | null) => void;
  setCurrentStep: (step: number) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCVFile: (file: File | null) => void;
  reset: () => void;
}

// Création du store avec persistance durant la session
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // États initiaux
      originalCV: null,
      optimizedCV: null,
      selectedTemplateId: null,
      jobPosting: null,
      currentStep: 0,
      isLoading: false,
      error: null,
      cvFile: null,
      
      // Actions
      setOriginalCV: (cv) => set({ originalCV: cv }),
      setOptimizedCV: (cv) => set({ optimizedCV: cv }),
      setJobPosting: (job) => set({ jobPosting: job }),
      setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error: error }),
      setCVFile: (file) => set({ cvFile: file }),
      reset: () => set({
        originalCV: null,
        optimizedCV: null,
        selectedTemplateId: null,
        jobPosting: null,
        currentStep: 0,
        error: null,
        cvFile: null,
      }),
    }),
    {
      name: 'vocatio-store',
      // Utilise le stockage de session (disparaît quand on ferme le navigateur)
      // au lieu du localStorage pour respecter la contrainte "sans état"
      getStorage: () => sessionStorage,
    }
  )
);