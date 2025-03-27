// src/components/optimize/OptimizeCV.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { useAppStore } from '@/store/appStore';
import { useRouter } from 'next/navigation';

export const OptimizeCV: React.FC = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    originalCV, 
    jobPosting, 
    setOptimizedCV, 
    setCurrentStep, 
    setIsLoading 
  } = useAppStore();
  
  const router = useRouter();

  // Simuler la progression
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isOptimizing) {
      interval = setInterval(() => {
        setOptimizationProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 600);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOptimizing]);

  useEffect(() => {
    // Rediriger si les données nécessaires ne sont pas disponibles
    if (!originalCV || !jobPosting) {
      router.push('/');
    }
  }, [originalCV, jobPosting, router]);

  const handleOptimize = async () => {
    if (!originalCV || !jobPosting) {
      setError('Informations manquantes pour l\'optimisation');
      return;
    }

    try {
      setIsOptimizing(true);
      setIsLoading(true);
      setError(null);
      setOptimizationProgress(0);

      // Envoyer les données à l'API pour optimisation
      const response = await fetch('/api/optimize-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          originalCV, 
          jobPosting 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'optimisation du CV');
      }

      // Simuler la fin de la progression
      setOptimizationProgress(100);

      // Attendre un moment pour que l'utilisateur voie la progression à 100%
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data } = await response.json();
      
      // Stocker le CV optimisé dans le store
      setOptimizedCV(data);
      
      // Passer à l'étape suivante
      setCurrentStep(3);
      router.push('/templates');
    } catch (error) {
      console.error('Erreur lors de l\'optimisation du CV:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsOptimizing(false);
      setIsLoading(false);
    }
  };

  if (!originalCV || !jobPosting) {
    return null; // Ne rien afficher jusqu'à la redirection
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Optimisation du CV</CardTitle>
        <CardDescription>
          Nous allons optimiser votre CV pour le poste de {jobPosting.title} {jobPosting.company ? `chez ${jobPosting.company}` : ''}.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Résumé de l'analyse</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-blue-700">Votre profil</h4>
                <ul className="mt-1 text-sm text-blue-600 space-y-1 list-disc list-inside">
                  <li>{originalCV.experiences.length} expériences professionnelles</li>
                  <li>{originalCV.education.length} formations</li>
                  <li>{originalCV.skills.length} compétences identifiées</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-blue-700">Exigences du poste</h4>
                <ul className="mt-1 text-sm text-blue-600 space-y-1 list-disc list-inside">
                  {jobPosting.requiredSkills && jobPosting.requiredSkills.length > 0 && (
                    <li>{jobPosting.requiredSkills.length} compétences requises</li>
                  )}
                  {jobPosting.preferredSkills && jobPosting.preferredSkills.length > 0 && (
                    <li>{jobPosting.preferredSkills.length} compétences préférées</li>
                  )}
                  {jobPosting.experienceLevel && (
                    <li>Niveau d'expérience: {jobPosting.experienceLevel}</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Comment fonctionne l'optimisation</h3>
            <p className="text-sm text-gray-600 mb-2">
              Notre système va adapter votre CV pour mettre en valeur les compétences et expériences 
              les plus pertinentes pour ce poste, tout en respectant scrupuleusement l'intégrité de vos informations.
            </p>
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100">
              <p className="text-sm text-yellow-700">
                <strong>Important:</strong> Nous ne créons ni n'inventons jamais d'informations. 
                Nous reformulons et réorganisons uniquement les données présentes dans votre CV original.
              </p>
            </div>
          </div>
          
          {isOptimizing && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Progression de l'optimisation</h3>
              <Progress value={optimizationProgress} showValue valueSuffix="%" />
              
              <div className="grid grid-cols-2 mt-4">
                <div className="text-sm">
                  <p className="font-medium">Opérations en cours:</p>
                  <p className="text-gray-600">
                    {optimizationProgress < 30 && "Analyse des correspondances..."}
                    {optimizationProgress >= 30 && optimizationProgress < 60 && "Optimisation du contenu..."}
                    {optimizationProgress >= 60 && optimizationProgress < 90 && "Réorganisation des sections..."}
                    {optimizationProgress >= 90 && "Finalisation..."}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">Temps estimé:</p>
                  <p className="text-gray-600">
                    {optimizationProgress < 100 ? "Environ 30 secondes" : "Terminé!"}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
              <p className="font-medium">Erreur:</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setCurrentStep(1);
            router.push('/job-description');
          }}
          disabled={isOptimizing}
        >
          Retour
        </Button>
        
        <Button
          onClick={handleOptimize}
          isLoading={isOptimizing}
          loadingText="Optimisation en cours..."
          disabled={isOptimizing || !originalCV || !jobPosting}
        >
          Optimiser mon CV
        </Button>
      </CardFooter>
    </Card>
  );
};