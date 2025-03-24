// src/components/common/FileUpLoadingState.tsx
import React, { useCallback } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';

interface FileUpLoadingStateProps extends Omit<DropzoneOptions, 'onDrop'> {
  onFileChange: (file: File) => void;
  label?: string;
  helpText?: string;
  className?: string;
  error?: string;
  isLoading?: boolean;
}

export function FileUpLoadingState({
  onFileChange,
  label = 'Télécharger un fichier',
  helpText,
  className,
  error,
  isLoading,
  ...dropzoneOptions
}: FileUpLoadingStateProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileChange(acceptedFiles[0]);
    }
  }, [onFileChange]);
  
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    multiple: false,
    disabled: isLoading,
    ...dropzoneOptions
  });
  
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
          isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50' : 
          isDragReject ? 'border-red-500 bg-red-50' : 
          error ? 'border-red-300 bg-red-50' : 
          'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        {isLoading ? (
          <div className="flex flex-col items-center py-2">
            <svg className="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-sm text-gray-500">Chargement...</p>
          </div>
        ) : isDragActive && !isDragReject ? (
          <p className="text-sm text-blue-500">Déposez le fichier ici...</p>
        ) : isDragReject ? (
          <p className="text-sm text-red-500">Type de fichier non supporté</p>
        ) : (
          <>
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-1 text-sm text-gray-500">Glissez-déposez un fichier ici, ou <span className="text-blue-600">cliquez pour parcourir</span></p>
          </>
        )}
      </div>
      
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}