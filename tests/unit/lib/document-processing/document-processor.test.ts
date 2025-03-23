// tests/unit/lib/document-processing/document-processor.test.ts
import { processDocument } from '@/lib/document-processing/document-processor';
import { processPDFDocument } from '@/lib/document-processing/pdf-processor';
import { processDOCXDocument } from '@/lib/document-processing/docx-processor';

// Mock des modules externes
jest.mock('@/lib/document-processing/pdf-processor', () => ({
  processPDFDocument: jest.fn()
}));

jest.mock('@/lib/document-processing/docx-processor', () => ({
  processDOCXDocument: jest.fn()
}));

describe('Document Processor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('processes PDF files', async () => {
    const mockPdfResult = { text: 'PDF content' };
    (processPDFDocument as jest.Mock).mockResolvedValue(mockPdfResult);
    
    const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' });
    const result = await processDocument(mockFile);
    
    expect(processPDFDocument).toHaveBeenCalledWith(mockFile);
    expect(result).toEqual(mockPdfResult);
  });
  
  test('processes DOCX files', async () => {
    const mockDocxResult = { text: 'DOCX content', html: '<p>DOCX content</p>' };
    (processDOCXDocument as jest.Mock).mockResolvedValue(mockDocxResult);
    
    const mockFile = new File([''], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const result = await processDocument(mockFile);
    
    expect(processDOCXDocument).toHaveBeenCalledWith(mockFile);
    expect(result).toEqual(mockDocxResult);
  });
  
  test('throws error for unsupported file types', async () => {
    const mockFile = new File([''], 'test.txt', { type: 'text/plain' });
    
    await expect(processDocument(mockFile)).rejects.toThrow('Format de fichier non pris en charge');
  });
});