// app/page.js
'use client';

import { useState, useEffect } from 'react';
import { useVocatioStore } from '@/store';
import FileUploadZone from '@/components/FileUploadZone';
import JobDescriptionInput from '@/components/JobDescriptionInput';
import DocumentComparison from '@/components/DocumentComparison';
import LoadingIndicator from '@/components/LoadingIndicator';
import Header from '@/components/Header';
import OptimizationMetrics from '@/components/OptimizationMetrics';
import ExportOptions from '@/components/ExportOptions';

export default function Home() {
  const { 
    processingStep,
    uploadError,
    setUploadError,
    resetErrors,
    uploadAndAnalyzeDocument,
    optimizeContent,
    exportDocument,
    goToPreviousStep,
    resetApplication
  } = useVocatioStore();
  
  const [jobDescription, setJobDescription] = useState('');
  
  // Réinitialiser les erreurs lors du changement d'étape
  useEffect(() => {
    resetErrors();
  }, [processingStep, resetErrors]);
  
  // Gérer l'upload et l'analyse du document
  const handleFileUpload = async (file) => {
    if (!file) return;
    
    try {
      await uploadAndAnalyzeDocument(file);
    } catch (error) {
      setUploadError(error.message || 'Erreur lors de l\'analyse du document');
    }
  };
  
  // Gérer la soumission de l'offre d'emploi
  const handleJobSubmit = async () => {
    if (!jobDescription.trim()) {
      setUploadError('Veuillez saisir une description de poste');
      return;
    }
    
    try {
      await optimizeContent(jobDescription);
    } catch (error) {
      setUploadError(error.message || 'Erreur lors de l\'optimisation du contenu');
    }
  };
  
  // Gérer l'export du document
  const handleExport = async (format = 'pdf') => {
    try {
      await exportDocument(format);
    } catch (error) {
      setUploadError(error.message || 'Erreur lors de l\'export du document');
    }
  };
  
  // Gérer la réinitialisation complète
  const handleReset = () => {
    if (window.confirm('Voulez-vous vraiment recommencer? Toutes les données seront perdues.')) {
      resetApplication();
      setJobDescription('');
    }
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header 
        currentStep={processingStep} 
        onReset={handleReset}
      />
      
      <div className="container mx-auto px-4 py-8">
        {uploadError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">Erreur</p>
            <p>{uploadError}</p>
          </div>
        )}
        
        {/* Étape 1: Upload du CV */}
        {processingStep === 'upload' && (
          <FileUploadZone 
            onFileUpload={handleFileUpload}
          />
        )}
        
        {/* Étape 2: Analyse en cours */}
        {processingStep === 'analyzing' && (
          <LoadingIndicator 
            message="Analyse avancée du document en cours..."
            progress={0.3}
            details="Extraction de la structure, reconnaissance des sections et détection des éléments modifiables"
          />
        )}
        
        {/* Étape 3: Saisie de l'offre d'emploi */}
        {processingStep === 'jobInput' && (
          <JobDescriptionInput
            value={jobDescription}
            onChange={setJobDescription}
            onSubmit={handleJobSubmit}
            onBack={goToPreviousStep}
          />
        )}
        
        {/* Étape 4: Optimisation en cours */}
        {processingStep === 'optimizing' && (
          <LoadingIndicator 
            message="Optimisation intelligente du contenu en cours..."
            progress={0.7}
            details="Adaptation du contenu pour correspondre à l'offre tout en respectant la mise en page originale"
          />
        )}
        
        {/* Étape 5: Comparaison et prévisualisation */}
        {processingStep === 'comparing' && (
          <div className="space-y-8">
            <DocumentComparison
              onExport={() => exportDocument()}
              onBack={goToPreviousStep}
            />
            
            <OptimizationMetrics />
          </div>
        )}
        
        {/* Étape 6: Options d'export */}
        {processingStep === 'exporting' && (
          <ExportOptions
            onExport={handleExport}
            onBack={goToPreviousStep}
          />
        )}
      </div>
    </main>
  );
}