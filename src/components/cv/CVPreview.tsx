// src/components/cv/CVPreview.tsx
import { useStore } from 'src/store';

export function CVPreview() {
  const cv = useStore((state) => state.cv.originalContent);
  
  if (!cv) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-md">
        <p className="text-gray-500">Aucun CV à afficher. Veuillez d'abord télécharger un CV.</p>
      </div>
    );
  }
  
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-gray-100 px-4 py-3 border-b">
        <h3 className="font-medium">Aperçu de votre CV</h3>
      </div>
      
      <div className="p-4 max-h-96 overflow-y-auto">
        {/* Affichage du contenu en fonction du format */}
        {'html' in cv ? (
          // Pour les fichiers DOCX
          <div dangerouslySetInnerHTML={{ __html: cv.html }} />
        ) : (
          // Pour les fichiers PDF (affichage texte uniquement)
          <div className="whitespace-pre-line">
            {cv.text}
          </div>
        )}
      </div>
    </div>
  );
}