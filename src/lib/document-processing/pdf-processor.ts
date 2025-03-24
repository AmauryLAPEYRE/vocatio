// src/lib/document-processing/pdf-processor.ts
import * as pdfjs from 'pdfjs-dist';

// Définir les interfaces manuellement si elles ne sont pas correctement exportées
interface TextItem {
  str: string;
  dir?: string;
  width?: number;
  height?: number;
  hasEOL?: boolean;
  transform: number[];
  fontName?: string;
  [key: string]: any; // Pour d'autres propriétés potentielles
}

interface TextMarkedContent {
  type: string;
  items: any[];
  [key: string]: any;
}

// Interface pour les métadonnées PDF
interface PDFMetadataInfo {
  Title?: string;
  Author?: string;
  CreationDate?: string;
  [key: string]: any;
}

// Type union pour les éléments de contenu texte
type TextContent = TextItem | TextMarkedContent;

// Configurer le worker pour qu'il pointe vers le fichier dans le dossier public
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
}

interface PDFDocumentInfo {
  text: string;
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
  };
  originalArrayBuffer: ArrayBuffer;
}

/**
 * Extrait le texte et les métadonnées d'un fichier PDF
 * @param file Fichier PDF à traiter
 * @returns Informations sur le document PDF
 */
export async function processPDFDocument(file: File): Promise<PDFDocumentInfo> {
  try {
    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Charger le document PDF
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    
    // Extraire les métadonnées
    const metadata = await pdfDocument.getMetadata();
    const metadataInfo = metadata.info as PDFMetadataInfo || {};
    
    // Extraire le texte de chaque page
    let fullText = '';
    const sections: { title: string; content: string }[] = [];
    const keywords: Set<string> = new Set();
    
    const pageCount = pdfDocument.numPages;
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      
      // Extraction du texte de la page
      const pageText = textContent.items
        // Utiliser une approche plus directe pour le filtrage
        .filter(item => 'str' in item)
        .map(item => (item as TextItem).str)
        .join(' ');
      
      fullText += pageText + '\n';
      
      // Analyse simple de la structure (sections basées sur la taille de police)
      const fontSizes = textContent.items
        .filter(item => 'str' in item && 'transform' in item)
        .map(item => {
          const textItem = item as TextItem;
          return {
            text: textItem.str,
            fontSize: Math.sqrt(Math.pow(textItem.transform[0], 2) + Math.pow(textItem.transform[1], 2)),
            fontName: textItem.fontName
          };
        });
      
      // Détecter les titres potentiels (texte avec une police plus grande)
      if (fontSizes.length > 0) {
        const avgFontSize = fontSizes.reduce((sum, item) => sum + item.fontSize, 0) / fontSizes.length;
        const titles = fontSizes.filter(item => 
          item.fontSize > avgFontSize * 1.2 && 
          item.text.trim().length > 0 &&
          !/^[.,;:]/.test(item.text)  // Éviter les ponctuations
        );
        
        // Ajouter les sections détectées
        titles.forEach(title => {
          sections.push({
            title: title.text,
            content: pageText  // Pour simplifier, on associe le texte de la page entière
          });
        });
      }
      
      // Extraire des mots-clés potentiels
      const pageWords = pageText.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3) // Ignorer les mots trop courts
        .map(word => word.replace(/[.,;:!?()[\]{}""'']/g, '')); // Nettoyer la ponctuation
      
      // Chercher des mots-clés liés aux compétences
      const skillKeywords = [
        'développement', 'development', 'programming', 'programmation',
        'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'php', 'ruby',
        'react', 'angular', 'vue', 'node', 'express', 'django', 'flask',
        'sql', 'nosql', 'database', 'mongodb', 'postgresql', 'mysql',
        'cloud', 'aws', 'azure', 'gcp', 'devops', 'docker', 'kubernetes',
        'agile', 'scrum', 'kanban', 'jira', 'git', 'github', 'gitlab',
        'marketing', 'vente', 'sales', 'communication', 'leadership',
        'gestion', 'management', 'projet', 'project', 'budget', 'finance',
        'analyse', 'analysis', 'research', 'recherche', 'data', 'données',
        'design', 'ui', 'ux', 'graphique', 'graphic', 'photoshop', 'illustrator',
        'rédaction', 'copywriting', 'content', 'contenu', 'seo', 'sem',
        'certification', 'diplôme', 'degree', 'master', 'bachelor', 'licence',
        'anglais', 'english', 'français', 'french', 'espagnol', 'spanish',
        'expérience', 'experience', 'responsabilité', 'responsibility'
      ];
      
      pageWords.forEach(word => {
        if (skillKeywords.includes(word) || skillKeywords.some(keyword => word.includes(keyword))) {
          keywords.add(word);
        }
      });
    }
    
    // Créer l'objet de résultat
    const documentInfo: PDFDocumentInfo = {
      text: fullText,
      metadata: {
        title: metadataInfo.Title,
        author: metadataInfo.Author,
        creationDate: metadataInfo.CreationDate 
          ? new Date(metadataInfo.CreationDate) 
          : undefined,
        pageCount,
        format: 'pdf'
      },
      structure: {
        sections,
        keywords: Array.from(keywords)
      },
      originalArrayBuffer: arrayBuffer
    };
    
    return documentInfo;
  } catch (error) {
    console.error('Erreur lors du traitement du PDF:', error);
    throw new Error(`Erreur lors du traitement du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}