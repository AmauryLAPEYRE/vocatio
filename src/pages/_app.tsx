// src/pages/_app.tsx
import React from 'react';
import Head from 'next/head';
import { ToastProvider } from '@/hooks/useToast';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
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