// src/components/ui/FileUpload.tsx
'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { twMerge } from 'tailwind-merge';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  acceptedFileTypes?: string[];
  maxSize?: number;
  className?: string;
  label?: string;
  helperText?: string;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelected,
  acceptedFileTypes = ['.pdf', '.docx'],
  maxSize = 10485760, // 10 MB default
  className,
  label = 'Déposer votre fichier ici',
  helperText = 'ou cliquez pour sélectionner',
  error,
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelected(acceptedFiles[0]);
    }
  }, [onFileSelected]);
  
  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize,
    multiple: false,
  });
  
  const hasError = error || fileRejections.length > 0;
  
  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={twMerge(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive && !isDragReject && "border-blue-500 bg-blue-50",
          isDragReject && "border-red-500 bg-red-50",
          hasError ? "border-red-500" : "border-gray-300 hover:border-gray-400",
          className
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor" 
            className={`w-10 h-10 ${hasError ? 'text-red-500' : 'text-gray-400'}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-lg font-medium">{label}</p>
          <p className="text-sm text-gray-500">{helperText}</p>
          <p className="text-xs text-gray-400">
            Formats acceptés : {acceptedFileTypes.join(', ')} (max {Math.round(maxSize / 1048576)} MB)
          </p>
        </div>
      </div>
      
      {fileRejections.length > 0 && (
        <div className="mt-2 text-sm text-red-600">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name}>
              {errors.map(error => (
                <p key={error.code}>{error.message}</p>
              ))}
            </div>
          ))}
        </div>
      )}
      
      {error && !fileRejections.length && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
};