// src/app/optimize/page.tsx
import { OptimizeCV } from '@/components/optimize/OptimizeCV';

export default function OptimizePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Optimisation du CV
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Notre IA analyse votre CV et l'offre d'emploi pour créer une version parfaitement adaptée.
        </p>
      </div>
      
      <OptimizeCV />
    </div>
  );
}