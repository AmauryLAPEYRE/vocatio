// src/app/page.tsx
import { CVUpload } from '@/components/cv-upload/CVUpload';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Optimisez votre CV avec l'IA
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Adaptez votre CV à chaque offre d'emploi pour maximiser vos chances de décrocher un entretien.
        </p>
      </div>
      
      <CVUpload />
    </div>
  );
}