// src/hooks/useFileValidator.tsx
import { useState, useCallback } from 'react';
import { PDFSanitizer } from '@/lib/security/pdf-sanitizer';

interface ValidationOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  validatePDF?: boolean;
  validateDOCX?: boolean;
}

/**
 * Hook pour valider les fichiers téléchargés (sécurité)
 */
export function useFileValidator(options: ValidationOptions = {}) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const validateFile = useCallback(async (file: File): Promise<boolean> => {
    setIsValidating(true);
    setValidationError(null);
    
    try {
      // Vérifier la taille du fichier
      const maxSize = (options.maxSizeMB || 15) * 1024 * 1024; // Convertir en octets
      if (file.size > maxSize) {
        setValidationError(`Le fichier est trop volumineux (maximum: ${options.maxSizeMB || 15} Mo)`);
        return false;
      }
      
      // Vérifier le type de fichier
      if (options.allowedTypes && options.allowedTypes.length > 0) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const mimeType = file.type.toLowerCase();
        
        const isAllowedType = options.allowedTypes.some(type => 
          type.toLowerCase() === mimeType || 
          type.toLowerCase() === `.${fileExtension}`
        );
        
        if (!isAllowedType) {
          setValidationError(`Format de fichier non autorisé. Types acceptés: ${options.allowedTypes.join(', ')}`);
          return false;
        }
      }
      
      // Valider les PDF pour la sécurité
      if (options.validatePDF && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
        const result = await PDFSanitizer.analyzePDF(file);
        
        if (!result.safe) {
          setValidationError(`Le fichier PDF présente des problèmes de sécurité: ${result.issues?.join(', ')}`);
          return false;
        }
      }
      
      // Valider les DOCX pour la sécurité
      if (options.validateDOCX && (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.name.toLowerCase().endsWith('.docx')
      )) {
        const result = await PDFSanitizer.analyzeDOCX(file);
        
        if (!result.safe) {
          setValidationError(`Le fichier DOCX présente des problèmes de sécurité: ${result.issues?.join(', ')}`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la validation du fichier:', error);
      setValidationError('Une erreur est survenue lors de la validation du fichier');
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [options]);
  
  return {
    validateFile,
    validationError,
    isValidating,
    clearValidationError: () => setValidationError(null)
  };
}