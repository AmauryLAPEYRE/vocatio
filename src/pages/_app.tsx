// src/pages/_app.tsx
import React, { useEffect } from 'react';
import Head from 'next/head';
import { ToastProvider } from '@/hooks/useToast';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  // Précharger les workers PDF.js
  useEffect(() => {
    // Précharger le worker PDF.js
    const preloadPDFWorker = () => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = '/pdf.worker.min.js';
      document.head.appendChild(link);
      
      console.log('PDF.js worker préchargé');
    };
    
    preloadPDFWorker();
  }, []);
  
  return (
    <>
      <Head>
        <title>Vocatio - Optimisation de CV et lettres de motivation</title>
        <meta name="description" content="Application d'optimisation de CV et génération de lettres de motivation personnalisées" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </>
  );
}