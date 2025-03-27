// src/components/preview/CVPreview.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/appStore';
import { useRouter } from 'next/navigation';
import { canvaService } from '@/services/templates/canvaService';
import { Progress } from '@/components/ui/Progress';

// Types pour les options de personnalisation
interface CustomizationOptions {
  primaryColor: string;
  secondaryColor: string;
  font: string;
}

export const CVPreview: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [designId, setDesignId] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [customOptions, setCustomOptions] = useState<CustomizationOptions>({
    primaryColor: '#2563eb', // Blue
    secondaryColor: '#4b5563', // Gray
    font: 'Inter',
  });
  
  const { 
    optimizedCV, 
    selectedTemplateId,
    setCurrentStep 
  } = useAppStore();
  
  const router = useRouter();

  // Générer la prévisualisation du CV avec Canva
  useEffect(() => {
    async function generatePreview() {
      // Rediriger si les données nécessaires ne sont pas disponibles
      if (!optimizedCV || !selectedTemplateId) {
        router.push('/');
        return;
      }
      
      try {
        setIsGenerating(true);
        setError(null);
        
        // Simuler une progression
        const progressInterval = setInterval(() => {
          setExportProgress(prev => {
            const newValue = prev + Math.random() * 5;
            return newValue > 70 ? 70 : newValue;
          });
        }, 300);
        
        // Appeler l'API Canva pour créer le design
        const design = await canvaService.createResumeDesign(
          selectedTemplateId,
          optimizedCV
        );
        
        // Enregistrer l'ID de design et l'URL de prévisualisation
        setDesignId(design.designId);
        setPreviewUrl(design.previewUrl);
        
        // Simuler la fin de la progression
        clearInterval(progressInterval);
        setExportProgress(100);
        
        // Attendre un moment pour montrer la progression à 100%
        setTimeout(() => {
          setExportProgress(0);
        }, 500);
      } catch (error) {
        console.error('Erreur lors de la génération du CV:', error);
        setError("Impossible de générer le CV avec le template sélectionné. Veuillez essayer un autre template.");
      } finally {
        setIsGenerating(false);
      }
    }
    
    generatePreview();
  }, [optimizedCV, selectedTemplateId, router]);

  const handleExportPDF = async () => {
    if (!designId) return;
    
    try {
      setIsExporting(true);
      setError(null);
      
      // Simuler une progression
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 95) {
          progress = 95;
          clearInterval(progressInterval);
        }
        setExportProgress(progress);
      }, 300);
      
      // Appeler l'API Canva pour exporter le design en PDF
      const pdfUrl = await canvaService.exportDesignAsPDF(designId);
      
      // Terminer la progression
      clearInterval(progressInterval);
      setExportProgress(100);
      
      // Télécharger le PDF
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `CV-${optimizedCV?.personalInfo.name || 'Optimisé'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Réinitialiser la progression après un délai
      setTimeout(() => {
        setExportProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      setError('Une erreur est survenue lors de l\'export du CV en PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const applyCustomizations = async () => {
    if (!optimizedCV || !selectedTemplateId) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      
      // Simuler une progression
      setExportProgress(30);
      
      // Appeler à nouveau l'API Canva avec les options de personnalisation
      const design = await canvaService.createResumeDesign(
        selectedTemplateId,
        optimizedCV
        // Ici, on devrait transmettre également les options de personnalisation
        // Note: la façon exacte de faire dépendra de l'API Canva
      );
      
      // Mettre à jour l'ID de design et l'URL de prévisualisation
      setDesignId(design.designId);
      setPreviewUrl(design.previewUrl);
      
      // Terminer la progression
      setExportProgress(100);
      
      // Réinitialiser la progression après un délai
      setTimeout(() => {
        setExportProgress(0);
      }, 500);
    } catch (error) {
      console.error('Erreur lors de la personnalisation du CV:', error);
      setError('Impossible d\'appliquer les personnalisations');
    } finally {
      setIsGenerating(false);
    }
  };

  // Afficher un spinner pendant le chargement initial
  if (isGenerating && !previewUrl) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md mb-4">
          <Progress value={exportProgress} showValue valueSuffix="%" />
        </div>
        <p className="text-gray-500">Génération de votre CV en cours...</p>
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
            Une erreur est survenue lors de la génération du CV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
            {error}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              setCurrentStep(3);
              router.push('/templates');
            }}
          >
            Changer de template
          </Button>
          <Button onClick={() => window.location.reload()}>
            Réessayer
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!optimizedCV || !selectedTemplateId) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Données manquantes</CardTitle>
          <CardDescription>
            Impossible de générer le CV sans les données nécessaires.
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
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Panel de personnalisation */}
        <div className="lg:w-1/4">
          <Card>
            <CardHeader>
              <CardTitle>Personnalisation</CardTitle>
              <CardDescription>
                Adaptez l'apparence de votre CV
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Couleurs */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Couleurs</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="primary-color" className="text-xs text-gray-500">Principale</label>
                    <input
                      type="color"
                      id="primary-color"
                      value={customOptions.primaryColor}
                      onChange={(e) => setCustomOptions(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-full h-8 rounded border border-gray-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="secondary-color" className="text-xs text-gray-500">Secondaire</label>
                    <input
                      type="color"
                      id="secondary-color"
                      value={customOptions.secondaryColor}
                      onChange={(e) => setCustomOptions(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-full h-8 rounded border border-gray-200"
                    />
                  </div>
                </div>
              </div>
              
              {/* Police */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Police</h3>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={customOptions.font}
                  onChange={(e) => setCustomOptions(prev => ({ ...prev, font: e.target.value }))}
                >
                  <option value="Inter">Inter (Moderne)</option>
                  <option value="Roboto">Roboto (Professionnel)</option>
                  <option value="Playfair Display">Playfair (Élégant)</option>
                  <option value="Open Sans">Open Sans (Lisible)</option>
                  <option value="Montserrat">Montserrat (Contemporain)</option>
                </select>
              </div>
              
              {/* Bouton pour appliquer les personnalisations */}
              <Button
                onClick={applyCustomizations}
                isLoading={isGenerating}
                loadingText="Application..."
                className="w-full mt-4"
              >
                Appliquer les changements
              </Button>
              
              {/* Séparateur */}
              <div className="border-t border-gray-200 my-4"></div>
              
              {/* Liens d'action */}
              <div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep(3);
                    router.push('/templates');
                  }}
                  className="w-full mb-2"
                >
                  Changer de template
                </Button>
                
                <Button
                  onClick={handleExportPDF}
                  isLoading={isExporting}
                  loadingText="Génération du PDF..."
                  className="w-full"
                >
                  Télécharger PDF
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Score de correspondance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-gray-200 stroke-current"
                      strokeWidth="10"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                    ></circle>
                    <circle
                      className="text-blue-600 stroke-current"
                      strokeWidth="10"
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      strokeDasharray={`${(optimizedCV.matchScore || 0) * 2.51} 251.2`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    ></circle>
                  </svg>
                  <div className="absolute top-0 left-0 flex items-center justify-center w-full h-full">
                    <p className="text-3xl font-bold text-gray-800">{optimizedCV.matchScore || 0}%</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 text-center mt-4">
                Votre CV est optimisé à {optimizedCV.matchScore || 0}% pour le poste de {jobPosting.title}.
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Prévisualisation du CV */}
        <div className="lg:w-3/4">
          <Card>
            <CardHeader>
              <CardTitle>Prévisualisation du CV</CardTitle>
              <CardDescription>
                Voici à quoi ressemblera votre CV optimisé
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* Afficher la prévisualisation du design Canva */}
              {previewUrl ? (
                <div className="border border-gray-200 rounded-md overflow-hidden shadow-sm">
                  <iframe 
                    src={previewUrl} 
                    className="w-full h-[842px]" 
                    title="Prévisualisation du CV"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[842px] bg-gray-100 border border-gray-200 rounded-md">
                  <p className="text-gray-500">Chargement de la prévisualisation...</p>
                </div>
              )}
              
              {/* Barre de progression */}
              {(isGenerating || isExporting) && exportProgress > 0 && (
                <div className="mt-4">
                  <Progress 
                    value={exportProgress} 
                    showValue 
                    valueSuffix="%" 
                  />
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    {isExporting ? 'Export du PDF en cours...' : 'Génération de la prévisualisation...'}
                  </p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="justify-end">
              <Button
                onClick={handleExportPDF}
                isLoading={isExporting}
                loadingText="Génération du PDF..."
                disabled={!designId || isExporting || isGenerating}
              >
                Télécharger PDF
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};