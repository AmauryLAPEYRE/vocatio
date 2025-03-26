// src/components/cv-upload/CVUpload.tsx
'use client';
import React, { useState } from 'react';
import { FileUpload } from '@/components/ui/FileUpload';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/appStore';
import { useRouter } from 'next/navigation';

export const CVUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const { setCVFile, setOriginalCV, setCurrentStep, setIsLoading, setError } = useAppStore();
  const router = useRouter();

  const handleFileSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError('Veuillez sélectionner un fichier CV');
      return;
    }

    try {
      setIsUploading(true);
      setIsLoading(true);
      setError(null);

      // Créer un FormData pour l'envoi du fichier
      const formData = new FormData();
      formData.append('file', file);

      // Envoyer le fichier à l'API
      const response = await fetch('/api/extract-cv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'analyse du CV');
      }

      const { data } = await response.json();
      
      // Stocker le CV extrait et le fichier dans le store
      setOriginalCV(data);
      setCVFile(file);
      
      // Passer à l'étape suivante
      setCurrentStep(1);
      router.push('/job-description');
    } catch (error) {
      console.error('Erreur lors de l\'upload du CV:', error);
      setUploadError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsUploading(false);
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Importer votre CV</CardTitle>
        <CardDescription>
          Téléchargez votre CV existant pour l'analyser et l'optimiser pour vos candidatures.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <FileUpload
          onFileSelected={handleFileSelected}
          acceptedFileTypes={['.pdf', '.docx']}
          label={file ? `Fichier sélectionné: ${file.name}` : 'Déposez votre CV ici'}
          helperText={file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'ou cliquez pour sélectionner'}
          error={uploadError || undefined}
        />
        
        {file && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
            <h4 className="text-sm font-medium text-blue-800">Fichier sélectionné</h4>
            <p className="text-sm text-blue-700">{file.name}</p>
            <p className="text-xs text-blue-600">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setFile(null);
            setUploadError(null);
          }}
          disabled={!file || isUploading}
        >
          Réinitialiser
        </Button>
        
        <Button
          onClick={handleUpload}
          isLoading={isUploading}
          loadingText="Analyse en cours..."
          disabled={!file || isUploading}
        >
          Analyser mon CV
        </Button>
      </CardFooter>
    </Card>
  );
};