// components/FileUploadZone.jsx
'use client';

import { useState, useRef } from 'react';
import { 
  ArrowUpTrayIcon, 
  DocumentIcon, 
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function FileUploadZone({ onFileUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };
  
  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };
  
  const processFile = async (file) => {
    // Vérifier le type de fichier
    if (file.type !== 'application/pdf' && 
        file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      alert('Format non supporté. Veuillez télécharger un fichier PDF ou DOCX.');
      return;
    }
    
    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier est trop volumineux. La taille maximale est de 10MB.');
      return;
    }
    
    setFileName(file.name);
    setIsLoading(true);
    
    try {
      await onFileUpload(file);
    } catch (error) {
      console.error('Erreur lors du traitement du fichier:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClick = () => {
    if (!isLoading) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
        isDragging ? 'border-primary-500 bg-primary-50' : 
        isLoading ? 'border-gray-300 bg-gray-50' :
        'border-gray-300 hover:border-gray-400'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx"
        className="hidden"
        disabled={isLoading}
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        {isLoading ? (
          <div className="animate-spin rounded-full h-16 w-16 border-t-3 border-b-3 border-primary-500"></div>
        ) : (
          <>
            {fileName ? (
              <div className="bg-gray-100 rounded-full p-4">
                <DocumentTextIcon className="h-16 w-16 text-primary-500" />
              </div>
            ) : (
              <div className="bg-gray-100 rounded-full p-4">
                <ArrowUpTrayIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </>
        )}
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">
            {fileName ? fileName : 'Déposez votre CV ici'}
          </h3>
          <p className="text-sm text-gray-500">
            {isLoading
              ? 'Analyse en cours...'
              : fileName
              ? 'Cliquez pour changer de fichier'
              : 'Formats acceptés: PDF, DOCX (max 10MB)'}
          </p>
        </div>
        
        {!isLoading && !fileName && (
          <button
            type="button"
            className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Sélectionner un fichier
          </button>
        )}
        
        {fileName && !isLoading && (
          <div className="mt-4 bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Fichier prêt pour l'analyse
          </div>
        )}
      </div>
      
      <div className="mt-8 border-t pt-6 text-center">
        <h4 className="font-medium text-gray-900 mb-2">Vocatio 2.0 reconnaît et préserve</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="font-medium">Structure</div>
            <div className="text-sm text-gray-500">Mise en page multiple colonnes</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="font-medium">Design</div>
            <div className="text-sm text-gray-500">Couleurs et styles visuels</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="font-medium">Typographie</div>
            <div className="text-sm text-gray-500">Polices et formatage</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="font-medium">Éléments</div>
            <div className="text-sm text-gray-500">Tableaux, listes, puces</div>
          </div>
        </div>
      </div>
    </div>
  );
}