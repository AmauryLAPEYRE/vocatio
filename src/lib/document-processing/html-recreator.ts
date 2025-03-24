// src/lib/document-processing/html-recreator.ts
import * as pdfjs from 'pdfjs-dist';

interface TextElement {
  text: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  transform?: number[];
  pageIndex: number;
}

interface SectionElement {
  id: string;
  title: string;
  elements: TextElement[];
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ImageElement {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
}

interface DocumentTemplate {
  pages: {
    width: number;
    height: number;
    elements: (TextElement | ImageElement)[];
    sections: SectionElement[];
  }[];
  palette: string[]; 
  fonts: string[];
  layout: {
    columns: number;
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
}

/**
 * Convertit une chaîne Base64 en ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Classe qui analyse un PDF et crée une représentation HTML/CSS fidèle
 */
export class HTMLRecreator {
  /**
   * Analyse un PDF et extrait toutes les informations nécessaires pour le recréer
   * @param pdfData Buffer du PDF ou chaîne Base64 à analyser
   * @returns Template du document avec tous les éléments
   */
  static async analyzePDF(pdfData: ArrayBuffer | string): Promise<DocumentTemplate> {
    try {
      // Configuration du worker
      if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
        const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      }
      
      // Préparer les données du PDF (ArrayBuffer)
      let pdfBuffer: ArrayBuffer;
      
      // Si les données sont au format Base64, les convertir en ArrayBuffer
      if (typeof pdfData === 'string') {
        pdfBuffer = base64ToArrayBuffer(pdfData);
      } else {
        // Sinon, utiliser les données ArrayBuffer directement
        pdfBuffer = pdfData;
      }
      
      // Options optimisées pour le chargement PDF
      const loadingOptions = {
        data: pdfBuffer,
        useWorkerFetch: false,
        standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
        cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
        cMapPacked: true
      };
      
      // Charger le document PDF
      const pdfDocument = await pdfjs.getDocument(loadingOptions).promise;
      
      const template: DocumentTemplate = {
        pages: [],
        palette: [],
        fonts: [],
        layout: {
          columns: 1,
          margins: { top: 0, right: 0, bottom: 0, left: 0 }
        }
      };
      
      // Pour détecter les colonnes et les sections
      const colorSet = new Set<string>();
      const fontSet = new Set<string>();
      
      // Analyser chaque page
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        
        const pageElements: (TextElement | ImageElement)[] = [];
        
        // Extraction du contenu texte avec style
        const textContent = await page.getTextContent();
        const textItems = textContent.items.filter(item => 'str' in item);
        
        for (const item of textItems) {
          // @ts-ignore - Conversion de type pour accéder aux propriétés
          const text = item.str || '';
          if (!text.trim()) continue;
          
          // @ts-ignore
          const transform = item.transform || [1, 0, 0, 1, 0, 0];
          const [a, b, c, d, e, f] = transform;
          
          // Calculer la position et la taille
          const x = e;
          const y = viewport.height - f; // Inverser la coordonnée y
          
          // Estimer la taille de police et l'angle
          const fontSize = Math.sqrt(a * a + b * b) * 12;
          const angle = Math.atan2(b, a) * (180 / Math.PI);
          
          // Déterminer la couleur (si disponible)
          // @ts-ignore
          const colorArray = item.color || [0, 0, 0];
          const r = Math.round(colorArray[0] * 255);
          const g = Math.round(colorArray[1] * 255);
          const blueVal = Math.round(colorArray[2] * 255);
          const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${blueVal.toString(16).padStart(2, '0')}`;
          
          // Ajouter à la palette de couleurs
          colorSet.add(color);
          
          // Déterminer la police
          // @ts-ignore
          const fontName = item.fontName || 'sans-serif';
          fontSet.add(fontName);
          
          // Déterminer le poids de la police
          const isBold = fontName.toLowerCase().includes('bold');
          
          // Créer l'élément texte
          const textElement: TextElement = {
            text,
            x,
            y,
            fontFamily: fontName.replace(/Bold|Italic|Regular|Medium/i, '').trim() || 'sans-serif',
            fontSize,
            fontWeight: isBold ? 'bold' : 'normal',
            color,
            transform,
            pageIndex: i - 1
          };
          
          pageElements.push(textElement);
        }
        
        // Détecter les sections du document
        const sections: SectionElement[] = [];
        
        // Regrouper les éléments texte par proximité et style similaire
        const potentialSections = this.detectSections(pageElements.filter(e => 'text' in e) as TextElement[]);
        
        for (let j = 0; j < potentialSections.length; j++) {
          const section = potentialSections[j];
          const elements = section.elements;
          
          // Calculer la boîte englobante
          const xValues = elements.map(e => e.x);
          const yValues = elements.map(e => e.y);
          const minX = Math.min(...xValues);
          const maxX = Math.max(...xValues);
          const minY = Math.min(...yValues);
          const maxY = Math.max(...yValues);
          
          sections.push({
            id: `section-${i}-${j}`,
            title: elements[0]?.text || `Section ${j + 1}`,
            elements,
            boundingBox: {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY
            }
          });
        }
        
        // Ajouter la page au template
        template.pages.push({
          width: viewport.width,
          height: viewport.height,
          elements: pageElements,
          sections
        });
      }
      
      // Mise à jour du template
      template.palette = Array.from(colorSet);
      template.fonts = Array.from(fontSet);
      template.layout.columns = this.estimateColumnCount(template.pages[0]?.elements || []);
      
      // Estimer les marges
      if (template.pages.length > 0) {
        const xPositions = template.pages[0].elements
          .filter(e => 'text' in e)
          .map(e => e.x);
        
        const yPositions = template.pages[0].elements
          .filter(e => 'text' in e)
          .map(e => ('y' in e) ? e.y : 0);
        
        const pageWidth = template.pages[0].width;
        const pageHeight = template.pages[0].height;
        
        template.layout.margins = {
          left: Math.min(...xPositions) || pageWidth * 0.1,
          right: pageWidth - (Math.max(...xPositions) || pageWidth * 0.9),
          top: Math.min(...yPositions) || pageHeight * 0.1,
          bottom: pageHeight - (Math.max(...yPositions) || pageHeight * 0.9)
        };
      }
      
      return template;
    } catch (error) {
      console.error('Erreur lors de l\'analyse du PDF:', error);
      throw error;
    }
  }
  
  /**
   * Regroupe les éléments texte en sections potentielles
   */
  private static detectSections(textElements: TextElement[]): { elements: TextElement[] }[] {
    // Trier les éléments par position y (de haut en bas)
    const sortedElements = [...textElements].sort((a, b) => a.y - b.y);
    
    const sections: { elements: TextElement[] }[] = [];
    let currentSection: TextElement[] = [];
    
    // Regrouper les éléments par proximité verticale
    for (let i = 0; i < sortedElements.length; i++) {
      const element = sortedElements[i];
      
      // Si c'est le premier élément ou s'il est proche du précédent
      if (i === 0 || element.y - sortedElements[i - 1].y < element.fontSize * 1.5) {
        currentSection.push(element);
      } else {
        // Si l'élément est éloigné, commencer une nouvelle section
        if (currentSection.length > 0) {
          sections.push({ elements: [...currentSection] });
        }
        currentSection = [element];
      }
    }
    
    // Ajouter la dernière section
    if (currentSection.length > 0) {
      sections.push({ elements: currentSection });
    }
    
    return sections;
  }
  
  /**
   * Estime le nombre de colonnes dans une page
   */
  private static estimateColumnCount(elements: any[]): number {
    const textElements = elements.filter(e => 'text' in e);
    if (textElements.length < 5) return 1;
    
    // Extraire les positions x et regrouper par proximité
    const xPositions = textElements.map(e => e.x).sort((a, b) => a - b);
    
    // Calculer les différences entre positions x consécutives
    const diffs = [];
    for (let i = 1; i < xPositions.length; i++) {
      diffs.push(xPositions[i] - xPositions[i - 1]);
    }
    
    // Trier les différences par valeur
    const sortedDiffs = [...diffs].sort((a, b) => b - a);
    
    // S'il y a une grande différence entre les positions x, cela peut indiquer plusieurs colonnes
    if (sortedDiffs.length > 0 && sortedDiffs[0] > 100) {
      return 2; // Détection simple de 2 colonnes
    }
    
    return 1;
  }
  
  /**
   * Génère un document HTML/CSS qui reproduit fidèlement le template
   * @param template Template du document
   * @param optimizedSections Sections avec contenu optimisé
   * @returns Code HTML/CSS du document recréé
   */
  static generateHTML(template: DocumentTemplate, optimizedSections?: Record<string, string>): string {
    // CSS amélioré avec meilleure visibilité et débogage
    const css = `
      body, html {
        margin: 0;
        padding: 0;
        background-color: white;
        font-family: sans-serif;
        color: black;
      }
      
      .pdf-document {
        position: relative;
        margin: 0 auto;
        background-color: white;
        overflow: visible;
      }
      
      .pdf-page {
        position: relative;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        background-color: white;
        margin: 20px auto;
        padding: 0;
        overflow: visible;
        border: 1px solid #ddd;
      }
      
      .pdf-element {
        position: absolute;
        white-space: pre;
        transform-origin: left top;
        overflow: visible;
        /* Pour débogage, décommentez ces lignes: */
        /*border: 1px solid rgba(255, 0, 0, 0.1);
        background-color: rgba(255, 255, 0, 0.05);*/
        z-index: 1;
      }
      
      .pdf-container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      
      /* Média queries pour l'impression */
      @media print {
        body { margin: 0; }
        .pdf-page { margin: 0; page-break-after: always; box-shadow: none; }
      }
    `;
    
    let html = `<!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document recréé</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="pdf-document">`;
    
    // Pour chaque page du template
    for (const page of template.pages) {
      html += `
        <div class="pdf-page" style="width: ${page.width}px; height: ${page.height}px;">
          <div class="pdf-container">`;
      
      // Ajouter chaque élément
      for (const element of page.elements) {
        if ('text' in element) {
          // Élément texte
          const textElement = element as TextElement;
          
          // Vérifier si le texte fait partie d'une section optimisée
          let content = textElement.text;
          
          // Si nous avons des sections optimisées, remplacer le contenu si nécessaire
          if (optimizedSections) {
            for (const section of page.sections) {
              if (optimizedSections[section.id] && section.elements.includes(textElement)) {
                content = optimizedSections[section.id];
                break;
              }
            }
          }
          
          // Créer le style pour l'élément avec valeurs de sécurité par défaut
          const transform = textElement.transform ? 
            `matrix(${textElement.transform[0] || 1}, ${textElement.transform[1] || 0}, ${textElement.transform[2] || 0}, ${textElement.transform[3] || 1}, ${textElement.transform[4] || 0}, ${textElement.transform[5] || 0})` : 
            'none';
          
          // S'assurer que le contenu est visible et contient quelque chose
          const safeContent = content || ' ';
          
          html += `
            <div class="pdf-element" style="
              left: ${textElement.x}px;
              top: ${textElement.y}px;
              font-family: '${textElement.fontFamily.replace(/['"<>]/g, '')}, sans-serif';
              font-size: ${textElement.fontSize || 12}px;
              font-weight: ${textElement.fontWeight || 'normal'};
              color: ${textElement.color || 'black'};
              transform: ${transform};
              min-width: 4px;
              min-height: 4px;
              text-align: left;
            ">${safeContent}</div>`;
        } else if ('src' in element) {
          // Élément image
          const imageElement = element as ImageElement;
          html += `
            <img class="pdf-element" src="${imageElement.src}" style="
              left: ${imageElement.x}px;
              top: ${imageElement.y}px;
              width: ${imageElement.width}px;
              height: ${imageElement.height}px;
            ">`;
        }
      }
      
      // Ajouter un marqueur pour débogage
      html += `
        <div style="position:absolute; top:10px; left:10px; width:20px; height:20px; background:red; z-index:9999;"></div>
      `;
      
      html += `
          </div>
        </div>`;
    }
    
    html += `
      </div>
      <script>
        // Script pour forcer le rendu des éléments
        document.addEventListener('DOMContentLoaded', function() {
          setTimeout(function() {
            const elements = document.querySelectorAll('.pdf-element');
            elements.forEach(function(el) {
              // Force reflow
              el.style.opacity = '0.999';
              setTimeout(() => { el.style.opacity = '1'; }, 10);
            });
          }, 100);
        });
      </script>
    </body>
    </html>`;
    
    return html;
  }
  
  /**
   * Remplace le contenu des sections dans le template avec le contenu optimisé
   * @param template Template du document original
   * @param optimizedContent Contenu optimisé par section
   * @returns Template avec contenu remplacé
   */
  static replaceContent(template: DocumentTemplate, optimizedContent: Record<string, string>): DocumentTemplate {
    // Créer une copie profonde du template
    const newTemplate = JSON.parse(JSON.stringify(template));
    
    // Pour chaque page
    for (let i = 0; i < newTemplate.pages.length; i++) {
      const page = newTemplate.pages[i];
      
      // Pour chaque section
      for (let j = 0; j < page.sections.length; j++) {
        const section = page.sections[j];
        const sectionId = section.id;
        
        // Si nous avons du contenu optimisé pour cette section
        if (optimizedContent[sectionId]) {
          // Remplacer le texte de tous les éléments de cette section
          for (const element of section.elements) {
            element.text = optimizedContent[sectionId];
          }
        }
      }
    }
    
    return newTemplate;
  }
}