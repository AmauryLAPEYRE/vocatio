// src/store/letter-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LetterStore } from 'amos/types/letter.types';

const initialState: Omit<LetterStore, 'setLetterContent' | 'updateLetterContent' | 'reset'> = {
  content: null,
  style: null,
  generationDate: null,
  customizations: null,
  tokenUsage: null
};

export const useLetterStore = create<LetterStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setLetterContent: (data) => set((state) => ({
        ...state,
        content: data.content,
        style: data.style,
        generationDate: data.generationDate,
        customizations: data.customizations,
        tokenUsage: data.tokenUsage
      })),
      
      updateLetterContent: (content) => set((state) => ({
        ...state,
        content
      })),
      
      reset: () => set(initialState)
    }),
    {
      name: 'vocatio-letter-storage'
    }
  )
);