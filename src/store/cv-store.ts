// src/store/cv-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CVStore } from 'src/types/cv.types';

const initialState: Omit<CVStore, 'setOriginalCV' | 'setOptimizedCV' | 'reset'> = {
  originalContent: null,
  optimizedContent: null,
  fileName: null,
  fileType: null,
  uploadDate: null
};

export const useCVStore = create<CVStore>()(
  persist(
    (set) => ({
      ...initialState,
      
      setOriginalCV: (data) => set((state) => ({
        ...state,
        originalContent: data.originalContent,
        fileName: data.fileName,
        fileType: data.fileType,
        uploadDate: data.uploadDate
      })),
      
      setOptimizedCV: (data) => set((state) => ({
        ...state,
        optimizedContent: data
      })),
      
      reset: () => set(initialState)
    }),
    {
      name: 'vocatio-cv-storage',
      partialize: (state) => ({
        // Ne pas persister le contenu original (potentiellement volumineux)
        fileName: state.fileName,
        fileType: state.fileType,
        uploadDate: state.uploadDate
      })
    }
  )
);