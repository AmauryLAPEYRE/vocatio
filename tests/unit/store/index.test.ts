// tests/unit/store/index.test.ts
import { useStore } from '@/store';
import { useCVStore } from '@/store/cv-store';
import { useJobStore } from '@/store/job-store';
import { useMatchingStore } from '@/store/matching-store';
import { useLetterStore } from '@/store/letter-store';
import { renderHook } from '@testing-library/react-hooks';

// Mocks des stores individuels
jest.mock('@/store/cv-store', () => ({
  useCVStore: jest.fn()
}));

jest.mock('@/store/job-store', () => ({
  useJobStore: jest.fn()
}));

jest.mock('@/store/matching-store', () => ({
  useMatchingStore: jest.fn()
}));

jest.mock('@/store/letter-store', () => ({
  useLetterStore: jest.fn()
}));

describe('Combined Store', () => {
  // Initialiser les mocks des stores individuels
  const mockCVState = {
    originalContent: { text: 'CV content' },
    fileName: 'cv.pdf',
    setOriginalCV: jest.fn(),
    reset: jest.fn()
  };
  
  const mockJobState = {
    content: { text: 'Job offer' },
    jobTitle: 'Developer',
    setJobData: jest.fn(),
    reset: jest.fn()
  };
  
  const mockMatchingState = {
    analyzed: true,
    matchingScore: 85,
    setMatchingData: jest.fn(),
    reset: jest.fn()
  };
  
  const mockLetterState = {
    content: 'Cover letter',
    style: 'professional',
    setLetterContent: jest.fn(),
    reset: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurer les mocks des stores
    (useCVStore as jest.Mock).mockReturnValue(mockCVState);
    (useJobStore as jest.Mock).mockReturnValue(mockJobState);
    (useMatchingStore as jest.Mock).mockReturnValue(mockMatchingState);
    (useLetterStore as jest.Mock).mockReturnValue(mockLetterState);
  });
  
  test('combines all stores correctly', () => {
    // Appeler le hook sans sélecteur pour avoir tous les stores
    const { result } = renderHook(() => useStore());
    
    // Vérifier que tous les stores sont présents
    expect(result.current).toHaveProperty('cv');
    expect(result.current).toHaveProperty('job');
    expect(result.current).toHaveProperty('matching');
    expect(result.current).toHaveProperty('letter');
    
    // Vérifier que les states des stores sont correctement accessibles
    expect(result.current.cv.fileName).toBe('cv.pdf');
    expect(result.current.job.jobTitle).toBe('Developer');
    expect(result.current.matching.matchingScore).toBe(85);
    expect(result.current.letter.style).toBe('professional');
  });
  
  test('applies selector correctly', () => {
    // Appeler le hook avec un sélecteur
    const { result } = renderHook(() => 
      useStore((state) => ({
        fileName: state.cv.fileName,
        jobTitle: state.job.jobTitle,
        score: state.matching.matchingScore
      }))
    );
    
    // Vérifier que seules les propriétés sélectionnées sont présentes
    expect(result.current).toHaveProperty('fileName', 'cv.pdf');
    expect(result.current).toHaveProperty('jobTitle', 'Developer');
    expect(result.current).toHaveProperty('score', 85);
    expect(result.current).not.toHaveProperty('cv');
    expect(result.current).not.toHaveProperty('job');
  });
});