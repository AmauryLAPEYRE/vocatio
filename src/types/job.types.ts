// src/types/job.types.ts
export interface JobData {
    content: {
      text: string;
      html?: string;
      metadata?: Record<string, any>;
    } | null;
    companyName: string | null;
    jobTitle: string | null;
    jobLocation: string | null;
    skills: string[] | null;
    requirements: string[] | null;
    uploadDate: Date | null;
  }
  
  export interface JobStore extends JobData {
    // Actions
    setJobData: (data: Partial<JobData>) => void;
    setJobSkills: (skills: string[]) => void;
    setJobRequirements: (requirements: string[]) => void;
    reset: () => void;
  }