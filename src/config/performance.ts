// src/config/performance.ts
  
  /**
   * Configuration pour les optimisations de performance
   */
  export const performanceConfig = {
    // Taille maximale du cache document
    documentCacheSize: 10,
    
    // Ressources à précharger au démarrage de l'application
    preloadResources: [
      // PDF.js Worker
      { type: 'script' as const, src: `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`, id: 'pdf-worker' },
      
      // Polices pour l'interface
      { type: 'googleFont' as const, src: 'Inter', fontWeights: [400, 500, 600, 700] },
      
      // Librairies JavaScript couramment utilisées
      { type: 'script' as const, src: 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js', id: 'html2canvas' },
    ],
    
    // Configuration de la mise en mémoire cache
    caching: {
      // Durée de validité des fichiers PDF en mémoire (en ms)
      pdfTTL: 30 * 60 * 1000, // 30 minutes
      
      // Durée de validité des données d'analyse en mémoire (en ms)
      analysisTTL: 15 * 60 * 1000, // 15 minutes
    },
    
    // Configuration pour le lazy loading des images
    lazyLoading: {
      rootMargin: '200px 0px',
      placeholderColor: '#f3f4f6',
    }
  };