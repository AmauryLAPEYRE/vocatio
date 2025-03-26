// src/components/template-selector/TemplateSelector.tsx
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/appStore';
import { useRouter } from 'next/navigation';
import { canvaService, CanvaTemplate } from '@/services/templates/canvaService';

export const TemplateSelector: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<CanvaTemplate[]>([]);
  const [recommendedTemplates, setRecommendedTemplates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    optimizedCV, 
    jobPosting,
    setSelectedTemplateId: storeSetSelectedTemplateId,
    setCurrentStep
  } = useAppStore();
  
  const router = useRouter();

  // Charger les templates depuis l'API Canva
  useEffect(() => {
    async function loadTemplates() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Rediriger si les données nécessaires ne sont pas disponibles
        if (!optimizedCV || !jobPosting) {
          router.push('/');
          return;
        }
        
        // Obtenir les templates recommandés basés sur le poste
        const recommendedTemplatesList = await canvaService.getRecommendedTemplates(
          jobPosting.title,
          jobPosting.description
        );
        
        setTemplates(recommendedTemplatesList);
        
        // Définir les IDs recommandés
        const recommendedIds = recommendedTemplatesList.map(t => t.id);
        setRecommendedTemplates(recommendedIds);
        
        // Présélectionner le premier template recommandé
        if (recommendedIds.length > 0) {
          setSelectedTemplateId(recommendedIds[0]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des templates:', error);
        setError('Impossible de charger les templates. Veuillez réessayer.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTemplates();
  }, [optimizedCV, jobPosting, router]);

  const handleContinue = () => {
    if (!selectedTemplateId) return;
    
    storeSetSelectedTemplateId(selectedTemplateId);
    setCurrentStep(4);
    router.push('/preview');
  };

  // Afficher un spinner pendant le chargement
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500">Chargement des templates...</p>
      </div>
    );
  }

  // Afficher un message d'erreur si nécessaire
  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Erreur</CardTitle>
          <CardDescription>
            Une erreur est survenue lors du chargement des templates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
            {error}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!optimizedCV || !jobPosting || templates.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Données manquantes</CardTitle>
          <CardDescription>
            Impossible de charger les templates sans les données nécessaires.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Veuillez revenir à l'étape précédente pour compléter les informations requises.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => router.push('/')}>
            Revenir à l'accueil
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Choisissez un template</CardTitle>
        <CardDescription>
          Sélectionnez le design qui mettra le mieux en valeur votre CV pour le poste de {jobPosting.title}.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <h3 className="text-md font-medium text-gray-700 mb-2">Templates recommandés</h3>
          <p className="text-sm text-gray-600 mb-4">
            Voici notre sélection de templates adaptés à votre profil et au poste visé.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="relative">
                <button
                  type="button"
                  className={`w-full h-full border-2 rounded-lg overflow-hidden transition-all ${
                    selectedTemplateId === template.id
                      ? 'border-blue-500 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  {/* Image du template avec fallback */}
                  <div className="relative w-full aspect-[3/4]">
                    <Image
                      src={template.thumbnailUrl || '/placeholder-cv.png'}
                      alt={template.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="p-3 border-t border-gray-200 bg-white">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{template.description || 'Template professionnel de CV'}</p>
                  </div>
                </button>
                
                {/* Badge pour les templates recommandés */}
                {recommendedTemplates.indexOf(template.id) === 0 && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    Recommandé
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-md font-medium text-blue-800 mb-2">À propos des templates</h3>
          <p className="text-sm text-blue-700">
            Tous nos templates sont fournis par Canva, conçus pour être professionnels et optimisés pour les ATS 
            (Applicant Tracking Systems). Ils s'adapteront parfaitement à votre contenu optimisé.
          </p>
          <p className="text-sm text-blue-700 mt-2">
            Dans la prochaine étape, vous pourrez prévisualiser votre CV et l'exporter en PDF.
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setCurrentStep(2);
            router.push('/optimize');
          }}
          disabled={isLoading}
        >
          Retour
        </Button>
        
        <Button
          onClick={handleContinue}
          disabled={!selectedTemplateId || isLoading}
        >
          Continuer
        </Button>
      </CardFooter>
    </Card>
  );
};