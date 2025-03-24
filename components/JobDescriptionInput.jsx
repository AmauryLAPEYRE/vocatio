// components/JobDescriptionInput.jsx
'use client';

import { useState, useEffect } from 'react';
import { BriefcaseIcon, ClipboardIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function JobDescriptionInput({ value, onChange, onSubmit, onBack }) {
  const [description, setDescription] = useState(value || '');
  const [isValid, setIsValid] = useState(false);
  const [isPasted, setIsPasted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Exemple d'offre d'emploi pour la démo
  const exampleJobDescription = `DÉVELOPPEUR FRONTEND REACT
  
Nous recherchons un développeur Frontend React expérimenté pour rejoindre notre équipe produit. Vous serez responsable de la conception et de l'implémentation d'interfaces utilisateur performantes et réactives pour notre plateforme SaaS en pleine croissance.

Responsabilités:
- Développer des interfaces utilisateur modernes et responsives avec React, Next.js et Tailwind CSS
- Collaborer avec les designers UX/UI pour transformer les maquettes en code fonctionnel
- Optimiser les applications pour une performance maximale sur différents appareils
- Implémenter des tests automatisés pour garantir la qualité du code
- Participer aux revues de code et au mentorat des développeurs juniors

Compétences requises:
- Minimum 3 ans d'expérience en développement frontend avec React
- Maîtrise de JavaScript/TypeScript, HTML5 et CSS3
- Expérience avec Next.js, Tailwind CSS et les API REST
- Connaissance des bonnes pratiques d'accessibilité web (WCAG)
- Expérience avec les outils de test comme Jest et React Testing Library
- Compréhension des principes de CI/CD

Qualifications:
- Diplôme en informatique ou domaine connexe (ou expérience équivalente)
- Portfolio de projets React démontrant vos compétences
- Bonne communication et esprit d'équipe
- Anglais professionnel (écrit et oral)

Nous offrons:
- Environnement de travail flexible et à distance
- Équipement de pointe
- Salaire compétitif basé sur l'expérience
- Opportunités de formation continue
`;

  // Validation de la description
  useEffect(() => {
    setIsValid(description.trim().length >= 100);
  }, [description]);
  
  // Gérer le changement de texte
  const handleChange = (e) => {
    setDescription(e.target.value);
    onChange(e.target.value);
  };
  
  // Gérer le collage depuis le presse-papiers
  const handlePaste = (e) => {
    // Le texte sera mis à jour via onChange
    setIsPasted(true);
    
    // Réinitialiser l'indicateur après un délai
    setTimeout(() => {
      setIsPasted(false);
    }, 2000);
  };
  
  // Gérer la soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isValid || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Utiliser l'exemple
  const useExample = () => {
    setDescription(exampleJobDescription);
    onChange(exampleJobDescription);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Saisissez l'offre d'emploi</h2>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">Retour</span>
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <BriefcaseIcon className="h-5 w-5 text-gray-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Comment ça fonctionne ?</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Copiez-collez l'offre d'emploi complète ci-dessous. Vocatio 2.0 analysera les compétences 
                  clés, responsabilités et exigences pour optimiser votre CV en fonction de ce poste spécifique.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description du poste
            </label>
            <div className="relative">
              <textarea
                id="jobDescription"
                name="jobDescription"
                rows={12}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm resize-none"
                placeholder="Collez ici le texte complet de l'offre d'emploi..."
                value={description}
                onChange={handleChange}
                onPaste={handlePaste}
                disabled={isSubmitting}
              />
              
              {isPasted && (
                <div className="absolute top-2 right-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-md animate-fade-in-out">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Texte collé avec succès
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-2 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {description.length} caractères
                {description.length < 100 && " (minimum 100 caractères)"}
              </div>
              
              <button
                type="button"
                onClick={useExample}
                className="inline-flex items-center text-xs text-primary-600 hover:text-primary-800"
              >
                <ClipboardIcon className="h-3 w-3 mr-1" />
                Utiliser un exemple
              </button>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isValid && !isSubmitting
                  ? 'bg-primary-600 hover:bg-primary-700'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Optimisation en cours...
                </>
              ) : (
                'Optimiser mon CV'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// IconComponent manquant dans l'extrait ci-dessus
function CheckCircleIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}