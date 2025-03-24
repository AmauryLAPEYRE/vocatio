// app/layout.js
import './globals.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Vocatio 2.0 - Optimisation de CV avec IA avancée',
  description: 'Optimisez votre CV pour n\'importe quelle offre d\'emploi en conservant fidèlement sa mise en forme visuelle.',
  keywords: ['CV', 'optimisation', 'IA', 'machine learning', 'emploi', 'recrutement'],
  authors: [{ name: 'Vocatio' }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        {/* Initialisation de PDF.js */}
        <Script 
          src="//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" 
          strategy="beforeInteractive"
        />
        <Script 
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              }
            `
          }}
          strategy="afterInteractive"
        />
      </head>
      <body className="antialiased bg-gray-50 text-gray-900 min-h-screen">
        {children}
        
        <footer className="bg-white border-t mt-10 py-8">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500">
            <p>Vocatio 2.0 - IA avancée pour l'optimisation de CV</p>
            <p className="mt-2">© {new Date().getFullYear()} Vocatio. Tous droits réservés.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

// app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary-50: #f0f9ff;
  --color-primary-100: #e0f2fe;
  --color-primary-200: #bae6fd;
  --color-primary-300: #7dd3fc;
  --color-primary-400: #38bdf8;
  --color-primary-500: #0ea5e9;
  --color-primary-600: #0284c7;
  --color-primary-700: #0369a1;
  --color-primary-800: #075985;
  --color-primary-900: #0c4a6e;
  --color-primary-950: #082f49;
}

html,
body {
  height: 100%;
  padding: 0;
  margin: 0;
}

/* Animations personnalisées */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.animate-fade-in-out {
  animation: fadeInOut 2s ease-in-out;
}

/* Personnalisation des scrollbars */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

/* Classes d'utilitaires spécifiques à l'application */
.bg-primary-gradient {
  background: linear-gradient(to right, var(--color-primary-600), var(--color-primary-800));
}

.text-balance {
  text-wrap: balance;
}

/* Styles spécifiques pour le document CV */
.cv-document {
  font-size: 12px;
  line-height: 1.5;
}

.page {
  background-color: white;
}

/* Styles pour la mise en évidence des modifications */
.modified-block {
  transition: background-color 0.3s ease;
}

.modified-block:hover {
  background-color: rgba(52, 152, 219, 0.25) !important;
}

/* Style pour les containers de chargement */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 200px;
}