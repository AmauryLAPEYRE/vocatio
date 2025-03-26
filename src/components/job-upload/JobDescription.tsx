// src/components/job-upload/JobDescription.tsx
'use client';
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/appStore';
import { useRouter } from 'next/navigation';

export const JobDescription: React.FC = () => {
  const [jobText, setJobText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setJobPosting, setCurrentStep, setIsLoading } = useAppStore();
  const router = useRouter();

  const handleAnalyze = async () => {
    if (!jobText || jobText.trim() === '') {
      setError('Veuillez entrer la description du poste');
      return;
    }

    try {
      setIsAnalyzing(true);
      setIsLoading(true);
      setError(null);

      // Envoyer le texte à l'API pour analyse
      const response = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescription: jobText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'analyse de l\'offre d\'emploi');
      }

      const { data } = await response.json();
      
      // Stocker l'offre d'emploi dans le store
      setJobPosting(data);
      
      // Passer à l'étape suivante
      setCurrentStep(2);
      router.push('/optimize');
    } catch (error) {
      console.error('Erreur lors de l\'analyse de l\'offre d\'emploi:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsAnalyzing(false);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setJobText('');
    setError(null);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Description du poste</CardTitle>
        <CardDescription>
          Copiez-collez l'offre d'emploi pour optimiser votre CV en fonction des exigences spécifiques.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-1">
            Offre d'emploi
          </label>
          <textarea
            id="job-description"
            rows={12}
            className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Copiez-collez l'offre d'emploi ici..."
            value={jobText}
            onChange={(e) => {
              setJobText(e.target.value);
              if (error) setError(null);
            }}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          <p className="mt-1 text-xs text-gray-500">
            Pour de meilleurs résultats, incluez la description complète du poste, les compétences requises et tout autre détail pertinent.
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={jobText.trim() === '' || isAnalyzing}
        >
          Réinitialiser
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentStep(0);
              router.push('/');
            }}
            disabled={isAnalyzing}
          >
            Retour
          </Button>
          
          <Button
            onClick={handleAnalyze}
            isLoading={isAnalyzing}
            loadingText="Analyse en cours..."
            disabled={jobText.trim() === '' || isAnalyzing}
          >
            Analyser l'offre
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};