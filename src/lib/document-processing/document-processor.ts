// src/lib/document-processing/document-processor.ts
import { processPDFDocument } from './pdf-processor';
import { processDOCXDocument } from './docx-processor';

export type DocumentInfo = Awaited<ReturnType<typeof processPDFDocument>> | Awaited<ReturnType<typeof processDOCXDocument>>;

/**
 * Traite un fichier document (détecte le type et applique le processeur approprié)
 * @param file Fichier à traiter (PDF ou DOCX)
 * @returns Informations structurées sur le document
 */
export async function processDocument(file: File): Promise<DocumentInfo> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (fileExtension === 'pdf') {
    return processPDFDocument(file);
  } else if (fileExtension === 'docx') {
    return processDOCXDocument(file);
  } else {
    throw new Error(`Format de fichier non pris en charge: ${fileExtension}`);
  }
}