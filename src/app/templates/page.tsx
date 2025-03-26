// src/app/templates/page.tsx
import { TemplateSelector } from '@/components/template-selector/TemplateSelector';

export default function TemplatesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Choisissez un template
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Sélectionnez le design de CV qui convient le mieux à votre profil et au poste visé.
        </p>
      </div>
      
      <TemplateSelector />
    </div>
  );
}