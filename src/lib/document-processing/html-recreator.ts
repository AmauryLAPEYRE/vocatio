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
  palette: string[]; // Couleurs utilisées
  fonts: string[];   // Polices utilisées
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
 * Classe qui analyse un PDF et crée une représentation HTML/CSS fidèle
 */
export class HTMLRecreator {
  /**
   * Analyse un PDF et extrait toutes les informations nécessaires pour le recréer
   * @param pdfArrayBuffer Buffer du PDF à analyser
   * @returns Template du document avec tous les éléments
   */
  static async analyzePDF(pdfArrayBuffer: ArrayBuffer): Promise<DocumentTemplate> {
    console.log('Début de l\'analyse complète du PDF');
    
    try {
      // S'assurer que le worker PDF.js est correctement configuré
      if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      }
      
      // Charger le document PDF
      const pdfDocument = await pdfjs.getDocument({ data: pdfArrayBuffer }).promise;
      console.log(`Document chargé, nombre de pages: ${pdfDocument.numPages}`);
      
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
          const b = Math.round(colorArray[2] * 255);
          const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          
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
      
      // Mise à jour du template avec les informations extraites
      template.palette = Array.from(colorSet);
      template.fonts = Array.from(fontSet);
      
      // Estimer le nombre de colonnes
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
        
        // Calcul des marges estimées (10% de marge si aucun élément n'est trouvé près des bords)
        template.layout.margins = {
          left: Math.min(...xPositions) || pageWidth * 0.1,
          right: pageWidth - (Math.max(...xPositions) || pageWidth * 0.9),
          top: Math.min(...yPositions) || pageHeight * 0.1,
          bottom: pageHeight - (Math.max(...yPositions) || pageHeight * 0.9)
        };
      }
      
      console.log('Analyse PDF complète terminée');
      return template;
      
    } catch (error) {
      console.error('Erreur lors de l\'analyse du PDF:', error);
      throw new Error(`Erreur lors de l'analyse du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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
    // Analyse simple : si les éléments texte sont répartis en groupes horizontaux distincts
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
    console.log('Génération du HTML à partir du template');
    
    const css = `
      .pdf-document {
        position: relative;
        font-family: sans-serif;
        margin: 0 auto;
        background-color: white;
      }
      
      .pdf-page {
        position: relative;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        background-color: white;
        margin: 20px auto;
        overflow: hidden;
      }
      
      .pdf-element {
        position: absolute;
        white-space: pre;
        transform-origin: left top;
      }
      
      @media print {
        body { margin: 0; }
        .pdf-page { margin: 0; page-break-after: always; box-shadow: none; }
      }
    `;
    
    let html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Document recréé</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="pdf-document">`;
    
    // Pour chaque page du template
    for (const page of template.pages) {
      html += `
        <div class="pdf-page" style="width: ${page.width}px; height: ${page.height}px;">`;
      
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
                // Simplification : remplacer tout le texte de la section
                // Une implémentation plus avancée ferait une correspondance plus précise
                content = optimizedSections[section.id];
                break;
              }
            }
          }
          
          // Créer le style pour l'élément
          const transform = textElement.transform ? 
            `matrix(${textElement.transform[0]}, ${textElement.transform[1]}, ${textElement.transform[2]}, ${textElement.transform[3]}, ${textElement.transform[4]}, ${textElement.transform[5]})` : 
            'none';
          
          html += `
            <div class="pdf-element" style="
              left: ${textElement.x}px;
              top: ${textElement.y}px;
              font-family: '${textElement.fontFamily}', sans-serif;
              font-size: ${textElement.fontSize}px;
              font-weight: ${textElement.fontWeight};
              color: ${textElement.color};
              transform: ${transform};
            ">${content}</div>`;
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
        </div>`;
    }
    
    html += `
      </div>
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
          // Une implémentation plus avancée analyserait et distribuerait le texte optimisé
          // entre les différents éléments de la section
          for (const element of section.elements) {
            element.text = optimizedContent[sectionId];
          }
        }
      }
    }
    
    return newTemplate;
  }
}