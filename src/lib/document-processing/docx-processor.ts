// src/lib/document-processing/docx-processor.ts
import mammoth from 'mammoth';

interface DOCXDocumentInfo {
  text: string;
  html: string;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: Date;
    pageCount?: number;
    format: 'docx';
  };
  structure: {
    sections: {
      title: string;
      content: string;
    }[];
    styles: {
      name: string;
      count: number;
    }[];
  };
  originalArrayBuffer: ArrayBuffer;
}

/**
 * Extrait le texte, le HTML et les métadonnées d'un fichier DOCX
 * @param file Fichier DOCX à traiter
 * @returns Informations sur le document DOCX
 */
export async function processDOCXDocument(file: File): Promise<DOCXDocumentInfo> {
  // Convertir le fichier en ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  
  // Extraire le texte et le HTML
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const textResult = await mammoth.extractRawText({ arrayBuffer });
  
  // Structure pour stocker les informations
  const documentInfo: DOCXDocumentInfo = {
    text: textResult.value,
    html: result.value,
    metadata: {
      format: 'docx',
    },
    structure: {
      sections: [],
      styles: [],
    },
    originalArrayBuffer: arrayBuffer,
  };
  
  // Analyse simple du HTML pour extraire les sections
  const parser = new DOMParser();
  const doc = parser.parseFromString(result.value, 'text/html');
  
  // Extraction des titres (h1, h2, h3, etc.)
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach(heading => {
    const title = heading.textContent || '';
    const content = getContentUntilNextHeading(heading);
    
    documentInfo.structure.sections.push({
      title,
      content
    });
  });
  
  // Analyse des styles utilisés (classes CSS)
  const styledElements = doc.querySelectorAll('[class]');
  const styleMap = new Map<string, number>();
  
  styledElements.forEach(element => {
    const classes = element.getAttribute('class')?.split(' ') || [];
    classes.forEach(className => {
      if (className) {
        styleMap.set(className, (styleMap.get(className) || 0) + 1);
      }
    });
  });
  
  // Transformer la map des styles en tableau
  documentInfo.structure.styles = Array.from(styleMap.entries()).map(([name, count]) => ({
    name,
    count
  }));
  
  return documentInfo;
}

/**
 * Récupère le contenu textuel entre un élément de titre et le prochain titre
 */
function getContentUntilNextHeading(heading: Element): string {
  let content = '';
  let currentNode = heading.nextSibling;
  
  while (currentNode && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(currentNode.nodeName)) {
    if (currentNode.textContent) {
      content += currentNode.textContent + ' ';
    }
    currentNode = currentNode.nextSibling;
  }
  
  return content.trim();
}