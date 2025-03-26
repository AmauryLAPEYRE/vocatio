// src/app/job-description/page.tsx
import { JobDescription } from '@/components/job-upload/JobDescription';

export default function JobDescriptionPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Entrez la description du poste
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Copiez-collez l'offre d'emploi pour optimiser votre CV en fonction de ses exigences.
        </p>
      </div>
      
      <JobDescription />
    </div>
  );
}