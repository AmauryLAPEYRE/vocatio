// src/store/matching-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MatchingStore } from 'src/types/matching.types';

const initialState: Omit<MatchingStore, 'setMatchingData' | 'reset'> = {
  analyzed: false,
  matchingScore: null,
  analysis: null,
  matchedSkills: null,
  tokenUsage: null
};

export const useMatchingStore = create<MatchingStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setMatchingData: (data) => set((state) => ({
        ...state,
        ...data
      })),
      
      reset: () => set(initialState)
    }),
    {
      name: 'vocatio-matching-storage'
    }
  )
);
