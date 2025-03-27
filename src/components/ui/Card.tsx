// src/components/ui/Card.tsx
'use client';

import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div className={twMerge("bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden", className)}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div className={twMerge("px-6 py-4 border-b border-gray-200", className)}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardProps> = ({ className, children }) => {
  return (
    <h3 className={twMerge("text-xl font-semibold text-gray-900", className)}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<CardProps> = ({ className, children }) => {
  return (
    <p className={twMerge("text-sm text-gray-500 mt-1", className)}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div className={twMerge("px-6 py-4", className)}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div className={twMerge("px-6 py-4 bg-gray-50 border-t border-gray-200", className)}>
      {children}
    </div>
  );
};