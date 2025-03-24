// src/lib/security/pdf-sanitizer.ts
  
  /**
   * Fournit des fonctions pour analyser et sanitiser les fichiers PDF
   * avant leur traitement par l'application
   */
  export class PDFSanitizer {
    /**
     * Vérifie si un fichier PDF est potentiellement malveillant
     * @param file Fichier PDF à analyser
     * @returns Un objet indiquant si le fichier est sûr et les raisons sinon
     */
    static async analyzePDF(file: File): Promise<{ safe: boolean; issues?: string[] }> {
      const issues: string[] = [];
      
      // Vérifier la taille du fichier
      if (file.size > 15 * 1024 * 1024) { // 15 MB
        issues.push('Le fichier est trop volumineux (limite: 15 Mo)');
      }
      
      // Vérifier le type MIME
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        issues.push('Le format de fichier n\'est pas un PDF valide');
      }
      
      try {
        // Vérifier le contenu du PDF (magicBytes)
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer.slice(0, 5));
        
        // Vérifier la signature de fichier PDF (%PDF-)
        if (!(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2D)) {
          issues.push('La signature du fichier PDF est invalide');
        }
        
        // Vérifier la présence de JavaScript (analyse simple)
        const content = await this.extractTextContent(buffer);
        
        // Recherche de mots-clés suspects dans le contenu
        const suspiciousPatterns = [
          /JavaScript/i,
          /OpenAction/i,
          /AA /i,  // Additional Actions
          /Launch/i,
          /URL /i,
          /SubmitForm/i,
          /JBIG2Decode/i,  // Vulnérabilité potentielle
        ];
        
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(content)) {
            issues.push(`Le PDF contient potentiellement du code exécutable (${pattern.source})`);
            break;  // Une seule alerte suffit
          }
        }
      } catch (error) {
        issues.push('Erreur lors de l\'analyse du PDF');
      }
      
      return {
        safe: issues.length === 0,
        issues: issues.length > 0 ? issues : undefined
      };
    }
    
    /**
     * Extrait le contenu textuel d'un PDF pour analyse de sécurité
     * @param buffer Buffer du PDF
     * @returns Contenu textuel du PDF
     */
    private static async extractTextContent(buffer: ArrayBuffer): Promise<string> {
      try {
        // Importation dynamique de pdfjs pour l'extraction de texte
        const pdfjs = await import('pdfjs-dist');
        
        // Configurer le worker si nécessaire
        if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
        }
        
        // Charger le document PDF
        const loadingTask = pdfjs.getDocument({ data: buffer });
        const pdf = await loadingTask.promise;
        
        // Extraire le texte de toutes les pages
        let textContent = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {  // Limiter à 10 pages pour l'analyse
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          
          // Concaténer le texte de chaque élément
          content.items.forEach((item: any) => {
            if (item.str) {
              textContent += item.str + ' ';
            }
          });
        }
        
        return textContent;
      } catch (error) {
        console.error('Erreur lors de l\'extraction du texte:', error);
        return '';
      }
    }
    
    /**
     * Vérifie si un fichier DOCX est potentiellement malveillant
     * @param file Fichier DOCX à analyser
     * @returns Un objet indiquant si le fichier est sûr et les raisons sinon
     */
    static async analyzeDOCX(file: File): Promise<{ safe: boolean; issues?: string[] }> {
      const issues: string[] = [];
      
      // Vérifier la taille du fichier
      if (file.size > 10 * 1024 * 1024) { // 10 MB
        issues.push('Le fichier est trop volumineux (limite: 10 Mo)');
      }
      
      // Vérifier le type MIME
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-word.document.macroEnabled.12'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.docx')) {
        issues.push('Le format de fichier n\'est pas un DOCX valide');
      }
      
      // Vérifier si le fichier contient des macros (nom se terminant par .docm)
      if (file.name.toLowerCase().endsWith('.docm')) {
        issues.push('Les fichiers Word avec macros (.docm) ne sont pas pris en charge pour des raisons de sécurité');
      }
      
      return {
        safe: issues.length === 0,
        issues: issues.length > 0 ? issues : undefined
      };
    }
  }