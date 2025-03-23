// src/types/cv.types.ts
import { DocumentInfo } from 'amos/lib/document-processing/document-processor';

export interface CVData {
  originalContent: DocumentInfo | null;
  optimizedContent: {
    text: string;
    originalFormat: string;
    optimizationDate: Date;
    tokenUsage: {
      input: number;
      output: number;
      total: number;
    };
  } | null;
  fileName: string | null;
  fileType: string | null;
  uploadDate: Date | null;
}

export interface CVStore {
  originalContent: DocumentInfo | null;
  optimizedContent: {
    text: string;
    originalFormat: string;
    optimizationDate: Date;
    tokenUsage: {
      input: number;
      output: number;
      total: number;
    };
  } | null;
  fileName: string | null;
  fileType: string | null;
  uploadDate: Date | null;
  
  // Actions
  setOriginalCV: (data: Pick<CVData, 'originalContent' | 'fileName' | 'fileType' | 'uploadDate'>) => void;
  setOptimizedCV: (data: NonNullable<CVData['optimizedContent']>) => void;
  reset: () => void;
}