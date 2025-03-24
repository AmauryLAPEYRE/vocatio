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
        const pdfjsVersion = pdfjs.version || '3.11.174';
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
        console.log('PDF.js worker configuré dans HTMLRecreator');
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
        standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '3.11.174'}/standard_fonts/`,
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '3.11.174'}/cmaps/`,
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
      
      // Pour détecter les couleurs et les polices
      const colorSet = new Set<string>();
      const fontSet = new Set<string>();
      
      // Analyser chaque page
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });
        
        // AMÉLIORATION: Extraire les éléments graphiques (lignes, rectangles)
        const operatorList = await page.getOperatorList();
        const graphicElements: any[] = [];
        
        // Extraction du contenu texte avec style
        const textContent = await page.getTextContent({ includeMarkedContent: true });
        const textItems = textContent.items.filter(item => 'str' in item);
        
        // Traiter tous les éléments de texte
        const pageElements: (TextElement | ImageElement | any)[] = [];
        
        for (const item of textItems) {
          // Ignorer les textes vides
          const text = (item as any).str || '';
          if (!text.trim()) continue;
          
          const transform = (item as any).transform || [1, 0, 0, 1, 0, 0];
          const [a, b, c, d, e, f] = transform;
          
          // Calculer la position
          const x = e;
          const y = viewport.height - f; // Inverser la coordonnée y
          
          // Estimer la taille de police
          const fontSize = Math.sqrt(a * a + b * b) * 12;
          const angle = Math.atan2(b, a) * (180 / Math.PI);
          
          // Récupérer la couleur
          let color = '#000000'; // Noir par défaut
          try {
            if ((item as any).color) {
              const colorArray = (item as any).color;
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
          
          // Analyser la police
          let fontFamily = 'Inter, sans-serif'; // Utiliser Inter par défaut
          let fontWeight = 'normal';
          let fontStyle = 'normal';
          
          try {
            if ((item as any).fontName) {
              const fontName = (item as any).fontName;
              fontSet.add(fontName);
              
              // Mapper les noms de police PDF vers des polices web
              if (fontName.includes('Arial') || fontName.includes('Helvetica')) {
                fontFamily = 'Inter, Arial, sans-serif';
              } else if (fontName.includes('Times')) {
                fontFamily = 'Times New Roman, serif';
              } else if (fontName.includes('Courier')) {
                fontFamily = 'Courier New, monospace';
              } else {
                fontFamily = 'Inter, sans-serif';
              }
              
              // Détecter le style et le poids
              if (fontName.includes('Bold')) fontWeight = 'bold';
              if (fontName.includes('Italic')) fontStyle = 'italic';
            }
          } catch (err) {
            console.error('Erreur lors de l\'extraction de la police:', err);
          }
          
          // Créer l'élément de texte
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
        
        // Détection des sections du document
        const sections = this.detectSections(pageElements.filter(e => 'text' in e) as TextElement[]);
        
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
      
      // Estimer les marges
      if (template.pages.length > 0) {
        const xPositions = template.pages[0].elements
          .filter(e => 'text' in e)
          .map(e => (e as TextElement).x);
        
        const yPositions = template.pages[0].elements
          .filter(e => 'text' in e)
          .map(e => (e as TextElement).y);
        
        const pageWidth = template.pages[0].width;
        const pageHeight = template.pages[0].height;
        
        template.layout.margins = {
          left: Math.min(...xPositions) || 20,
          right: pageWidth - (Math.max(...xPositions) || pageWidth - 20),
          top: Math.min(...yPositions) || 20,
          bottom: pageHeight - (Math.max(...yPositions) || pageHeight - 20)
        };
      }
      
      return template;
    } catch (error) {
      console.error('Erreur lors de l\'analyse du PDF:', error);
      throw error;
    }
  }
  
  /**
   * Détecte les sections d'un document en fonction des éléments textuels
   */
  private static detectSections(textElements: TextElement[]): SectionElement[] {
    if (textElements.length === 0) return [];
    
    // Trier les éléments par position y (de haut en bas)
    const sortedElements = [...textElements].sort((a, b) => a.y - b.y);
    
    // Groupes d'éléments qui forment potentiellement des sections
    const sectionGroups: TextElement[][] = [];
    let currentGroup: TextElement[] = [sortedElements[0]];
    
    // Regrouper les éléments qui sont proches verticalement
    for (let i = 1; i < sortedElements.length; i++) {
      const currentElement = sortedElements[i];
      const prevElement = sortedElements[i - 1];
      
      // Vérifier si l'élément est suffisamment proche du précédent
      const verticalGap = currentElement.y - (prevElement.y + prevElement.fontSize);
      const isCloseVertically = verticalGap < currentElement.fontSize * 1.5;
      
      // Si l'élément est proche, l'ajouter au groupe courant
      if (isCloseVertically) {
        currentGroup.push(currentElement);
      } else {
        // Sinon, créer un nouveau groupe
        sectionGroups.push([...currentGroup]);
        currentGroup = [currentElement];
      }
    }
    
    // Ajouter le dernier groupe s'il n'est pas vide
    if (currentGroup.length > 0) {
      sectionGroups.push(currentGroup);
    }
    
    // Créer les sections à partir des groupes
    const sections: SectionElement[] = sectionGroups.map((group, index) => {
      // Trouver les limites de la section
      const xValues = group.map(e => e.x);
      const yValues = group.map(e => e.y);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const minY = Math.min(...yValues) - group[0].fontSize; // Ajouter un peu d'espace au-dessus
      
      // Calculer la hauteur en tenant compte de la taille de police du dernier élément
      const lastElement = group[group.length - 1];
      const maxY = lastElement.y + lastElement.fontSize;
      
      // Trouver le titre de la section (généralement le premier élément)
      const title = group[0].text;
      
      return {
        id: `section-${index}`,
        title,
        elements: group,
        boundingBox: {
          x: minX,
          y: minY,
          width: maxX - minX + 20, // Ajouter un peu de marge
          height: maxY - minY + 10  // Ajouter un peu de marge
        }
      };
    });
    
    return sections;
  }
  
  /**
   * Génère un document HTML/CSS qui reproduit fidèlement le template
   */
  static generateHTML(template: DocumentTemplate, optimizedSections?: Record<string, string>): string {
    // Ajouter les imports de polices
    const fontImports = this.generateFontImports();
    
    // CSS amélioré pour un rendu fidèle
    const css = `
      body, html {
        margin: 0;
        padding: 0;
        background-color: white;
        font-family: 'Inter', sans-serif;
        color: black;
      }
      
      .pdf-document {
        position: relative;
        margin: 0 auto;
        background-color: white;
      }
      
      .pdf-page {
        position: relative;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        background-color: white;
        margin: 20px auto;
        padding: 0;
        overflow: hidden;
        border: 1px solid #ddd;
      }
      
      .pdf-element {
        position: absolute;
        white-space: pre-wrap;
        overflow: visible;
        transform-origin: left top;
      }
      
      .pdf-section {
        position: absolute;
        border: 1px solid transparent;
      }
      
      .section-content {
        margin-top: 5px;
        line-height: 1.4;
      }
      
      @media print {
        body { margin: 0; }
        .pdf-page { margin: 0; page-break-after: always; box-shadow: none; border: none; }
        .pdf-page:last-child { page-break-after: avoid; }
      }
    `;
    
    // HTML de base
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
    
    // Pour chaque page
    for (const page of template.pages) {
      html += `
        <div class="pdf-page" style="width: ${page.width}px; height: ${page.height}px;">`;
      
      // Éléments qui ne sont pas du texte (lignes, rectangles, etc.)
      page.elements.forEach(element => {
        if (element.type === 'rectangle') {
          html += `
            <div class="pdf-element" style="
              left: ${element.x}px;
              top: ${element.y}px;
              width: ${element.width}px;
              height: ${element.height}px;
              background-color: ${element.color || 'rgba(0, 0, 0, 0.05)'};
              border: ${element.border ? '1px solid ' + element.borderColor : 'none'};
              z-index: 1;
            "></div>`;
        } else if (element.type === 'line') {
          const dx = element.x2 - element.x1;
          const dy = element.y2 - element.y1;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          
          html += `
            <div class="pdf-element" style="
              left: ${element.x1}px;
              top: ${element.y1}px;
              width: ${length}px;
              height: ${element.width || 1}px;
              background-color: ${element.color || 'rgba(0, 0, 0, 0.5)'};
              transform: rotate(${angle}deg);
              transform-origin: left center;
              z-index: 1;
            "></div>`;
        }
      });
      
      // Traiter les sections avec le contenu optimisé
      page.sections.forEach(section => {
        const optimizedContent = optimizedSections?.[section.id];
        
        html += `
          <div class="pdf-section" style="
            left: ${section.boundingBox.x}px;
            top: ${section.boundingBox.y}px;
            width: ${section.boundingBox.width}px;
            height: ${section.boundingBox.height}px;
            z-index: 10;
          ">`;
        
        // Titre de la section (premier élément)
        const titleElement = section.elements[0];
        
        html += `
          <div class="pdf-element section-title" style="
            position: relative;
            left: 0;
            top: 0;
            font-family: ${titleElement.fontFamily};
            font-size: ${titleElement.fontSize}px;
            font-weight: ${titleElement.fontWeight};
            color: ${titleElement.color};
            ${titleElement.fontStyle ? `font-style: ${titleElement.fontStyle};` : ''}
            white-space: pre-wrap;
          ">${titleElement.text}</div>`;
        
        // Contenu optimisé ou contenu original
        if (optimizedContent) {
          html += `
            <div class="section-content" style="
              position: relative;
              font-family: ${titleElement.fontFamily};
              font-size: ${Math.max(titleElement.fontSize - 2, 10)}px;
              color: ${titleElement.color};
              margin-left: 5px;
            ">${optimizedContent}</div>`;
        } else {
          // Afficher les autres éléments de la section
          for (let i = 1; i < section.elements.length; i++) {
            const element = section.elements[i];
            
            html += `
              <div class="pdf-element" style="
                position: relative;
                left: ${element.x - section.boundingBox.x}px;
                top: ${element.y - section.boundingBox.y}px;
                font-family: ${element.fontFamily};
                font-size: ${element.fontSize}px;
                font-weight: ${element.fontWeight};
                color: ${element.color};
                ${element.fontStyle ? `font-style: ${element.fontStyle};` : ''}
              ">${element.text}</div>`;
          }
        }
        
        html += `</div>`;
      });
      
      // Ajouter les éléments texte qui ne font pas partie d'une section
      page.elements.forEach(element => {
        if ('text' in element && !page.sections.some(section => 
          section.elements.includes(element)
        )) {
          html += `
            <div class="pdf-element" style="
              left: ${element.x}px;
              top: ${element.y}px;
              font-family: ${element.fontFamily};
              font-size: ${element.fontSize}px;
              font-weight: ${element.fontWeight};
              color: ${element.color};
              ${element.fontStyle ? `font-style: ${element.fontStyle};` : ''}
              z-index: 5;
            ">${element.text}</div>`;
        }
      });
      
      html += `</div>`;
    }
    
    html += `
      </div>
      <script>
        // Script pour s'assurer que le contenu est correctement rendu
        document.addEventListener('DOMContentLoaded', function() {
          const sections = document.querySelectorAll('.pdf-section');
          sections.forEach(section => {
            // Ajuster la hauteur des sections si nécessaire
            const contentHeight = Array.from(section.children)
              .reduce((height, element) => height + element.offsetHeight, 0);
            
            if (contentHeight > section.offsetHeight) {
              section.style.height = contentHeight + 'px';
            }
          });
        });
      </script>
    </body>
    </html>`;
    
    return html;
  }
  
  /**
   * Génère les imports de polices
   */
  private static generateFontImports(): string {
    return `
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    `;
  }
}