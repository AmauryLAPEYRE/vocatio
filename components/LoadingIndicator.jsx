// components/LoadingIndicator.jsx
'use client';

import { useEffect, useState } from 'react';

export default function LoadingIndicator({ message, details, progress = 0 }) {
  const [currentProgress, setCurrentProgress] = useState(progress);
  const [randomFacts, setRandomFacts] = useState([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  
  // Liste de faits intéressants sur l'IA et l'optimisation de CV
  const allFacts = [
    "L'IA de Vocatio 2.0 peut analyser plus de 100 éléments structurels dans un CV.",
    "LayoutLM utilise à la fois le texte et la disposition visuelle pour comprendre les documents.",
    "Un CV bien optimisé peut augmenter vos chances d'entretien de plus de 60%.",
    "L'IA préserve fidèlement votre mise en page tout en adaptant le contenu.",
    "Les recruteurs passent en moyenne 7 secondes sur un CV lors du premier tri.",
    "Vocatio 2.0 identifie automatiquement les sections de votre CV sans balisage.",
    "Le modèle LayoutLM a été entraîné sur plus de 11 millions de documents.",
    "L'optimisation spatiale garantit que votre CV conserve son équilibre visuel.",
    "Les algorithmes d'adaptation de contenu respectent scrupuleusement les contraintes d'espace.",
    "Plus de 80% des entreprises utilisent des ATS (systèmes de suivi des candidatures).",
    "Vocatio 2.0 est capable de traiter des mises en page multi-colonnes complexes.",
    "La préservation précise des polices et des couleurs maintient votre identité visuelle."
  ];
  
  // Sélection de faits aléatoires
  useEffect(() => {
    const getRandomFacts = () => {
      const shuffled = [...allFacts].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 5);
    };
    
    setRandomFacts(getRandomFacts());
  }, []);
  
  // Rotation des faits
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIndex(prev => (prev + 1) % randomFacts.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [randomFacts]);
  
  // Animation de progression
  useEffect(() => {
    // Simuler une progression continue
    const startValue = progress;
    const targetValue = Math.min(0.95, progress + 0.5);
    const duration = 15000; // 15 secondes
    const startTime = Date.now();
    
    const updateProgress = () => {
      const elapsedTime = Date.now() - startTime;
      const progressRatio = Math.min(1, elapsedTime / duration);
      
      // Fonction easing pour une progression plus naturelle
      const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progressRatio);
      
      const newProgress = startValue + (targetValue - startValue) * easedProgress;
      setCurrentProgress(newProgress);
      
      if (progressRatio < 1) {
        requestAnimationFrame(updateProgress);
      }
    };
    
    const animationFrame = requestAnimationFrame(updateProgress);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [progress]);
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      <div className="flex flex-col items-center">
        {/* Animation */}
        <div className="w-24 h-24 mb-6">
          <svg
            className="animate-spin -ml-1 mr-3 h-24 w-24 text-primary-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        
        {/* Message principal */}
        <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
          {message}
        </h3>
        
        {/* Détails */}
        <p className="text-gray-500 text-center mb-6 max-w-md">
          {details}
        </p>
        
        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${currentProgress * 100}%` }}
          ></div>
        </div>
        
        {/* Fait aléatoire */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 max-w-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                {randomFacts[currentFactIndex]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}