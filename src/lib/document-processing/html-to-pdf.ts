// src/lib/document-processing/html-to-pdf.ts
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportOptions {
  filename?: string;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  pageSize?: {
    width: number;
    height: number;
  };
}

/**
 * Service pour exporter du HTML vers PDF
 */
export class HTMLtoPDFExporter {
  /**
   * Exporte un document HTML vers PDF
   * @param html Code HTML à exporter
   * @param options Options d'export
   * @returns Blob du PDF généré
   */
  static async exportHTML(html: string, options: ExportOptions = {}): Promise<Blob> {
    try {
      console.log('Début de l\'export HTML vers PDF');
      
      // Créer un élément iframe temporaire pour rendre le HTML
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.width = `${options.pageSize?.width || 800}px`;
      iframe.style.height = `${options.pageSize?.height || 1100}px`;
      document.body.appendChild(iframe);
      
      // Écrire le HTML dans l'iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Impossible de créer le document iframe');
      
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
      
      // Attendre que tout le contenu soit chargé
      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        setTimeout(resolve, 1000); // Fallback si onload ne se déclenche pas
      });
      
      // Créer un nouveau document PDF
      const orientation = (options.pageSize?.width || 800) > (options.pageSize?.height || 1100) ? 'landscape' : 'portrait';
      const pdf = new jsPDF({
        orientation,
        unit: 'px',
        format: [options.pageSize?.width || 800, options.pageSize?.height || 1100]
      });
      
      // Obtenir les éléments de page dans l'iframe
      const pageElements = iframeDoc.querySelectorAll('.pdf-page');
      
      // Si aucun élément de page n'est trouvé, utiliser le document entier
      const elements = pageElements.length > 0 ? Array.from(pageElements) : [iframeDoc.body];
      
      // Convertir chaque élément en canvas, puis l'ajouter au PDF
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        
        // Utilisez html2canvas pour rendre l'élément
        const canvas = await html2canvas(element as HTMLElement, {
          scale: 2, // Qualité plus élevée
          useCORS: true,
          logging: false,
          allowTaint: true
        });
        
        // Ajouter une nouvelle page si ce n'est pas la première
        if (i > 0) {
          pdf.addPage();
        }
        
        // Ajouter le canvas comme image
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(
          imgData, 
          'PNG', 
          options.margin?.left || 0, 
          options.margin?.top || 0, 
          canvas.width / 2, 
          canvas.height / 2
        );
      }
      
      // Supprimer l'iframe temporaire
      document.body.removeChild(iframe);
      
      // Générer le PDF
      const blob = pdf.output('blob');
      console.log('Export HTML vers PDF terminé');
      
      return blob;
    } catch (error) {
      console.error('Erreur lors de l\'export HTML vers PDF:', error);
      throw new Error(`Erreur lors de l'export HTML vers PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
  
  /**
   * Méthode alternative utilisant l'API d'impression du navigateur
   * @param html Code HTML à imprimer
   * @returns Promise qui se résout lorsque l'impression est terminée
   */
  static printHTML(html: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Créer un iframe pour l'impression
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.top = '-9999px';
        document.body.appendChild(iframe);
        
        // Écrire le HTML dans l'iframe
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) throw new Error('Impossible de créer le document iframe');
        
        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>CV Optimisé</title>
            <style>
              @media print {
                body { margin: 0; }
                .pdf-page { page-break-after: always; }
              }
            </style>
          </head>
          <body>${html}</body>
          </html>
        `);
        iframeDoc.close();
        
        // Attendre que tout le contenu soit chargé
        iframe.onload = () => {
          // Imprimer
          if (iframe.contentWindow) {
            iframe.contentWindow.print();
            
            // Nettoyer l'iframe après l'impression
            setTimeout(() => {
              document.body.removeChild(iframe);
              resolve();
            }, 1000);
          } else {
            reject(new Error('Impossible d\'accéder à la fenêtre iframe'));
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }
}