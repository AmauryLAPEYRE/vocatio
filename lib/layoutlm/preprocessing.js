// lib/layoutlm/preprocessing.js
import * as pdfjs from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Initialisation de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * Prétraite un document PDF pour l'analyse LayoutLM
 * @param {Blob} pdfFile - Fichier PDF à analyser
 * @param {Array} pageRenderings - Rendus visuels des pages (base64)
 * @returns {Promise<Object>} Données prétraitées pour LayoutLM
 */
export async function preprocessDocument(pdfFile, pageRenderings = []) {
  console.log('Prétraitement du document...');
  
  // Chargement du PDF
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  
  // Informations de base sur le PDF
  const pdfData = {
    pageCount: pdf.numPages,
    pages: []
  };
  
  // Extraction du texte et des mises en page
  const textBlocks = [];
  const promises = [];
  
  // Traiter chaque page
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    
    // Informations sur la page
    pdfData.pages.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      rotation: page.rotate || 0
    });
    
    // Extraire le texte et sa position
    const textContent = await page.getTextContent();
    const pageTextBlocks = processTextContent(textContent, viewport, i);
    textBlocks.push(...pageTextBlocks);
    
    // Si nous avons un rendu visuel pour cette page, l'analyser pour les caractéristiques visuelles
    if (pageRenderings[i-1]) {
      promises.push(extractVisualFeatures(pageRenderings[i-1], i));
    }
  }
  
  // Attendre l'extraction des caractéristiques visuelles
  const visualFeaturesResults = await Promise.all(promises);
  const visualFeatures = visualFeaturesResults.flat();
  
  // Compléter avec Tesseract si nécessaire (pour les zones sans texte détecté)
  if (textBlocks.length < 10 && pageRenderings.length > 0) {
    console.log('Peu de texte détecté, utilisation de Tesseract comme fallback...');
    const tesseractBlocks = await extractTextWithTesseract(pageRenderings);
    textBlocks.push(...tesseractBlocks);
  }
  
  return { pdfData, textBlocks, visualFeatures };
}

/**
 * Traite le contenu texte extrait par PDF.js
 * @param {Object} textContent - Contenu texte brut de PDF.js
 * @param {Object} viewport - Viewport de la page
 * @param {number} pageNumber - Numéro de page
 * @returns {Array} Blocs de texte structurés avec positionnement
 */
function processTextContent(textContent, viewport, pageNumber) {
  const blocks = [];
  
  // Regrouper les items textuels en blocs logiques
  let currentBlock = null;
  const lineHeight = estimateLineHeight(textContent.items);
  
  for (const item of textContent.items) {
    const [x, y, width, height] = calculateItemBBox(item, viewport);
    
    // Extraction de style
    const style = {
      fontSize: Math.round(item.transform[0] * 100) / 100,
      fontFamily: item.fontName,
      fontWeight: item.fontName.toLowerCase().includes('bold') ? 'bold' : 'normal',
      fontStyle: item.fontName.toLowerCase().includes('italic') ? 'italic' : 'normal',
      color: extractTextColor(item),
    };
    
    // Nouveau bloc ou continuation?
    if (!currentBlock || isNewBlock(currentBlock, { x, y }, lineHeight)) {
      if (currentBlock) {
        // Finalisation du bloc précédent
        finalizeTextBlock(currentBlock);
        blocks.push(currentBlock);
      }
      
      // Création d'un nouveau bloc
      currentBlock = {
        id: `text-${pageNumber}-${blocks.length}`,
        type: 'text',
        pageNumber,
        text: item.str,
        bbox: { x, y, width, height },
        style,
        chars: [{ text: item.str, bbox: { x, y, width, height }, style }]
      };
    } else {
      // Continuation du bloc courant
      currentBlock.text += item.str;
      currentBlock.bbox.width = Math.max(currentBlock.bbox.width, x + width - currentBlock.bbox.x);
      currentBlock.bbox.height = Math.max(currentBlock.bbox.height, y + height - currentBlock.bbox.y);
      currentBlock.chars.push({ text: item.str, bbox: { x, y, width, height }, style });
    }
  }
  
  // Ajouter le dernier bloc
  if (currentBlock) {
    finalizeTextBlock(currentBlock);
    blocks.push(currentBlock);
  }
  
  // Classification des blocs (titres, paragraphes, listes, etc.)
  return classifyTextBlocks(blocks);
}

/**
 * Finalise un bloc de texte en calculant des propriétés supplémentaires
 * @param {Object} block - Bloc de texte à finaliser
 */
function finalizeTextBlock(block) {
  // Détection des propriétés textuelles
  block.isBold = block.style.fontWeight === 'bold';
  block.isTitle = block.isBold && block.style.fontSize >= 14;
  block.isEmpty = block.text.trim().length === 0;
  
  // Marquer les blocs comme potentiellement modifiables (heuristique simple)
  block.editable = !block.isTitle && !block.isEmpty && block.text.length > 5;
  
  // Estimation du nombre de caractères maximum possible dans ce bloc
  const area = block.bbox.width * block.bbox.height;
  const charDensity = block.text.length / area;
  block.maxChars = Math.floor(area * charDensity * 1.1); // +10% de marge
}

/**
 * Détermine si un nouvel item textuel devrait commencer un nouveau bloc
 * @param {Object} currentBlock - Bloc courant
 * @param {Object} itemPosition - Position du nouvel item
 * @param {number} lineHeight - Hauteur de ligne estimée
 * @returns {boolean} Vrai si un nouveau bloc doit être créé
 */
function isNewBlock(currentBlock, itemPosition, lineHeight) {
  const lastChar = currentBlock.chars[currentBlock.chars.length - 1];
  const lastCharRight = lastChar.bbox.x + lastChar.bbox.width;
  
  // Nouvelle ligne?
  const isNewLine = Math.abs(itemPosition.y - lastChar.bbox.y) > lineHeight * 0.5;
  
  // Espace horizontal important?
  const horizontalGap = isNewLine ? 0 : itemPosition.x - lastCharRight;
  const isLargeGap = horizontalGap > lineHeight;
  
  // Nouvelle page?
  const isNewPage = currentBlock.pageNumber !== itemPosition.pageNumber;
  
  return isNewLine || isLargeGap || isNewPage;
}

/**
 * Estime la hauteur de ligne moyenne à partir des items textuels
 * @param {Array} items - Items textuels de PDF.js
 * @returns {number} Hauteur de ligne estimée
 */
function estimateLineHeight(items) {
  if (items.length < 2) return 12; // Valeur par défaut
  
  // Collecter les différences de positions y entre items consécutifs
  const yDiffs = [];
  let prevY = null;
  
  for (const item of items) {
    const y = item.transform[5];
    if (prevY !== null) {
      const diff = Math.abs(y - prevY);
      if (diff > 0 && diff < 50) { // Filtrer les valeurs aberrantes
        yDiffs.push(diff);
      }
    }
    prevY = y;
  }
  
  if (yDiffs.length === 0) return 12;
  
  // Trouver la valeur la plus fréquente (mode)
  const counts = {};
  yDiffs.forEach(diff => {
    const rounded = Math.round(diff);
    counts[rounded] = (counts[rounded] || 0) + 1;
  });
  
  let mode = 12;
  let maxCount = 0;
  
  for (const [diff, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mode = parseInt(diff);
    }
  }
  
  return mode;
}

/**
 * Calcule la boîte englobante d'un item textuel
 * @param {Object} item - Item textuel de PDF.js
 * @param {Object} viewport - Viewport de la page
 * @returns {Array} [x, y, width, height]
 */
function calculateItemBBox(item, viewport) {
  // Extraire la transformation de PDF.js
  const [scaleX, , , scaleY, x, y] = item.transform;
  
  // Dimensions approximatives basées sur la fonte
  const width = item.str.length * scaleX * 0.65;
  const height = scaleY;
  
  // Convertir en coordonnées viewport
  return [x, viewport.height - y, width, height];
}

/**
 * Extrait la couleur du texte (si disponible)
 * @param {Object} item - Item textuel de PDF.js
 * @returns {string} Couleur CSS
 */
function extractTextColor(item) {
  // PDF.js ne fournit pas directement la couleur, utilisation d'une heuristique
  // En production, il faudrait analyser le contenu du PDF plus profondément
  return '#000000'; // Noir par défaut
}

/**
 * Classifie les blocs de texte selon leur fonction
 * @param {Array} blocks - Blocs de texte bruts
 * @returns {Array} Blocs classifiés
 */
function classifyTextBlocks(blocks) {
  // Détection des titres
  const titleBlocks = blocks.filter(block => 
    block.isBold && 
    block.style.fontSize > 14 && 
    block.text.length < 100
  );
  
  // Heuristique: tri des blocs par position y pour détecter les hiérarchies
  blocks.sort((a, b) => {
    if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
    return a.bbox.y - b.bbox.y;
  });
  
  // Identification des sections (via proximité avec titres)
  let currentSection = null;
  
  for (const block of blocks) {
    if (block.isTitle) {
      // Nouveau titre = nouvelle section
      currentSection = block.text.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      block.isSection = true;
      block.section = currentSection;
      block.editable = false; // Les titres de section ne sont pas modifiables
    } else if (currentSection) {
      block.section = currentSection;
    }
    
    // Détection d'autres types de blocs
    if (block.text.match(/^\s*[-•*]\s/)) {
      block.type = 'list-item';
    } else if (block.text.match(/^\s*\d+\.\s/)) {
      block.type = 'numbered-list-item';
    }
  }
  
  return blocks;
}

/**
 * Extrait les caractéristiques visuelles d'un rendu de page
 * @param {string} pageRendering - Rendu base64 de la page
 * @param {number} pageNumber - Numéro de page
 * @returns {Promise<Array>} Caractéristiques visuelles
 */
async function extractVisualFeatures(pageRendering, pageNumber) {
  // Dans une implémentation réelle, nous analyserions ici l'image
  // pour extraire des informations sur les couleurs, les zones, etc.
  
  // Structure simplifiée pour l'exemple
  return [{
    pageNumber,
    type: 'visual_feature',
    visualType: 'page_background',
    dominant_colors: ['#FFFFFF']
  }];
}

/**
 * Extrait le texte avec Tesseract OCR (fallback)
 * @param {Array} pageRenderings - Rendus base64 des pages
 * @returns {Promise<Array>} Blocs de texte
 */
async function extractTextWithTesseract(pageRenderings) {
  const textBlocks = [];
  const worker = await Tesseract.createWorker('fra+eng');
  
  for (let i = 0; i < pageRenderings.length; i++) {
    const result = await worker.recognize(pageRenderings[i]);
    
    // Conversion des résultats Tesseract en format de blocs
    for (const paragraph of result.data.paragraphs) {
      textBlocks.push({
        id: `ocr-${i+1}-${textBlocks.length}`,
        type: 'text',
        pageNumber: i + 1,
        text: paragraph.text,
        bbox: {
          x: paragraph.bbox.x0,
          y: paragraph.bbox.y0,
          width: paragraph.bbox.x1 - paragraph.bbox.x0,
          height: paragraph.bbox.y1 - paragraph.bbox.y0
        },
        editable: true,
        source: 'ocr',
        confidence: paragraph.confidence
      });
    }
  }
  
  await worker.terminate();
  return textBlocks;
}