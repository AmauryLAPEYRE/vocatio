// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { Stepper } from '@/components/layout/Stepper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vocatio - Optimiseur de CV intelligent',
  description: 'Optimisez votre CV pour chaque offre d\'emploi grâce à l\'IA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <AppHeader />
          <main className="flex-grow container mx-auto py-8 px-4">
            <Stepper />
            <div className="mt-8">
              {children}
            </div>
          </main>
          <AppFooter />
        </div>
      </body>
    </html>
  );
}