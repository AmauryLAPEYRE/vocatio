// src/components/layout/Stepper.tsx
'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/appStore';

const steps = [
  { path: '/', label: 'Import CV' },
  { path: '/job-description', label: 'Offre d\'emploi' },
  { path: '/optimize', label: 'Optimisation' },
  { path: '/templates', label: 'Template' },
  { path: '/preview', label: 'Prévisualisation' },
];

export const Stepper: React.FC = () => {
  const pathname = usePathname();
  const { currentStep } = useAppStore();
  
  // Déterminer l'étape actuelle basée sur l'URL
  const currentPathIndex = steps.findIndex(step => step.path === pathname);
  const activeStep = currentPathIndex !== -1 ? currentPathIndex : currentStep;
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <React.Fragment key={step.path}>
            {/* Étape */}
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                  index <= activeStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index + 1}
              </div>
              <span 
                className={`mt-2 text-xs hidden sm:block ${
                  index <= activeStep ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            
            {/* Connecteur (sauf pour le dernier élément) */}
            {index < steps.length - 1 && (
              <div 
                className={`flex-1 h-1 mx-2 ${
                  index < activeStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};