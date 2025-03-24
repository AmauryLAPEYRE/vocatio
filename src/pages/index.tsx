// src/pages/index.tsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Stepper } from '@/components/common/Stepper';
import { CVUploader } from '@/components/cv/CVUploader';
import { JobUploader } from '@/components/job/JobUploader';
import { MatchAnalysis } from '@/components/matcher/MatchAnalysis';
import { HTMLBasedCVOptimizer } from '@/components/cv/HTMLBasedCVOptimizer'; // Nouveau composant
import { LetterGenerator } from '@/components/letter/LetterGenerator';
import { DocumentsExporter } from '@/components/export/DocumentsExporter';
import { useStore, useCVStore, useJobStore, useMatchingStore, useLetterStore } from '@/store';

// Définition des étapes du flux utilisateur
const STEPS = [
  { id: 'upload-cv', label: 'Importer CV' },
  { id: 'upload-job', label: 'Importer offre' },
  { id: 'analyze', label: 'Analyse' },
  { id: 'optimize-cv', label: 'Optimiser CV' },
  { id: 'create-letter', label: 'Lettre de motivation' },
  { id: 'export', label: 'Exporter documents' },
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Utiliser le store combiné pour obtenir les états dérivés
  const { hasCV, hasJobOffer, hasAnalysis, hasOptimizedCV, hasCoverLetter } = useStore();
  
  // Initialiser les états dérivés côté client uniquement
  useEffect(() => {
    const cvState = useCVStore.getState();
    const jobState = useJobStore.getState();
    const matchingState = useMatchingStore.getState();
    const letterState = useLetterStore.getState();
    
    useStore.setState({
      hasCV: cvState.originalContent !== null,
      hasJobOffer: jobState.content !== null,
      hasAnalysis: matchingState.analyzed,
      hasOptimizedCV: cvState.optimizedContent !== null,
      hasCoverLetter: letterState.content !== null
    });
  }, []);

  // Vérifie si l'utilisateur peut passer à l'étape suivante
  const canProceed = () => {
    switch (currentStep) {
      case 0: return hasCV;
      case 1: return hasJobOffer;
      case 2: return hasAnalysis;
      case 3: return hasOptimizedCV;
      case 4: return hasCoverLetter;
      default: return true;
    }
  };

  // Navigation entre les étapes
  const goToNextStep = () => {
    if (currentStep < STEPS.length - 1 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Rendu conditionnel basé sur l'étape actuelle
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <CVUploader onComplete={goToNextStep} />;
      case 1:
        return <JobUploader onComplete={goToNextStep} />;
      case 2:
        return <MatchAnalysis onComplete={goToNextStep} />;
      case 3:
        // Utiliser le nouveau optimiseur qui préserve le format
        return <HTMLBasedCVOptimizer onComplete={goToNextStep} />;
      case 4:
        return <LetterGenerator onComplete={goToNextStep} />;
      case 5:
        return <DocumentsExporter />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Head>
        <title>Vocatio - Optimisez votre CV et lettres de motivation</title>
        <meta name="description" content="Optimisez votre CV tout en préservant exactement son format visuel et créez des lettres de motivation personnalisées" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-blue-700 mb-2">Vocatio</h1>
          <p className="text-gray-600">Optimisez votre CV en préservant sa mise en page et créez des lettres de motivation ciblées</p>
        </header>

        <Stepper steps={STEPS} currentStep={currentStep} onChange={setCurrentStep} />

        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          {renderStepContent()}
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={goToPreviousStep}
            disabled={currentStep === 0}
            className="px-6 py-2 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          
          {currentStep < STEPS.length - 1 && (
            <button
              onClick={goToNextStep}
              disabled={!canProceed()}
              className="px-6 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          )}
        </div>
      </main>

      <footer className="text-center py-6 text-gray-500 text-sm">
        © {new Date().getFullYear()} Vocatio - Tous droits réservés
      </footer>
    </div>
  );
}