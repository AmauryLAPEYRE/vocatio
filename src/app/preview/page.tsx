// src/app/preview/page.tsx
import { CVPreview } from '@/components/preview/CVPreview';

export default function PreviewPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Prévisualisez et exportez votre CV
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Finalisez votre CV optimisé et téléchargez-le en format PDF haute qualité.
        </p>
      </div>
      
      <CVPreview />
    </div>
  );
}