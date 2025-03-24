// lib/export/pdf-generator.js
import { PDFDocument, rgb } from 'pdf-lib';
import { renderDocumentToHTML } from '@/lib/document/reconstruction';
import html2canvas from 'html2canvas';

/**
 * Génère un fichier PDF à partir de la structure du document
 * @param {Object} documentStructure - Structure du document
 * @returns {Promise<Buffer>} PDF généré
 */
export async function renderDocumentToPDF(documentStructure) {
  try {
    // Créer un conteneur temporaire pour le rendu HTML
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = `${documentStructure.metadata.dimensions.width}px`;
    document.body.appendChild(tempContainer);
    
    try {
      // Rendu HTML du document
      const htmlElement = await renderDocumentToHTML(documentStructure, { forPrinting: true });
      tempContainer.appendChild(htmlElement);
      
      // Créer un document PDF
      const pdfDoc = await PDFDocument.create();
      const { pageCount, dimensions } = documentStructure.metadata;
      
      // Regrouper les blocs par page
      const blocksByPage = {};
      documentStructure.blocks.forEach(block => {
        const pageNumber = block.pageNumber || 1;
        if (!blocksByPage[pageNumber]) {
          blocksByPage[pageNumber] = [];
        }
        blocksByPage[pageNumber].push(block);
      });
      
      // Pour chaque page du document
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
        // Créer une nouvelle page dans le PDF
        const page = pdfDoc.addPage([dimensions.width, dimensions.height]);
        
        // Sélectionner l'élément de page correspondant
        const pageElement = tempContainer.querySelector(`.page-${pageNumber}`);
        
        if (!pageElement) continue;
        
        // Générer un canvas à partir de l'élément HTML
        const canvas = await html2canvas(pageElement, {
          scale: 2, // Double résolution pour meilleure qualité
          useCORS: true,
          logging: false,
          backgroundColor: 'white',
          width: dimensions.width,
          height: dimensions.height
        });
        
        // Convertir le canvas en PNG
        const pngDataUrl = canvas.toDataURL('image/png');
        const pngData = pngDataUrl.split(',')[1];
        
        // Intégrer l'image dans le PDF
        const pngImage = await pdfDoc.embedPng(Buffer.from(pngData, 'base64'));
        
        // Dessiner l'image sur la page
        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: dimensions.width,
          height: dimensions.height
        });
        
        // Ajouter des métadonnées (texte invisible pour la recherche)
        if (blocksByPage[pageNumber]) {
          addSearchableText(page, blocksByPage[pageNumber]);
        }
      }
      
      // Ajouter des métadonnées au PDF
      pdfDoc.setTitle('CV Optimisé avec Vocatio 2.0');
      pdfDoc.setAuthor('Vocatio 2.0');
      pdfDoc.setCreator('Vocatio 2.0');
      pdfDoc.setSubject('CV Optimisé');
      pdfDoc.setKeywords(['CV', 'curriculum vitae', 'optimisé', 'Vocatio']);
      
      // Sérialiser le PDF en ArrayBuffer
      const pdfBytes = await pdfDoc.save();
      
      // Convertir l'ArrayBuffer en Buffer
      return Buffer.from(pdfBytes);
    } finally {
      // Nettoyer le DOM
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw error;
  }
}

/**
 * Ajoute du texte invisible pour la recherche dans le PDF
 * @param {Object} page - Page PDF
 * @param {Array} blocks - Blocs de texte
 */
function addSearchableText(page, blocks) {
  const textBlocks = blocks.filter(block => block.type === 'text' && block.text);
  
  if (textBlocks.length === 0) return;
  
  const { width, height } = page.getSize();
  const fontSize = 0.1; // Taille minuscule pour que ce soit invisible
  
  // Créer une couche de texte invisible pour la recherche
  textBlocks.forEach(block => {
    try {
      const { x, y } = block.bbox;
      
      // Position en coordonnées PDF (origine en bas à gauche)
      const pdfX = x;
      const pdfY = height - y - block.bbox.height;
      
      // Dessiner le texte (invisible)
      page.drawText(block.text, {
        x: pdfX,
        y: pdfY,
        size: fontSize,
        color: rgb(1, 1, 1), // Blanc sur blanc = invisible
        opacity: 0.01 // Presque invisible
      });
    } catch (e) {
      // Ignorer les erreurs pour les blocs individuels
      console.warn('Erreur lors de l\'ajout de texte recherchable:', e);
    }
  });
}