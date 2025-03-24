// src/pages/_app.tsx
import React, { useEffect } from 'react';
import Head from 'next/head';
import { ToastProvider } from '@/hooks/useToast';
import { ResourceLoader } from '@/lib/performance/resource-loader';
import { performanceConfig } from '@/config/performance';
import { SkipToContent } from '@/components/common/SkipToContent';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  // Précharger les ressources au montage de l'application
  useEffect(() => {
    // Précharger les ressources configurées
    ResourceLoader.loadMultiple(performanceConfig.preloadResources)
      .catch(err => console.error('Erreur lors du préchargement des ressources:', err));
    
    // Configuration de PDF.js
    if (typeof window !== 'undefined') {
      import('pdfjs-dist').then(pdfjs => {
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
          console.log('PDF.js worker configuré');
        }
      });
    }
    
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
        
        {/* Préchargement des ressources critiques */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js" as="script" />
        
        {/* Polices */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" 
          rel="stylesheet"
        />
        
        {/* Meta tags pour l'accessibilité et le SEO */}
        <meta name="application-name" content="Vocatio" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Vocatio" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#2563EB" />
      </Head>
      
      {/* Lien d'accessibilité pour sauter au contenu principal */}
      <SkipToContent />
      
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </>
  );
}