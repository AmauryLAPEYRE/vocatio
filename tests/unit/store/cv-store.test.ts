// tests/unit/store/cv-store.test.ts
import { useCVStore } from '@/store/cv-store';
import { act } from '@testing-library/react';

describe('CV Store', () => {
  beforeEach(() => {
    // Reset le store avant chaque test
    useCVStore.setState({
      originalContent: null,
      optimizedContent: null,
      fileName: null,
      fileType: null,
      uploadDate: null
    });
  });
  
  test('initializes with empty state', () => {
    const state = useCVStore.getState();
    expect(state.originalContent).toBeNull();
    expect(state.optimizedContent).toBeNull();
    expect(state.fileName).toBeNull();
    expect(state.fileType).toBeNull();
    expect(state.uploadDate).toBeNull();
  });
  
  test('updates originalCV', () => {
    const mockCV = {
      originalContent: { text: 'Test CV', metadata: { format: 'pdf' } },
      fileName: 'cv.pdf',
      fileType: 'application/pdf',
      uploadDate: new Date('2023-01-01')
    };
    
    act(() => {
      useCVStore.getState().setOriginalCV(mockCV);
    });
    
    const state = useCVStore.getState();
    expect(state.originalContent).toEqual(mockCV.originalContent);
    expect(state.fileName).toBe('cv.pdf');
    expect(state.fileType).toBe('application/pdf');
    expect(state.uploadDate).toEqual(new Date('2023-01-01'));
  });
  
  test('updates optimizedCV', () => {
    const mockOptimizedCV = {
      text: 'Optimized CV',
      originalFormat: 'text',
      optimizationDate: new Date('2023-01-02'),
      tokenUsage: {
        input: 100,
        output: 200,
        total: 300
      }
    };
    
    act(() => {
      useCVStore.getState().setOptimizedCV(mockOptimizedCV);
    });
    
    const state = useCVStore.getState();
    expect(state.optimizedContent).toEqual(mockOptimizedCV);
  });
  
  test('resets state', () => {
    // D'abord définir des valeurs
    act(() => {
      useCVStore.getState().setOriginalCV({
        originalContent: { text: 'Test CV', metadata: { format: 'pdf' } },
        fileName: 'cv.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date()
      });
    });
    
    // Vérifier que les valeurs sont définies
    let state = useCVStore.getState();
    expect(state.fileName).toBe('cv.pdf');
    
    // Reset
    act(() => {
      useCVStore.getState().reset();
    });
    
    // Vérifier que les valeurs sont réinitialisées
    state = useCVStore.getState();
    expect(state.originalContent).toBeNull();
    expect(state.fileName).toBeNull();
  });
});
