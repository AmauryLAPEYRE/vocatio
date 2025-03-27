// src/components/layout/AppHeader.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/appStore';

export const AppHeader: React.FC = () => {
  const { reset } = useAppStore();
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" onClick={reset} className="text-2xl font-bold text-blue-600 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8 mr-2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          Vocatio
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          <a href="#comment-ca-marche" className="text-gray-600 hover:text-blue-600 transition-colors">
            Comment ça marche
          </a>
          <a href="#avantages" className="text-gray-600 hover:text-blue-600 transition-colors">
            Avantages
          </a>
          <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">
            Contact
          </a>
        </nav>
        
        <div>
          <Link 
            href="/"
            onClick={reset}
            className="py-2 px-4 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Recommencer
          </Link>
        </div>
      </div>
    </header>
  );
};