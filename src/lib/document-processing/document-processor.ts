// src/lib/document-processing/document-processor.ts
import { processPDFDocument } from './pdf-processor';
import { processDOCXDocument } from './docx-processor';

// Interface unifiée pour les informations de document
export interface DocumentInfo {
  text: string;
  html: string;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: Date;
    pageCount?: number;
    format: string;
  };
  structure: {
    sections: {
      title: string;
      content: string;
    }[];
    [key: string]: any;
  };
  originalArrayBuffer: ArrayBuffer;
  originalPdfBase64?: string; // Nouvelle propriété pour stocker le PDF en Base64
}

/**
 * Traite un document (PDF, DOCX) et extrait son contenu et sa structure
 * @param file Fichier à traiter
 * @returns Informations extraites du document
 */
export async function processDocument(file: File): Promise<DocumentInfo> {
  try {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    // Traitement en fonction du type de fichier
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await processPDFDocument(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      fileName.endsWith('.docx')
    ) {
      return await processDOCXDocument(file);
    } else {
      throw new Error(`Format de fichier non supporté: ${fileType}`);
    }
  } catch (error) {
    console.error('Erreur lors du traitement du document:', error);
    throw error;
  }
}