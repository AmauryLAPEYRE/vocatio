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

interface StyleInfo {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  position: {
    x: number;
    y: number;
    pageIndex: number;
  };
}

interface TextElementWithStyle {
  text: string;
  style: StyleInfo;
  isHeader?: boolean;
  isListItem?: boolean;
  sectionLevel?: number; // 1 pour titre principal, 2 pour sous-titre, etc.
}

interface PDFDocumentInfo {
  text: string;
  html: string; // HTML version of the document with styling
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
      elements: TextElementWithStyle[]; // Elements with their original styling
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
  // Nouvelle propriété pour stocker le template complet
  originalTemplate: {
    elements: TextElementWithStyle[];
    layout: {
      pageSize: { width: number; height: number };
      margins: { top: number; right: number; bottom: number; left: number };
      columns: number;
      headerHeight?: number;
      footerHeight?: number;
    };
    colors: string[];
    fonts: string[];
  };
}

// Configurer le worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

/**
 * Extrait le texte, les styles et la structure d'un fichier PDF
 * @param file Fichier PDF à traiter
 * @returns Informations complètes sur le document PDF avec styles
 */
export async function processPDFDocument(file: File): Promise<PDFDocumentInfo> {
  try {
    console.log('Début du traitement amélioré du PDF:', file.name);
    
    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Charger le document PDF
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    console.log('Document PDF chargé, nombre de pages:', pdfDocument.numPages);
    
    // Extraire les métadonnées
    const metadata = await pdfDocument.getMetadata();
    const metadataInfo = metadata.info as PDFMetadataInfo || {};
    
    // Stocker toutes les informations de texte avec style
    let fullText = '';
    let htmlContent = '<div class="pdf-document">';
    const allElements: TextElementWithStyle[] = [];
    const sections: PDFDocumentInfo['structure']['sections'] = [];
    const keywords: Set<string> = new Set();
    const colors: Set<string> = new Set();
    const fonts: Set<string> = new Set();
    
    // Analyse de la mise en page
    let averageWordsPerLine = 0;
    let wordCount = 0;
    let lineCount = 0;
    const yPositions: number[] = [];
    
    // Traiter chaque page
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const viewport = page.getViewport({ scale: 1.0 });
      htmlContent += `<div class="pdf-page" style="width:${viewport.width}px; height:${viewport.height}px; position:relative;">`;
      
      // Extraire le texte et les informations de style
      const textContent = await page.getTextContent();
      
      // Analyser et stocker chaque élément de texte avec son style
      for (let j = 0; j < textContent.items.length; j++) {
        const item = textContent.items[j] as TextItem;
        
        if (!item.str || typeof item.str !== 'string') continue;
        
        // Extraire les informations de style
        const transform = item.transform || [1, 0, 0, 1, 0, 0];
        const x = transform[4];
        const y = transform[5];
        yPositions.push(y);
        
        // Estimer la taille de police
        const fontSize = Math.sqrt(Math.pow(transform[0], 2) + Math.pow(transform[1], 2)) * 12;
        
        // Déterminer la couleur du texte (si disponible)
        let colorStr = '#000000'; // Noir par défaut
        if (item.color && item.color.length >= 3) {
          const r = Math.round(item.color[0] * 255);
          const g = Math.round(item.color[1] * 255);
          const b = Math.round(item.color[2] * 255);
          colorStr = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          colors.add(colorStr);
        }
        
        // Déterminer la police
        const fontFamily = item.fontName || 'sans-serif';
        fonts.add(fontFamily);
        
        // Estimer si c'est un titre
        const isHeader = fontSize > 14;
        
        // Suivre les statistiques de mots et lignes
        const words = item.str.split(/\s+/).filter(w => w.length > 0);
        wordCount += words.length;
        if (item.hasEOL) lineCount++;
        
        // Créer l'élément avec style
        const element: TextElementWithStyle = {
          text: item.str,
          style: {
            fontFamily: fontFamily,
            fontSize: fontSize,
            fontWeight: fontFamily.toLowerCase().includes('bold') ? 'bold' : 'normal',
            color: colorStr,
            position: {
              x,
              y,
              pageIndex: i - 1
            }
          },
          isHeader,
          sectionLevel: isHeader ? (fontSize > 18 ? 1 : 2) : 0
        };
        
        allElements.push(element);
        
        // Ajouter au texte complet
        fullText += item.str + (item.hasEOL ? '\n' : ' ');
        
        // Ajouter à la version HTML
        htmlContent += `<div style="position:absolute; left:${x}px; top:${viewport.height - y}px; font-family:'${fontFamily}'; font-size:${fontSize}px; color:${colorStr}; ${fontFamily.toLowerCase().includes('bold') ? 'font-weight:bold;' : ''}">${item.str}</div>`;
      }
      
      htmlContent += '</div>'; // Fin de la page
    }
    
    htmlContent += '</div>'; // Fin du document
    
    // Calculer le nombre moyen de mots par ligne
    if (lineCount > 0) {
      averageWordsPerLine = wordCount / lineCount;
    }
    
    // Estimer le nombre de colonnes
    const columns = averageWordsPerLine < 8 ? 2 : 1;
    
    // Détecter l'en-tête et le pied de page
    const yValues = new Set(yPositions);
    const sortedY = Array.from(yValues).sort((a, b) => a - b);
    const hasHeader = sortedY.length > 5;
    const hasFooter = sortedY.length > 5;
    
    // Analyser les sections
    let currentSection = { title: 'Document', content: '', elements: [] as TextElementWithStyle[] };
    
    for (const element of allElements) {
      // Si c'est un titre, commencer une nouvelle section
      if (element.isHeader && element.text.trim().length > 0) {
        // Sauvegarder la section précédente si elle a du contenu
        if (currentSection.content.trim().length > 0 || currentSection.elements.length > 0) {
          sections.push({ ...currentSection });
        }
        
        // Commencer une nouvelle section
        currentSection = {
          title: element.text.trim(),
          content: '',
          elements: [element]
        };
      } else {
        // Ajouter à la section en cours
        currentSection.content += element.text + ' ';
        currentSection.elements.push(element);
      }
    }
    
    // Ajouter la dernière section
    if (currentSection.content.trim().length > 0 || currentSection.elements.length > 0) {
      sections.push(currentSection);
    }
    
    // Déterminer les couleurs principales (les plus utilisées)
    const colorCounts: Record<string, number> = {};
    for (const element of allElements) {
      colorCounts[element.style.color] = (colorCounts[element.style.color] || 0) + 1;
    }
    
    // Trier les couleurs par fréquence
    const sortedColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([color]) => color);
    
    const mainColor = sortedColors[0] || '#000000';
    const secondaryColor = sortedColors[1] || '#666666';
    
    // Extraire les mots-clés potentiels pour l'analyse
    const extractKeywords = (text: string): string[] => {
      const words = text.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .map(word => word.replace(/[.,;:!?()[\]{}""'']/g, ''));
        
      const skillKeywords = [
        'développement', 'development', 'javascript', 'python', 'java',
        'cloud', 'aws', 'azure', 'gcp', 'devops', 'docker', 'kubernetes',
        'agile', 'scrum', 'kanban', 'marketing', 'vente', 'sales', 'management'
      ];
      
      return words.filter(word => 
        skillKeywords.includes(word) || 
        skillKeywords.some(keyword => word.includes(keyword))
      );
    };
    
    // Ajouter des mots-clés à partir du texte complet
    for (const keyword of extractKeywords(fullText)) {
      keywords.add(keyword);
    }
    
    // Créer le template original
    const originalTemplate = {
      elements: allElements,
      layout: {
        pageSize: {
          width: pdfDocument.numPages > 0 ? 
            (await pdfDocument.getPage(1)).getViewport({ scale: 1.0 }).width : 595, // A4 default
          height: pdfDocument.numPages > 0 ? 
            (await pdfDocument.getPage(1)).getViewport({ scale: 1.0 }).height : 842 // A4 default
        },
        margins: { top: 50, right: 50, bottom: 50, left: 50 }, // Estimation par défaut
        columns
      },
      colors: Array.from(colors),
      fonts: Array.from(fonts)
    };
    
    console.log('Traitement complet du PDF terminé');
    
    // Créer l'objet de résultat complet
    const documentInfo: PDFDocumentInfo = {
      text: fullText,
      html: htmlContent,
      metadata: {
        title: metadataInfo.Title,
        author: metadataInfo.Author,
        creationDate: metadataInfo.CreationDate 
          ? new Date(metadataInfo.CreationDate) 
          : undefined,
        pageCount: pdfDocument.numPages,
        format: 'pdf'
      },
      structure: {
        sections,
        keywords: Array.from(keywords),
        layout: {
          columns,
          hasHeader,
          hasFooter,
          mainColor,
          secondaryColor
        }
      },
      originalArrayBuffer: arrayBuffer,
      originalTemplate
    };
    
    return documentInfo;
  } catch (error) {
    console.error('Erreur lors du traitement du PDF:', error);
    throw new Error(`Erreur lors du traitement du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}