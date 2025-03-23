// src/types/matching.types.ts
export interface MatchingData {
  analyzed: boolean;
  matchingScore: number | null;
  analysis: string | null;
  matchedSkills: {
    skill: string;
    inCV: boolean;
    inJob: boolean;
    relevant: boolean;
  }[] | null;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  } | null;
}

export interface MatchingStore extends MatchingData {
  // Actions
  setMatchingData: (data: Partial<MatchingData>) => void;
  reset: () => void;
}