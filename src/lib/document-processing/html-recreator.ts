// src/lib/document-processing/html-recreator.ts
import * as pdfjs from 'pdfjs-dist';

interface TextElement {
  text: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle?: string;
  color: string;
  transform?: number[];
  angle?: number;
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
    elements: (TextElement | ImageElement | any)[];
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

interface PDFMetadataInfo {
  Title?: string;
  Author?: string;
  CreationDate?: string;
  [key: string]: any;
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
      
      // Extraire les métadonnées
      const metadata = await pdfDocument.getMetadata();
      const metadataInfo = metadata.info as PDFMetadataInfo || {};
      
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
        
        // AMÉLIORATION: Extraire également les éléments graphiques (lignes, rectangles, etc.)
        const operatorList = await page.getOperatorList();
        const graphicElements: any[] = [];
        
        // Analyser les opérateurs pour extraire les éléments graphiques
        for (let j = 0; j < operatorList.fnArray.length; j++) {
          const op = operatorList.fnArray[j];
          const args = operatorList.argsArray[j];
          
          // Extraire les rectangles (souvent utilisés pour les sections/bordures)
          if (op === pdfjs.OPS.rectangle) {
            graphicElements.push({
              type: 'rectangle',
              x: args[0],
              y: viewport.height - args[1] - args[3], // Inverser la coordonnée y
              width: args[2],
              height: args[3],
              color: 'rgba(0, 0, 0, 0.1)', // Couleur par défaut, à ajuster
              pageIndex: i - 1
            });
          }
          
          // Extraire les lignes
          if (op === pdfjs.OPS.moveTo && j < operatorList.fnArray.length - 1 && 
              operatorList.fnArray[j + 1] === pdfjs.OPS.lineTo) {
            const startArgs = args;
            const endArgs = operatorList.argsArray[j + 1];
            
            graphicElements.push({
              type: 'line',
              x1: startArgs[0],
              y1: viewport.height - startArgs[1],
              x2: endArgs[0],
              y2: viewport.height - endArgs[1],
              color: 'rgba(0, 0, 0, 0.5)', // Couleur par défaut, à ajuster
              pageIndex: i - 1
            });
          }
        }
        
        // AMÉLIORATION: Ajouter les éléments graphiques au template
        const pageElements: (TextElement | ImageElement | any)[] = [...graphicElements];
        
        // Extraction du contenu texte avec style
        const textContent = await page.getTextContent({ includeMarkedContent: true });
        const textItems = textContent.items.filter(item => 'str' in item);
        
        // AMÉLIORATION: Analyse des styles plus précise
        for (const item of textItems) {
          // @ts-ignore - Conversion de type pour accéder aux propriétés
          const text = item.str || '';
          if (!text.trim()) continue;
          
          // @ts-ignore
          const transform = item.transform || [1, 0, 0, 1, 0, 0];
          const [a, b, c, d, e, f] = transform;
          
          // Calculer la position
          const x = e;
          const y = viewport.height - f; // Inverser la coordonnée y
          
          // Estimer la taille de police et l'angle avec plus de précision
          const fontSize = Math.sqrt(a * a + b * b) * 12;
          const angle = Math.atan2(b, a) * (180 / Math.PI);
          
          // AMÉLIORATION: Meilleure détection de la couleur
          // @ts-ignore
          let color = '#000000'; // Noir par défaut
          try {
            // @ts-ignore
            if (item.color) {
              // @ts-ignore
              const colorArray = item.color;
              const r = Math.round(colorArray[0] * 255);
              const g = Math.round(colorArray[1] * 255);
              const b = Math.round(colorArray[2] * 255);
              color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
          } catch (err) {
            console.error('Erreur lors de l\'extraction de la couleur:', err);
          }
          
          // Ajouter à la palette de couleurs
          colorSet.add(color);
          
          // AMÉLIORATION: Meilleure analyse des polices
          // @ts-ignore
          let fontFamily = 'sans-serif';
          let fontWeight = 'normal';
          let fontStyle = 'normal';
          
          try {
            // @ts-ignore
            if (item.fontName) {
              // @ts-ignore
              const fontName = item.fontName;
              fontSet.add(fontName);
              
              // Extraire le nom de base de la police
              fontFamily = fontName.replace(/-(Bold|Italic|Regular|Medium|Light|ExtraBold|BoldItalic|LightItalic|MediumItalic)$/i, '');
              
              // Détecter le style et le poids
              if (fontName.includes('Bold')) fontWeight = 'bold';
              if (fontName.includes('ExtraBold')) fontWeight = '800';
              if (fontName.includes('Light')) fontWeight = '300';
              if (fontName.includes('Medium')) fontWeight = '500';
              if (fontName.includes('Italic')) fontStyle = 'italic';
            }
          } catch (err) {
            console.error('Erreur lors de l\'extraction de la police:', err);
          }
          
          // AMÉLIORATION: Ajout des informations de style
          const textElement: TextElement = {
            text,
            x,
            y,
            fontFamily,
            fontSize,
            fontWeight,
            fontStyle,
            color,
            transform,
            angle,
            pageIndex: i - 1
          };
          
          pageElements.push(textElement);
        }
        
        // Détection des sections du document avec algorithme amélioré
        const sections = this.detectSectionsImproved(pageElements.filter(e => 'text' in e) as TextElement[], graphicElements);
        
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
   * Version améliorée de la détection de sections qui prend en compte
   * les éléments graphiques comme délimiteurs
   */
  private static detectSectionsImproved(textElements: TextElement[], graphicElements: any[]): SectionElement[] {
    // Trier les éléments par position y (de haut en bas)
    const sortedElements = [...textElements].sort((a, b) => a.y - b.y);
    
    // Trouver les lignes horizontales qui pourraient séparer des sections
    const horizontalLines = graphicElements
      .filter(e => e.type === 'line' && Math.abs(e.y1 - e.y2) < 5) // Lignes à peu près horizontales
      .map(e => ({ y: Math.min(e.y1, e.y2), width: Math.abs(e.x2 - e.x1) }))
      .filter(line => line.width > 50) // Lignes assez longues pour être des séparateurs
      .sort((a, b) => a.y - b.y);
    
    // Trouver les rectangles qui pourraient encadrer des sections
    const rectangles = graphicElements
      .filter(e => e.type === 'rectangle' && e.width > 50 && e.height > 20) // Rectangles assez grands
      .sort((a, b) => a.y - b.y);
    
    const sections: SectionElement[] = [];
    let currentSection: TextElement[] = [];
    let sectionStartY = 0;
    
    // Fonction pour vérifier si un élément est proche d'une ligne horizontale
    const isNearHorizontalLine = (element: TextElement, tolerance: number = 15): boolean => {
      return horizontalLines.some(line => Math.abs(element.y - line.y) < tolerance);
    };
    
    // Fonction pour vérifier si un élément est dans un rectangle
    const findEnclosingRectangle = (element: TextElement): any | null => {
      return rectangles.find(rect => 
        element.x >= rect.x && element.x <= rect.x + rect.width &&
        element.y >= rect.y && element.y <= rect.y + rect.height
      ) || null;
    };
    
    // Regrouper les éléments en sections
    for (let i = 0; i < sortedElements.length; i++) {
      const element = sortedElements[i];
      
      // Premier élément ou éléments proches
      if (i === 0) {
        currentSection = [element];
        sectionStartY = element.y;
        continue;
      }
      
      // Vérifier s'il faut commencer une nouvelle section
      const startNewSection = 
        // Si l'élément est séparé par une grande distance verticale
        (element.y - sortedElements[i - 1].y > element.fontSize * 2) ||
        // Ou si l'élément est près d'une ligne horizontale (possible séparateur de section)
        isNearHorizontalLine(element) ||
        // Ou si l'élément est dans un rectangle différent
        (findEnclosingRectangle(element) !== findEnclosingRectangle(sortedElements[i - 1])) ||
        // Ou si l'élément a un style très différent (possible titre de section)
        (element.fontSize > sortedElements[i - 1].fontSize * 1.3 || element.fontWeight === 'bold' && sortedElements[i - 1].fontWeight !== 'bold');
      
      if (startNewSection) {
        if (currentSection.length > 0) {
          // Calculer la boîte englobante de la section actuelle
          const xValues = currentSection.map(e => e.x);
          const yValues = currentSection.map(e => e.y);
          const minX = Math.min(...xValues);
          const maxX = Math.max(...xValues);
          const minY = Math.min(...yValues);
          const maxY = Math.max(...yValues);
          
          // Ajouter la section actuelle
          sections.push({
            id: `section-${sections.length}`,
            title: currentSection[0]?.text || `Section ${sections.length + 1}`,
            elements: [...currentSection],
            boundingBox: {
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY
            }
          });
        }
        
        // Commencer une nouvelle section
        currentSection = [element];
        sectionStartY = element.y;
      } else {
        // Continuer la section actuelle
        currentSection.push(element);
      }
    }
    
    // Ajouter la dernière section
    if (currentSection.length > 0) {
      const xValues = currentSection.map(e => e.x);
      const yValues = currentSection.map(e => e.y);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const minY = Math.min(...yValues);
      const maxY = Math.max(...yValues);
      
      sections.push({
        id: `section-${sections.length}`,
        title: currentSection[0]?.text || `Section ${sections.length + 1}`,
        elements: currentSection,
        boundingBox: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        }
      });
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
   * Version améliorée avec meilleur support des polices et éléments graphiques
   */
  static generateHTML(template: DocumentTemplate, optimizedSections?: Record<string, string>): string {
    // Ajouter les polices (Google Fonts ou autres)
    const fontImports = this.generateFontImports(template.fonts);
    
    // CSS amélioré avec meilleure fidélité visuelle
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
        z-index: 1;
      }
      
      .pdf-line {
        position: absolute;
        overflow: visible;
        z-index: 0;
      }
      
      .pdf-rectangle {
        position: absolute;
        overflow: visible;
        z-index: 0;
      }
      
      .pdf-container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      
      /* Média queries pour l'impression */
      @media print {
        body { margin: 0; padding: 0; }
        .pdf-page { margin: 0; page-break-after: always; box-shadow: none; }
      }
    `;
    
    let html = `<!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CV Optimisé</title>
      ${fontImports}
      <style>${css}</style>
    </head>
    <body>
      <div class="pdf-document">`;
    
    // Pour chaque page du template
    for (const page of template.pages) {
      html += `
        <div class="pdf-page" style="width: ${page.width}px; height: ${page.height}px;">
          <div class="pdf-container">`;
      
      // Ajouter d'abord les éléments graphiques (en arrière-plan)
      for (const element of page.elements) {
        if (element.type === 'rectangle') {
          html += `
            <div class="pdf-rectangle" style="
              left: ${element.x}px;
              top: ${element.y}px;
              width: ${element.width}px;
              height: ${element.height}px;
              background-color: ${element.color || 'rgba(0, 0, 0, 0.1)'};
              border: 1px solid ${element.borderColor || 'rgba(0, 0, 0, 0.2)'};
            "></div>`;
        } else if (element.type === 'line') {
          // Calculer la longueur et l'angle de la ligne
          const dx = element.x2 - element.x1;
          const dy = element.y2 - element.y1;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          
          html += `
            <div class="pdf-line" style="
              left: ${element.x1}px;
              top: ${element.y1}px;
              width: ${length}px;
              height: 1px;
              background-color: ${element.color || 'rgba(0, 0, 0, 0.5)'};
              transform: rotate(${angle}deg);
              transform-origin: left center;
            "></div>`;
        }
      }
      
      // Ensuite ajouter les éléments texte (au premier plan)
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
                // AMÉLIORATION: Préserver la casse et le format d'origine si possible
                if (textElement === section.elements[0] && textElement.fontWeight === 'bold') {
                  // C'est probablement un titre, conserver le texte original
                  content = textElement.text;
                } else {
                  content = optimizedSections[section.id];
                }
                break;
              }
            }
          }
          
          // Créer le style pour l'élément avec valeurs de sécurité par défaut
          const transform = textElement.transform ? 
            `matrix(${textElement.transform[0] || 1}, ${textElement.transform[1] || 0}, ${textElement.transform[2] || 0}, ${textElement.transform[3] || 1}, 0, 0)` : 
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
              font-style: ${textElement.fontStyle || 'normal'};
              color: ${textElement.color || 'black'};
              transform: ${transform};
              min-width: 4px;
              min-height: 4px;
              text-align: left;
              ${textElement.angle ? `transform: rotate(${textElement.angle}deg);` : ''}
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
   * Génère les imports de polices pour les polices détectées
   */
  private static generateFontImports(fonts: string[]): string {
    // Liste des polices Google Fonts courantes
    const googleFonts = [
      'Arial', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro',
      'Raleway', 'PT Sans', 'Noto Sans', 'Ubuntu', 'Nunito', 'Poppins', 'Inter',
      'Quicksand', 'Rubik', 'Work Sans', 'Mulish', 'Nunito Sans', 'DM Sans'
    ];
    
    // Filtrer et normaliser les noms de polices
    const normalizedFonts = fonts.map(font => {
      // Extraire le nom de base de la police
      return font.replace(/-(Bold|Italic|Regular|Medium|Light|ExtraBold|BoldItalic|LightItalic|MediumItalic)$/i, '');
    });
    
    // Supprimer les doublons
    const uniqueFonts = [...new Set(normalizedFonts)];
    
    // Filtrer pour n'inclure que les polices Google Fonts
    const googleFontsList = uniqueFonts.filter(font => 
      googleFonts.some(gFont => font.toLowerCase().includes(gFont.toLowerCase()))
    );
    
    // S'il y a des polices Google Fonts, générer l'import
    if (googleFontsList.length > 0) {
      const fontQuery = googleFontsList
        .map(font => font.replace(/\s+/g, '+'))
        .join('|');
      
      return `<link href="https://fonts.googleapis.com/css2?family=${fontQuery}:wght@300;400;500;700&display=swap" rel="stylesheet">`;
    }
    
    return '';
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