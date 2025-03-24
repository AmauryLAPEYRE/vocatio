// src/pages/_app.tsx
import React, { useEffect } from 'react';
import Head from 'next/head';
import { ToastProvider } from '@/hooks/useToast';
import { initApp } from '@/lib/init';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  // Initialiser l'application au montage du composant
  useEffect(() => {
    // Initialiser l'application avec les configurations nécessaires
    initApp();
    
    // Enregistrement des événements d'accessibilité
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        // Ajouter une classe pour montrer les outlines de focus seulement quand nécessaire
        document.body.classList.add('user-is-tabbing');
      }
    };
    
    const handleMouseDown = () => {
      // Retirer la classe quand l'utilisateur utilise la souris
      document.body.classList.remove('user-is-tabbing');
    };
    
    // Ajouter les écouteurs d'événements
    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('mousedown', handleMouseDown);
    
    // Nettoyage des écouteurs d'événements
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
  
  return (
    <>
      <Head>
        <title>Vocatio - Optimisation de CV et lettres de motivation</title>
        <meta name="description" content="Application d'optimisation de CV et génération de lettres de motivation personnalisées" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Préchargement du worker PDF.js */}
        <link
          rel="preload"
          href="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
          as="script"
          crossOrigin="anonymous"
        />
        
        {/* Polices Google */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
          rel="stylesheet"
        />
      </Head>
      
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </>
  );
}