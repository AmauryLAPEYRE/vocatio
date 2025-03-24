// components/Header.jsx
'use client';

import { useState } from 'react';
import {
  DocumentArrowUpIcon,
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

export default function Header({ currentStep, onReset }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Configuration des étapes du processus
  const steps = [
    { 
      id: 'upload', 
      name: 'Upload CV',
      description: 'Téléchargez votre CV',
      icon: DocumentArrowUpIcon
    },
    { 
      id: 'analyzing', 
      name: 'Analyse',
      description: 'Analyse du document',
      icon: DocumentMagnifyingGlassIcon
    },
    { 
      id: 'jobInput', 
      name: 'Offre d\'emploi',
      description: 'Saisissez l\'offre d\'emploi',
      icon: DocumentTextIcon
    },
    { 
      id: 'optimizing', 
      name: 'Optimisation',
      description: 'Optimisation du contenu',
      icon: ArrowPathIcon
    },
    { 
      id: 'comparing', 
      name: 'Comparaison',
      description: 'Prévisualisation des changements',
      icon: ArrowsRightLeftIcon
    },
    { 
      id: 'exporting', 
      name: 'Export',
      description: 'Export du document final',
      icon: DocumentDuplicateIcon
    }
  ];
  
  // Trouver l'étape active
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo et nom */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold h-10 w-10 rounded-lg flex items-center justify-center">
              V2
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Vocatio 2.0</h1>
              <p className="text-sm text-gray-500">Optimisation intelligente de CV</p>
            </div>
          </div>
          
          {/* Menu sur mobile */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            
            {isMenuOpen && (
              <div className="absolute top-16 right-4 bg-white shadow-lg rounded-lg z-10 p-4 w-56">
                <button
                  onClick={onReset}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Recommencer
                </button>
              </div>
            )}
          </div>
          
          {/* Actions sur desktop */}
          <div className="hidden md:block">
            <button
              onClick={onReset}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Recommencer
            </button>
          </div>
        </div>
        
        {/* Indicateur de progression */}
        <div className="hidden md:block mt-6">
          <div className="flex items-center">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center">
                  {/* Ligne de connexion (sauf pour le premier élément) */}
                  {index > 0 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isCompleted ? 'bg-primary-500' : 'bg-gray-200'
                      }`}
                      style={{ width: '2rem' }}
                    />
                  )}
                  
                  {/* Point de progression */}
                  <div
                    className={`flex items-center justify-center h-8 w-8 rounded-full ${
                      isActive
                        ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-500'
                        : isCompleted
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <StepIcon className="h-4 w-4" />
                  </div>
                  
                  {/* Texte de l'étape */}
                  <div className={index === 0 ? 'ml-0' : 'ml-2'}>
                    <p
                      className={`text-xs font-medium ${
                        isActive ? 'text-primary-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Indicateur de progression mobile */}
        <div className="mt-4 md:hidden">
          <div className="bg-gray-200 h-2 rounded-full">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-center text-sm font-medium text-gray-700">
            {steps[currentStepIndex].name}
          </div>
        </div>
      </div>
    </header>
  );
}