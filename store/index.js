// store/index.js
import { create } from 'zustand';

export const useVocatioStore = create((set, get) => ({
  // État de l'application
  processingStep: 'upload', // 'upload' | 'analyzing' | 'jobInput' | 'optimizing' | 'comparing' | 'exporting'
  originalDocument: null,    // Document PDF original
  documentStructure: null,   // Structure analysée du document
  optimizedDocument: null,   // Document optimisé
  jobDescription: '',        // Description de l'offre d'emploi
  optimizationMetrics: null, // Métriques d'optimisation
  uploadError: null,         // Erreur d'upload ou de traitement
  
  // Réinitialiser l'état
  resetApplication: () => set({
    processingStep: 'upload',
    originalDocument: null,
    documentStructure: null,
    optimizedDocument: null,
    jobDescription: '',
    optimizationMetrics: null,
    uploadError: null
  }),
  
  // Gérer les erreurs
  setUploadError: (error) => set({ uploadError: error }),
  resetErrors: () => set({ uploadError: null }),
  
  // Navigation entre les étapes
  setProcessingStep: (step) => set({ processingStep: step }),
  goToPreviousStep: () => {
    const currentStep = get().processingStep;
    
    switch (currentStep) {
      case 'jobInput':
        set({ processingStep: 'upload' });
        break;
      case 'comparing':
        set({ processingStep: 'jobInput' });
        break;
      case 'exporting':
        set({ processingStep: 'comparing' });
        break;
      default:
        break;
    }
  },
  
  // Chargement et analyse de document
  uploadAndAnalyzeDocument: async (file) => {
    try {
      set({ 
        processingStep: 'analyzing',
        originalDocument: file,
        uploadError: null
      });
      
      // Prétraitement côté client avec PDF.js
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      // Générer les rendus visuels pour les 3 premières pages (ou moins)
      const pageRenderings = [];
      const pageCount = Math.min(pdf.numPages, 3);
      
      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
          canvasContext: ctx,
          viewport
        }).promise;
        
        pageRenderings.push(canvas.toDataURL('image/jpeg', 0.8));
      }
      
      // Préparer les données pour l'API
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('pageRenderings', JSON.stringify(pageRenderings));
      
      // Appel à l'API d'analyse
      const response = await fetch('/api/document-analysis', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'analyse du document');
      }
      
      const documentStructure = await response.json();
      
      set({
        documentStructure,
        processingStep: 'jobInput'
      });
      
      return documentStructure;
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      set({ 
        processingStep: 'upload',
        uploadError: error.message || 'Erreur lors de l\'analyse du document'
      });
      throw error;
    }
  },
  
  // Optimisation du contenu
  optimizeContent: async (jobDescription) => {
    try {
      const { documentStructure } = get();
      
      if (!documentStructure) {
        throw new Error('Document non analysé');
      }
      
      set({ 
        processingStep: 'optimizing',
        jobDescription,
        uploadError: null
      });
      
      // Appel à l'API d'optimisation
      const response = await fetch('/api/optimize-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documentStructure,
          jobDescription
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'optimisation du contenu');
      }
      
      const optimizedDocument = await response.json();
      
      set({
        optimizedDocument,
        optimizationMetrics: optimizedDocument.optimizationMetrics,
        processingStep: 'comparing'
      });
      
      return optimizedDocument;
    } catch (error) {
      console.error('Erreur lors de l\'optimisation:', error);
      set({ 
        processingStep: 'jobInput',
        uploadError: error.message || 'Erreur lors de l\'optimisation du contenu'
      });
      throw error;
    }
  },
  
  // Export du document
  exportDocument: async (format = 'pdf') => {
    try {
      const { optimizedDocument } = get();
      
      if (!optimizedDocument) {
        throw new Error('Document non optimisé');
      }
      
      set({ 
        processingStep: 'exporting',
        uploadError: null
      });
      
      // Appel à l'API d'export
      const response = await fetch('/api/export-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documentStructure: optimizedDocument,
          format
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'export');
      }
      
      // Téléchargement du fichier
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `cv-optimisé.${format}`;
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      set({ processingStep: 'comparing' });
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      set({ 
        processingStep: 'comparing',
        uploadError: error.message || 'Erreur lors de l\'export du document'
      });
      throw error;
    }
  }
}));