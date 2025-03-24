// src/lib/performance/resource-loader.ts

/**
 * Chargeur de ressources optimisé pour l'application
 * Permet le préchargement et la gestion efficace des ressources externes
 */
export class ResourceLoader {
    private static loadedResources: Set<string> = new Set();
    private static loadPromises: Map<string, Promise<any>> = new Map();
  
    /**
     * Précharge un script externe
     * @param src URL du script à charger
     * @param id Identifiant optionnel pour le script
     * @returns Promise qui se résout lorsque le script est chargé
     */
    public static loadScript(src: string, id?: string): Promise<HTMLScriptElement> {
      // Vérifier si le script est déjà chargé
      if (this.loadedResources.has(src)) {
        return Promise.resolve(document.querySelector(`script[src="${src}"]`) as HTMLScriptElement);
      }
  
      // Vérifier si le script est déjà en cours de chargement
      if (this.loadPromises.has(src)) {
        return this.loadPromises.get(src) as Promise<HTMLScriptElement>;
      }
  
      // Créer une promesse pour le chargement du script
      const promise = new Promise<HTMLScriptElement>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
  
        if (id) {
          script.id = id;
        }
  
        script.onload = () => {
          this.loadedResources.add(src);
          resolve(script);
        };
  
        script.onerror = () => {
          this.loadPromises.delete(src);
          reject(new Error(`Échec du chargement du script: ${src}`));
        };
  
        document.head.appendChild(script);
      });
  
      // Stocker la promesse
      this.loadPromises.set(src, promise);
      return promise;
    }
  
    /**
     * Précharge une feuille de style externe
     * @param href URL de la feuille de style à charger
     * @param id Identifiant optionnel pour la feuille de style
     * @returns Promise qui se résout lorsque la feuille de style est chargée
     */
    public static loadStylesheet(href: string, id?: string): Promise<HTMLLinkElement> {
      // Vérifier si la feuille de style est déjà chargée
      if (this.loadedResources.has(href)) {
        return Promise.resolve(document.querySelector(`link[href="${href}"]`) as HTMLLinkElement);
      }
  
      // Vérifier si la feuille de style est déjà en cours de chargement
      if (this.loadPromises.has(href)) {
        return this.loadPromises.get(href) as Promise<HTMLLinkElement>;
      }
  
      // Créer une promesse pour le chargement de la feuille de style
      const promise = new Promise<HTMLLinkElement>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
  
        if (id) {
          link.id = id;
        }
  
        link.onload = () => {
          this.loadedResources.add(href);
          resolve(link);
        };
  
        link.onerror = () => {
          this.loadPromises.delete(href);
          reject(new Error(`Échec du chargement de la feuille de style: ${href}`));
        };
  
        document.head.appendChild(link);
      });
  
      // Stocker la promesse
      this.loadPromises.set(href, promise);
      return promise;
    }
  
    /**
     * Précharge une police Google Fonts
     * @param fontFamily Nom de la famille de police (ex: 'Roboto')
     * @param weights Array des graisses à charger (ex: [400, 700])
     * @returns Promise qui se résout lorsque la police est chargée
     */
    public static loadGoogleFont(fontFamily: string, weights: number[] = [400]): Promise<HTMLLinkElement> {
      const weightsStr = weights.join(',');
      const href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@${weightsStr}&display=swap`;
      
      return this.loadStylesheet(href, `google-font-${fontFamily.toLowerCase()}`);
    }
  
    /**
     * Précharge le worker PDF.js
     * @returns Promise qui se résout lorsque le worker est chargé
     */
    public static loadPdfWorker(version: string): Promise<HTMLScriptElement> {
      const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.js`;
      return this.loadScript(workerSrc, 'pdf-worker');
    }
  
    /**
     * Précharge plusieurs ressources en parallèle
     * @param resources Liste des ressources à charger
     * @returns Promise qui se résout lorsque toutes les ressources sont chargées
     */
    public static loadMultiple(resources: { type: 'script' | 'stylesheet' | 'googleFont', src: string, id?: string, fontWeights?: number[] }[]): Promise<any[]> {
      const promises = resources.map(resource => {
        switch (resource.type) {
          case 'script':
            return this.loadScript(resource.src, resource.id);
          case 'stylesheet':
            return this.loadStylesheet(resource.src, resource.id);
          case 'googleFont':
            return this.loadGoogleFont(resource.src, resource.fontWeights);
          default:
            return Promise.reject(new Error(`Type de ressource non pris en charge: ${(resource as any).type}`));
        }
      });
  
      return Promise.all(promises);
    }
  }