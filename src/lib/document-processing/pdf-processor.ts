// src/lib/document-processing/pdf-processor.ts
import * as pdfjs from 'pdfjs-dist';

// Définir les interfaces nécessaires
interface TextItem {
  str: string;
  dir?: string;
  width?: number;
  height?: number;
  hasEOL?: boolean;
  transform: number[];
  fontName?: string;
  fontSize?: number;
  color?: number[];
  [key: string]: any;
}

interface PDFMetadataInfo {
  Title?: string;
  Author?: string;
  CreationDate?: string;
  [key: string]: any;
}

interface PDFDocumentInfo {
  text: string;
  html: string;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: Date;
    pageCount: number;
    format: 'pdf';
  };
  structure: {
    sections: {
      title: string;
      content: string;
    }[];
    keywords: string[];
    layout: {
      columns: number;
      hasHeader: boolean;
      hasFooter: boolean;
      mainColor?: string;
      secondaryColor?: string;
    };
  };
  originalArrayBuffer: ArrayBuffer;
  originalPdfBase64: string; // Pour stocker le PDF en Base64
}

/**
 * Convertit un ArrayBuffer en chaîne Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const binary = [];
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary.push(String.fromCharCode(bytes[i]));
  }
  return window.btoa(binary.join(''));
}

/**
 * Configure le worker PDF.js de manière optimisée pour la production
 */
function configurePDFWorker() {
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  }
}

/**
 * Extrait le texte et les métadonnées d'un fichier PDF
 * @param file Fichier PDF à traiter
 * @returns Informations complètes sur le document PDF
 */
export async function processPDFDocument(file: File): Promise<PDFDocumentInfo> {
  try {
    configurePDFWorker();
    
    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Convertir l'ArrayBuffer en Base64
    const base64Data = arrayBufferToBase64(arrayBuffer);
    
    // Options optimisées pour le chargement PDF
    const loadingOptions = {
      data: arrayBuffer,
      useWorkerFetch: false,
      standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true
    };
    
    // Charger le document PDF
    const pdfDocument = await pdfjs.getDocument(loadingOptions).promise;
    
    // Extraire les métadonnées
    const metadata = await pdfDocument.getMetadata();
    const metadataInfo = metadata.info as PDFMetadataInfo || {};
    
    // Variables pour stocker le texte et structures
    let fullText = '';
    let htmlContent = '<div class="pdf-document">';
    const sections: {title: string, content: string}[] = [];
    const keywords = new Set<string>();
    
    // Traiter chaque page
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const viewport = page.getViewport({ scale: 1.0 });
      htmlContent += `<div class="pdf-page" style="width:${viewport.width}px; height:${viewport.height}px; position:relative;">`;
      
      // Extraire le texte
      const textContent = await page.getTextContent();
      
      let pageText = '';
      for (let j = 0; j < textContent.items.length; j++) {
        const item = textContent.items[j] as TextItem;
        
        if (item.str) {
          pageText += item.str + (item.hasEOL ? '\n' : ' ');
          
          // Ajouter au HTML
          const transform = item.transform || [1, 0, 0, 1, 0, 0];
          const x = transform[4];
          const y = transform[5];
          
          htmlContent += `<div style="position:absolute; left:${x}px; top:${viewport.height - y}px;">${item.str}</div>`;
        }
      }
      
      fullText += pageText;
      htmlContent += '</div>';
      
      // Analyser le texte pour trouver des sections
      const paragraphs = pageText.split('\n\n').filter(p => p.trim().length > 0);
      for (const paragraph of paragraphs) {
        if (paragraph.length > 30) {
          const lines = paragraph.split('\n');
          const title = lines[0].trim();
          const content = lines.slice(1).join('\n').trim();
          
          if (title && content) {
            sections.push({ title, content });
          }
        }
      }
    }
    
    htmlContent += '</div>';
    
    // Détection du layout
    const columns = fullText.split('\n').length > 0 && 
                   fullText.split('\n')[0].length < 50 ? 2 : 1;
    const hasHeader = true;
    const hasFooter = true;
    
    // Créer et retourner l'objet final
    return {
      text: fullText,
      html: htmlContent,
      metadata: {
        title: metadataInfo.Title,
        author: metadataInfo.Author,
        creationDate: metadataInfo.CreationDate ? new Date(metadataInfo.CreationDate) : undefined,
        pageCount: pdfDocument.numPages,
        format: 'pdf'
      },
      structure: {
        sections: sections.length > 0 ? sections : [{ title: 'Document', content: fullText }],
        keywords: extractKeywords(fullText),
        layout: {
          columns,
          hasHeader,
          hasFooter
        }
      },
      originalArrayBuffer: arrayBuffer,
      originalPdfBase64: base64Data
    };
  } catch (error) {
    console.error('Erreur lors du traitement du PDF:', error);
    throw error;
  }
}

/**
 * Extrait des mots-clés potentiels du texte
 */
function extractKeywords(text: string): string[] {
  const keywords = new Set<string>();
  const words = text.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .map(word => word.replace(/[.,;:!?()[\]{}""'']/g, ''));
    
  const skillKeywords = [
    'développement', 'javascript', 'python', 'java', 'react', 'angular',
    'cloud', 'aws', 'azure', 'gcp', 'devops', 'docker', 'kubernetes',
    'agile', 'scrum', 'kanban', 'marketing', 'vente', 'management'
  ];
  
  for (const word of words) {
    if (skillKeywords.includes(word) || skillKeywords.some(keyword => word.includes(keyword))) {
      keywords.add(word);
    }
  }
  
  return Array.from(keywords);
}