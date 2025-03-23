// src/types/letter.types.ts
export interface LetterData {
    content: string | null;
    style: string | null;
    generationDate: Date | null;
    customizations: Record<string, boolean> | null;
    tokenUsage: {
      input: number;
      output: number;
      total: number;
    } | null;
  }
  
  export interface LetterStore extends LetterData {
    // Actions
    setLetterContent: (data: Omit<LetterData, 'content'> & { content: string }) => void;
    updateLetterContent: (content: string) => void;
    reset: () => void;
  }
  