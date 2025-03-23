// src/store/job-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { JobStore } from 'src/types/job.types';

const initialState: Omit<JobStore, 'setJobData' | 'setJobSkills' | 'setJobRequirements' | 'reset'> = {
  content: null,
  companyName: null,
  jobTitle: null,
  jobLocation: null,
  skills: null,
  requirements: null,
  uploadDate: null
};

export const useJobStore = create<JobStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setJobData: (data) => set((state) => ({
        ...state,
        ...data
      })),
      
      setJobSkills: (skills) => set((state) => ({
        ...state,
        skills
      })),
      
      setJobRequirements: (requirements) => set((state) => ({
        ...state,
        requirements
      })),
      
      reset: () => set(initialState)
    }),
    {
      name: 'vocatio-job-storage',
      partialize: (state) => ({
        // Ne pas persister le contenu original (potentiellement volumineux)
        companyName: state.companyName,
        jobTitle: state.jobTitle,
        jobLocation: state.jobLocation,
        skills: state.skills,
        requirements: state.requirements,
        uploadDate: state.uploadDate
      })
    }
  )
);