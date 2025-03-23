// tests/unit/lib/document-processing/pdf-processor.test.ts
import { processPDFDocument } from '@/lib/document-processing/pdf-processor';
import * as pdfjs from 'pdfjs-dist';

// Mock de pdfjs
jest.mock('pdfjs-dist', () => {
  return {
    getDocument: jest.fn(),
    GlobalWorkerOptions: {
      workerSrc: null
    }
  };
});

describe('PDF Processor', () => {
  // Configuration des mocks
  const mockPdfDocument = {
    getMetadata: jest.fn(),
    numPages: 2,
    getPage: jest.fn()
  };
  
  const mockTextContent = {
    items: [
      { str: 'Titre CV', transform: [20, 0, 0, 20, 0, 0], fontName: 'Bold' },
      { str: 'Développeur', transform: [12, 0, 0, 12, 0, 0], fontName: 'Regular' },
      { str: 'React', transform: [10, 0, 0, 10, 0, 0], fontName: 'Regular' },
      { str: 'Expérience', transform: [16, 0, 0, 16, 0, 0], fontName: 'Bold' },
      { str: 'Javascript', transform: [10, 0, 0, 10, 0, 0], fontName: 'Regular' }
    ]
  };
  
  const mockPage = {
    getTextContent: jest.fn().mockResolvedValue(mockTextContent)
  };
  
  const mockMetadata = {
    info: {
      Title: 'Test CV',
      Author: 'John Doe',
      CreationDate: '2023-01-01T00:00:00Z'
    }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurer les mocks pour les tests
    mockPdfDocument.getMetadata.mockResolvedValue(mockMetadata);
    mockPdfDocument.getPage.mockResolvedValue(mockPage);
    
    const mockLoadingTask = {
      promise: Promise.resolve(mockPdfDocument)
    };
    
    (pdfjs.getDocument as jest.Mock).mockReturnValue(mockLoadingTask);
  });
  
  test('processes PDF file correctly', async () => {
    // Créer un mock de File
    const mockArrayBuffer = new ArrayBuffer(8);
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      name: 'test.pdf',
      type: 'application/pdf'
    } as unknown as File;
    
    // Appeler la fonction à tester
    const result = await processPDFDocument(mockFile);
    
    // Vérifier que pdfjs a été appelé correctement
    expect(pdfjs.getDocument).toHaveBeenCalledWith({ data: mockArrayBuffer });
    expect(mockPdfDocument.getMetadata).toHaveBeenCalled();
    expect(mockPdfDocument.getPage).toHaveBeenCalledTimes(2); // 2 pages
    
    // Vérifier que le résultat est formaté correctement
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('metadata');
    expect(result).toHaveProperty('structure');
    expect(result.metadata.title).toBe('Test CV');
    expect(result.metadata.author).toBe('John Doe');
    expect(result.metadata.format).toBe('pdf');
    expect(result.metadata.pageCount).toBe(2);
    
    // Vérifier que des mots-clés ont été extraits
    expect(result.structure.keywords).toContain('react');
    expect(result.structure.keywords).toContain('javascript');
    expect(result.structure.keywords).toContain('développeur');
    
    // Vérifier que des sections ont été identifiées
    expect(result.structure.sections.length).toBeGreaterThan(0);
    expect(result.structure.sections[0].title).toBe('Titre CV');
  });
  
  test('handles PDF processing errors', async () => {
    // Simuler une erreur lors du traitement
    (pdfjs.getDocument as jest.Mock).mockImplementation(() => {
      return {
        promise: Promise.reject(new Error('PDF processing error'))
      };
    });
    
    // Créer un mock de File
    const mockArrayBuffer = new ArrayBuffer(8);
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      name: 'test.pdf',
      type: 'application/pdf'
    } as unknown as File;
    
    // Vérifier que l'erreur est capturée et propagée
    await expect(processPDFDocument(mockFile)).rejects.toThrow('Erreur lors du traitement du PDF');
  });
});