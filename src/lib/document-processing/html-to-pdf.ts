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
  quality?: number;
}

/**
 * Service amélioré pour exporter du HTML vers PDF avec une fidélité visuelle maximale
 */
export class HTMLtoPDFExporter {
  /**
   * Exporte un document HTML vers PDF avec une haute fidélité
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
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
      
      // Écrire le HTML dans l'iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Impossible de créer le document iframe');
      
      // Injecter le HTML et attendre son chargement complet
      return new Promise<Blob>(async (resolve, reject) => {
        try {
          // Injecter le HTML
          iframeDoc.open();
          iframeDoc.write(html);
          iframeDoc.close();
          
          // Attendre que les polices et les images soient chargées
          await new Promise<void>((loadResolve) => {
            // Vérifier si les polices sont chargées
            if (document.fonts && document.fonts.ready) {
              document.fonts.ready.then(() => {
                console.log('Polices chargées');
                // Attendre encore un peu pour s'assurer que tout est rendu
                setTimeout(loadResolve, 500);
              });
            } else {
              // Fallback si l'API document.fonts n'est pas disponible
              setTimeout(loadResolve, 1000);
            }
          });
          
          // Obtenir les éléments de page dans l'iframe
          const pageElements = iframeDoc.querySelectorAll('.pdf-page');
          
          // Si aucun élément de page n'est trouvé, utiliser le document entier
          const elements = pageElements.length > 0 ? Array.from(pageElements) : [iframeDoc.body];
          
          console.log(`Nombre d'éléments à convertir: ${elements.length}`);
          
          // Créer un nouveau document PDF
          const orientation = (options.pageSize?.width || 800) > (options.pageSize?.height || 1100) ? 'landscape' : 'portrait';
          const pdf = new jsPDF({
            orientation,
            unit: 'px',
            format: [options.pageSize?.width || 800, options.pageSize?.height || 1100],
            compress: true
          });
          
          // Options améliorées pour html2canvas
          const canvasOptions = {
            scale: options.quality || 2, // Qualité plus élevée
            useCORS: true, // Permettre les images cross-origin
            allowTaint: true, // Permettre les éléments qui pourraient "tainted" le canvas
            logging: false, // Désactiver les logs pour la production
            letterRendering: true, // Améliorer le rendu du texte
            scrollX: 0,
            scrollY: 0,
            windowWidth: options.pageSize?.width || 800,
            windowHeight: options.pageSize?.height || 1100
          };
          
          // Convertir chaque élément en canvas, puis l'ajouter au PDF
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            
            console.log(`Traitement de la page ${i + 1}/${elements.length}`);
            
            try {
              // Capture de la page en canvas
              const canvas = await html2canvas(element as HTMLElement, canvasOptions);
              
              // Ajouter une nouvelle page si ce n'est pas la première
              if (i > 0) {
                pdf.addPage();
              }
              
              // Calculer les dimensions pour s'adapter à la page
              const imgWidth = pdf.internal.pageSize.getWidth() - (options.margin?.left || 0) - (options.margin?.right || 0);
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              
              // Ajouter le canvas comme image
              const imgData = canvas.toDataURL('image/png');
              pdf.addImage(
                imgData, 
                'PNG', 
                options.margin?.left || 0, 
                options.margin?.top || 0, 
                imgWidth, 
                imgHeight
              );
              
              console.log(`Page ${i + 1} ajoutée au PDF`);
            } catch (err) {
              console.error(`Erreur lors du traitement de la page ${i + 1}:`, err);
              // Continuer avec les autres pages malgré l'erreur
            }
          }
          
          // Optimisations pour la qualité du PDF
          pdf.setProperties({
            title: options.filename || 'CV Optimisé',
            subject: 'Document généré par Vocatio',
            creator: 'Vocatio',
            author: 'Vocatio'
          });
          
          // Générer le PDF
          const blob = pdf.output('blob');
          console.log('Export HTML vers PDF terminé');
          
          // Nettoyer l'iframe
          document.body.removeChild(iframe);
          
          resolve(blob);
        } catch (error) {
          // Nettoyer l'iframe en cas d'erreur
          document.body.removeChild(iframe);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'export HTML vers PDF:', error);
      throw new Error(`Erreur lors de l'export HTML vers PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
  
  /**
   * Méthode améliorée pour l'impression directe de documents HTML
   * Utilise l'API d'impression du navigateur pour une meilleure fidélité
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
        iframe.style.border = 'none';
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
                @page { margin: 0; }
                body { margin: 0; }
                .pdf-page { page-break-after: always; }
                .pdf-page:last-child { page-break-after: avoid; }
              }
            </style>
          </head>
          <body>${html}</body>
          </html>
        `);
        iframeDoc.close();
        
        // Attendre que tout le contenu soit chargé
        iframe.onload = () => {
          // Attendre que les polices soient chargées
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
              setTimeout(() => {
                try {
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
                } catch (printError) {
                  reject(printError);
                }
              }, 500);
            });
          } else {
            // Fallback si l'API document.fonts n'est pas disponible
            setTimeout(() => {
              try {
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
              } catch (printError) {
                reject(printError);
              }
            }, 1000);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Exporte un document HTML vers un fichier PDF
   * Combine exportHTML et téléchargement
   * @param html Code HTML à exporter
   * @param filename Nom du fichier PDF à télécharger
   * @param options Options d'export
   */
  static async exportAndDownload(html: string, filename: string, options: ExportOptions = {}): Promise<void> {
    try {
      const blob = await this.exportHTML(html, { ...options, filename });
      
      // Télécharger le PDF
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export et téléchargement du PDF:', error);
      throw error;
    }
  }
}