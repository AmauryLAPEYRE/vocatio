// src/components/letter/LetterPreview.tsx
import { useStore } from 'amos/store';

export function LetterPreview() {
  const letterData = useStore((state) => state.letter.content);
  const jobData = useStore((state) => state.job);
  
  if (!letterData) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-md">
        <p className="text-gray-500">Aucune lettre de motivation à afficher. Veuillez d'abord générer une lettre.</p>
      </div>
    );
  }
  
  // Formater la date actuelle
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <div className="bg-white rounded-md shadow-md p-8 max-w-2xl mx-auto">
      <div className="text-right mb-8">
        <p>Votre Nom</p>
        <p>Votre Adresse</p>
        <p>Votre Email</p>
        <p>Votre Téléphone</p>
        <p className="mt-4">{currentDate}</p>
      </div>
      
      <div className="mb-8">
        <p>{jobData.companyName || 'Nom de l\'entreprise'}</p>
        <p>À l'attention du service recrutement</p>
        <p>Adresse de l'entreprise</p>
      </div>
      
      <div className="mb-6">
        <p className="font-medium">Objet : Candidature au poste de {jobData.jobTitle || 'poste visé'}</p>
      </div>
      
      <div className="mb-6">
        <p>Madame, Monsieur,</p>
      </div>
      
      <div className="whitespace-pre-line mb-8">
        {letterData.content}
      </div>
      
      <div>
        <p className="mb-6">Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>
        <p>Votre Nom</p>
      </div>
    </div>
  );
}