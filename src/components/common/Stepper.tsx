// src/components/common/Stepper.tsx
import React from 'react';

interface Step {
  id: string;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onChange?: (step: number) => void;
}

export function Stepper({ steps, currentStep, onChange }: StepperProps) {
  return (
    <div className="py-4">
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onChange && index <= currentStep;
          
          return (
            <li 
              key={step.id} 
              className={`flex items-center ${index < steps.length - 1 ? 'w-full' : ''}`}
            >
              <button 
                onClick={() => isClickable && onChange(index)}
                disabled={!isClickable}
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  isCompleted ? 'bg-blue-600 text-white' : 
                  isCurrent ? 'bg-blue-100 text-blue-800 border-2 border-blue-600' : 
                  'bg-gray-100 text-gray-500'
                } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
              
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              )}
              
              <span className={`absolute mt-16 text-xs ${
                isCurrent ? 'text-blue-800 font-medium' : 
                isCompleted ? 'text-gray-700' : 
                'text-gray-400'
              }`} style={{ transform: 'translateX(-50%)', left: `${(index / (steps.length - 1)) * 100}%` }}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}