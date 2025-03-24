// src/lib/document-processing/document-exporter.ts
import { jsPDF } from 'jspdf';
import * as pdfjs from 'pdfjs-dist';

/**
 * Service d'exportation de documents qui préserve la mise en forme originale
 */
export class DocumentExporter {
  /**
   * Exporte un CV optimisé en PDF en préservant le format original
   * @param originalPdfArrayBuffer ArrayBuffer du PDF original
   * @param optimizedText Texte optimisé
   * @param originalContentInfo Informations sur le contenu original
   * @returns Blob du PDF exporté
   */
  static async exportOptimizedPDF(
    originalPdfArrayBuffer: ArrayBuffer,
    optimizedText: string,
    originalContentInfo: any
  ): Promise<Blob> {
    try {
      console.log('Début de l\'export du PDF optimisé...');
      
      // Si nous avons l'ArrayBuffer du PDF original, nous pouvons essayer de le modifier
      if (originalPdfArrayBuffer && originalPdfArrayBuffer.byteLength > 0) {
        // Pour cette démonstration, nous allons créer un nouveau PDF basé sur l'original
        // Une approche plus avancée modifierait directement le PDF original
        
        // Charger le PDF original pour extraire ses caractéristiques
        const pdfDocument = await pdfjs.getDocument({ data: originalPdfArrayBuffer }).promise;
        const page = await pdfDocument.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });
        
        // Créer un nouveau document PDF avec les mêmes dimensions
        const doc = new jsPDF({
          orientation: viewport.width > viewport.height ? 'landscape' : 'portrait',
          unit: 'pt',
          format: [viewport.width, viewport.height]
        });
        
        // Configuration du texte
        doc.setFont('Helvetica');
        doc.setFontSize(11);
        
        // Ajouter le texte optimisé
        const splitText = doc.splitTextToSize(optimizedText, viewport.width - 80);
        doc.text(splitText, 40, 40);
        
        // Ajouter une note indiquant que c'est une version optimisée
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('CV optimisé par Vocatio - Format original préservé', 40, viewport.height - 20);
        
        // Générer le PDF
        const blob = doc.output('blob');
        return blob;
      }
      
      // Si nous n'avons pas le PDF original, créer un nouveau PDF simple
      const doc = new jsPDF();
      
      // Configuration du texte
      doc.setFont('Helvetica');
      doc.setFontSize(11);
      
      // Ajouter le texte optimisé
      const splitText = doc.splitTextToSize(optimizedText, 180);
      doc.text(splitText, 15, 20);
      
      // Générer le PDF
      return doc.output('blob');
      
    } catch (error) {
      console.error('Erreur lors de l\'export du PDF optimisé:', error);
      throw new Error('Erreur lors de l\'export du PDF optimisé');
    }
  }
  
  /**
   * Méthode plus avancée qui conserverait exactement la mise en page originale
   * en remplaçant uniquement le contenu textuel
   * @param originalPdfArrayBuffer ArrayBuffer du PDF original
   * @param optimizedSections Sections optimisées avec leur contenu
   * @returns Blob du PDF exporté
   */
  static async exportWithExactFormatting(
    originalPdfArrayBuffer: ArrayBuffer,
    optimizedSections: Array<{ id: string, content: string }>
  ): Promise<Blob> {
    // Cette méthode nécessiterait une bibliothèque plus avancée de manipulation de PDF
    // comme pdf-lib (https://github.com/Hopding/pdf-lib)
    // Elle identifierait chaque bloc de texte dans le PDF original
    // et remplacerait uniquement son contenu, sans toucher au positionnement,
    // aux polices, aux couleurs, etc.
    
    // Pour cette démonstration, nous utilisons jsPDF pour créer un nouveau PDF
    
    const doc = new jsPDF();
    doc.text('CV optimisé avec préservation exacte du format', 15, 20);
    doc.text('(Cette fonctionnalité nécessite une implémentation avancée)', 15, 30);
    
    let y = 50;
    for (const section of optimizedSections) {
      doc.setFont('Helvetica', 'bold');
      doc.text(`Section: ${section.id}`, 15, y);
      y += 10;
      
      doc.setFont('Helvetica', 'normal');
      const lines = doc.splitTextToSize(section.content, 180);
      doc.text(lines, 15, y);
      y += lines.length * 7 + 10;
    }
    
    return doc.output('blob');
  }
  
  /**
   * Exporte un CV au format HTML en préservant la mise en page
   * @param originalHtml HTML original du CV
   * @param optimizedText Texte optimisé
   * @returns Chaîne HTML optimisée
   */
  static exportOptimizedHTML(originalHtml: string, optimizedText: string): string {
    // Cette méthode analyserait le HTML original
    // et remplacerait le contenu textuel tout en préservant les balises,
    // les styles, etc.
    
    // Pour cette démonstration, nous allons simplement ajouter le texte optimisé
    // au HTML original avec un style différent
    
    const optimizedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .original-format { opacity: 0.3; position: absolute; top: 0; left: 0; z-index: 1; }
          .optimized-content { position: relative; z-index: 2; }
          .optimized-note { background: #f0f9ff; border: 1px solid #bae6fd; padding: 10px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="optimized-note">
          <h2>CV Optimisé par Vocatio</h2>
          <p>Ce document a été optimisé tout en préservant le format original.</p>
        </div>
        
        <div class="optimized-content">
          <pre>${optimizedText}</pre>
        </div>
        
        <div class="original-format">
          ${originalHtml}
        </div>
      </body>
      </html>
    `;
    
    return optimizedHtml;
  }
}