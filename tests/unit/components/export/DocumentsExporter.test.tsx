// tests/unit/components/export/DocumentsExporter.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentsExporter } from '@/components/export/DocumentsExporter';
import { useStore } from '@/store';
import { jsPDF } from 'jspdf';

// Mock des dépendances
jest.mock('@/store', () => ({
  useStore: jest.fn()
}));

jest.mock('jspdf', () => {
  return {
    jsPDF: jest.fn().mockImplementation(() => ({
      setFont: jest.fn(),
      setFontSize: jest.fn(),
      text: jest.fn(),
      splitTextToSize: jest.fn().mockReturnValue(['Line 1', 'Line 2']),
      save: jest.fn()
    }))
  };
});

describe('DocumentsExporter Component', () => {
  const mockCVData = {
    optimizedContent: {
      text: 'Optimized CV content',
      originalFormat: 'text',
      optimizationDate: new Date('2023-01-01'),
      tokenUsage: { input: 100, output: 100, total: 200 }
    },
    fileName: 'original-cv.pdf'
  };
  
  const mockJobData = {
    companyName: 'ACME Inc.',
    jobTitle: 'Frontend Developer'
  };
  
  const mockLetterData = {
    content: 'Cover letter content'
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders with both documents available', () => {
    // Configurer le mock du store avec les documents disponibles
    (useStore as jest.Mock).mockReturnValue({
      cv: mockCVData,
      job: mockJobData,
      letter: mockLetterData
    });
    
    render(<DocumentsExporter />);
    
    // Vérifier que les aperçus sont affichés
    expect(screen.getByText('Votre CV optimisé')).toBeInTheDocument();
    expect(screen.getByText('Votre lettre de motivation')).toBeInTheDocument();
    expect(screen.getByText('Optimized CV content')).toBeInTheDocument();
    expect(screen.getByText('Cover letter content')).toBeInTheDocument();
    
    // Vérifier que les boutons d'export sont présents
    expect(screen.getByText('Exporter le CV en PDF')).toBeInTheDocument();
    expect(screen.getByText('Exporter la lettre en PDF')).toBeInTheDocument();
    expect(screen.getByText('Exporter tous les documents')).toBeInTheDocument();
  });
  
  test('shows warnings when documents are not available', () => {
    // Configurer le mock du store sans documents
    (useStore as jest.Mock).mockReturnValue({
      cv: { optimizedContent: null, fileName: null },
      job: {},
      letter: { content: null }
    });
    
    render(<DocumentsExporter />);
    
    // Vérifier que les messages d'avertissement sont affichés
    expect(screen.getByText(/Aucun CV optimisé disponible/)).toBeInTheDocument();
    expect(screen.getByText(/Aucune lettre de motivation disponible/)).toBeInTheDocument();
    
    // Vérifier que le bouton d'export global n'est pas présent
    expect(screen.queryByText('Exporter tous les documents')).not.toBeInTheDocument();
  });
  
  test('exports CV when button is clicked', async () => {
    // Configurer le mock du store avec les documents disponibles
    (useStore as jest.Mock).mockReturnValue({
      cv: mockCVData,
      job: mockJobData,
      letter: mockLetterData
    });
    
    render(<DocumentsExporter />);
    
    // Cliquer sur le bouton d'export de CV
    fireEvent.click(screen.getByText('Exporter le CV en PDF'));
    
    // Vérifier que jsPDF a été utilisé correctement
    await waitFor(() => {
      expect(jsPDF).toHaveBeenCalled();
      const mockJsPdfInstance = (jsPDF as jest.Mock).mock.results[0].value;
      expect(mockJsPdfInstance.setFont).toHaveBeenCalledWith('Helvetica');
      expect(mockJsPdfInstance.text).toHaveBeenCalled();
      expect(mockJsPdfInstance.save).toHaveBeenCalled();
      
      // Vérifier que le message de succès est affiché
      expect(screen.getByText(/CV exporté avec succès/)).toBeInTheDocument();
    });
  });
  
  test('exports letter when button is clicked', async () => {
    // Configurer le mock du store avec les documents disponibles
    (useStore as jest.Mock).mockReturnValue({
      cv: mockCVData,
      job: mockJobData,
      letter: mockLetterData
    });
    
    render(<DocumentsExporter />);
    
    // Cliquer sur le bouton d'export de lettre
    fireEvent.click(screen.getByText('Exporter la lettre en PDF'));
    
    // Vérifier que jsPDF a été utilisé correctement
    await waitFor(() => {
      expect(jsPDF).toHaveBeenCalled();
      const mockJsPdfInstance = (jsPDF as jest.Mock).mock.results[0].value;
      expect(mockJsPdfInstance.setFont).toHaveBeenCalled();
      expect(mockJsPdfInstance.text).toHaveBeenCalled();
      expect(mockJsPdfInstance.save).toHaveBeenCalled();
      
      // Vérifier que le message de succès est affiché
      expect(screen.getByText(/Lettre de motivation exportée avec succès/)).toBeInTheDocument();
    });
  });
  
  test('handles export errors gracefully', async () => {
    // Configurer le mock du store avec les documents disponibles
    (useStore as jest.Mock).mockReturnValue({
      cv: mockCVData,
      job: mockJobData,
      letter: mockLetterData
    });
    
    // Simuler une erreur lors de l'export
    (jsPDF as jest.Mock).mockImplementation(() => ({
      setFont: jest.fn(),
      setFontSize: jest.fn(),
      text: jest.fn(),
      splitTextToSize: jest.fn(),
      save: jest.fn().mockImplementation(() => {
        throw new Error('Export error');
      })
    }));
    
    render(<DocumentsExporter />);
    
    // Cliquer sur le bouton d'export de CV
    fireEvent.click(screen.getByText('Exporter le CV en PDF'));
    
    // Vérifier que le message d'erreur est affiché
    await waitFor(() => {
      expect(screen.getByText(/Une erreur est survenue/)).toBeInTheDocument();
    });
  });
});