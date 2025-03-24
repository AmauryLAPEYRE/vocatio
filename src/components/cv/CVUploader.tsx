// src/components/cv/CVUpLoadingState.tsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { processDocument } from 'src/lib/document-processing/document-processor';
import { useStore } from 'src/store';
import { LoadingState } from '@/components/common/LoadingState';
import { useCVStore } from 'src/store/cv-store';

interface CVUploaderProps {
  onComplete: () => void;
}

export function CVUploader({ onComplete }: CVUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setCVData = useCVStore((state) => state.setOriginalCV);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Vérifier le type de fichier
    const fileType = file.type;
    const isValidType = fileType === 'application/pdf' || 
                        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                        file.name.endsWith('.pdf') || 
                        file.name.endsWith('.docx');
    
    if (!isValidType) {
      setError('Format de fichier non supporté. Veuillez télécharger un fichier PDF ou DOCX.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Traiter le document
      const documentInfo = await processDocument(file);
      
      // Mettre à jour le store
      setCVData({
        originalContent: documentInfo,
        fileName: file.name,
        fileType: fileType,
        uploadDate: new Date()
      });
      
      // Passer à l'étape suivante
      onComplete();
    } catch (err) {
      console.error('Erreur lors du traitement du CV:', err);
      setError('Une erreur est survenue lors de l\'analyse du document. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [setCVData, onComplete]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Importer votre CV</h2>
        <p className="text-gray-600 mt-2">
          Téléchargez votre CV au format PDF ou DOCX pour commencer
        </p>
      </div>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        
        {loading ? (
          <Loader text="Analyse du document en cours..." />
        ) : (
          <>
            <svg 
              className="mx-auto h-12 w-12 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            
            <p className="mt-4 text-sm text-gray-600">
              {isDragActive
                ? "Déposez votre CV ici..."
                : "Glissez-déposez votre CV ici, ou cliquez pour sélectionner un fichier"}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Formats acceptés: PDF, DOCX
            </p>
          </>
        )}
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="bg-blue-50 p-4 rounded-md">
        <h3 className="font-medium text-blue-800">Pourquoi importer votre CV?</h3>
        <ul className="mt-2 text-sm text-blue-700 space-y-1">
          <li>• Nous analyserons votre CV pour identifier vos compétences et expériences.</li>
          <li>• Le format original de votre CV sera préservé lors de l'optimisation.</li>
          <li>• Aucune donnée n'est stockée sur nos serveurs - tout le traitement est effectué localement.</li>
        </ul>
      </div>
    </div>
  );
}