// src/lib/init.js
// Fichier d'initialisation globale pour l'application
// À inclure dans l'index principal

// Configurer le worker PDF.js globalement
export const configurePDFJSWorker = () => {
    try {
      if (typeof window !== 'undefined') {
        // Créer un élément script pour charger le worker PDF.js
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        script.async = true;
        script.defer = true;
        script.id = 'pdfjs-worker-script';
        document.head.appendChild(script);
        
        // Configurer l'attribut 'as' de preload si ce n'est pas déjà fait
        const preloadLinks = document.querySelectorAll('link[rel="preload"]');
        let hasPreload = false;
        
        for (let i = 0; i < preloadLinks.length; i++) {
          const link = preloadLinks[i];
          if (link.href.includes('pdf.worker.min.js')) {
            hasPreload = true;
            if (!link.getAttribute('as')) {
              link.setAttribute('as', 'script');
            }
          }
        }
        
        // Ajouter un lien preload si nécessaire
        if (!hasPreload) {
          const preloadLink = document.createElement('link');
          preloadLink.rel = 'preload';
          preloadLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          preloadLink.as = 'script';
          preloadLink.crossOrigin = 'anonymous';
          document.head.appendChild(preloadLink);
        }
        
        // Tenter de configurer le worker global si la bibliothèque est déjà chargée
        try {
          import('pdfjs-dist').then(pdfjs => {
            if (!pdfjs.GlobalWorkerOptions.workerSrc) {
              pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
              console.log('PDF.js worker configuré via init.js');
            }
          });
        } catch (err) {
          console.log('PDF.js pas encore disponible, le worker sera configuré plus tard');
        }
        
        console.log('Configuration PDF.js initialisée');
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de PDF.js:', error);
    }
  };
  
  // Empêcher l'erreur "sandbox" d'iframes en configurant la CSP
  export const setupContentSecurityPolicy = () => {
    try {
      if (typeof window !== 'undefined') {
        // Créer un meta tag pour la Content Security Policy
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:;";
        document.head.appendChild(meta);
        
        console.log('CSP configurée');
      }
    } catch (error) {
      console.error('Erreur lors de la configuration de la CSP:', error);
    }
  };
  
  // Initialiser l'application
  export const initApp = () => {
    configurePDFJSWorker();
    setupContentSecurityPolicy();
    
    console.log('Application initialisée avec succès');
  };
  
  // Exécuter automatiquement l'initialisation
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', initApp);
  }