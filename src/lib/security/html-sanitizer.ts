// src/lib/security/html-sanitizer.ts
  
  /**
   * Utilitaire pour sanitiser le HTML généré avant de l'afficher
   */
  export class HTMLSanitizer {
    /**
     * Liste des balises HTML autorisées
     */
    private static allowedTags = [
      'a', 'b', 'br', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'hr', 'i', 'li', 'ol', 'p', 'span', 'strong', 'table', 'tbody',
      'td', 'th', 'thead', 'tr', 'u', 'ul'
    ];
  
    /**
     * Liste des attributs autorisés par balise
     */
    private static allowedAttributes: Record<string, string[]> = {
      'a': ['href', 'title', 'target', 'rel'],
      'div': ['class', 'style'],
      'span': ['class', 'style'],
      'table': ['class', 'style', 'border'],
      'td': ['class', 'style', 'colspan', 'rowspan'],
      'th': ['class', 'style', 'colspan', 'rowspan'],
      '*': ['class'] // Attributs autorisés pour toutes les balises
    };
  
    /**
     * Sanitise un contenu HTML pour éliminer les balises et attributs dangereux
     * @param html HTML à sanitiser
     * @returns HTML sanitisé
     */
    static sanitize(html: string): string {
      // Créer un DOM temporaire
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Sanitiser le document
      this.sanitizeNode(doc.body);
      
      // Retourner le HTML sanitisé
      return doc.body.innerHTML;
    }
  
    /**
     * Sanitise un nœud DOM de manière récursive
     * @param node Nœud à sanitiser
     */
    private static sanitizeNode(node: Element): void {
      // Parcourir tous les enfants
      const childNodes = Array.from(node.children);
      for (const child of childNodes) {
        // Vérifier si la balise est autorisée
        if (!this.allowedTags.includes(child.tagName.toLowerCase())) {
          // Remplacer par le contenu texte de l'élément
          node.replaceChild(document.createTextNode(child.textContent || ''), child);
          continue;
        }
        
        // Sanitiser les attributs
        this.sanitizeAttributes(child);
        
        // Sanitiser récursivement les enfants
        this.sanitizeNode(child);
      }
    }
  
    /**
     * Sanitise les attributs d'un élément
     * @param element Élément dont les attributs doivent être sanitisés
     */
    private static sanitizeAttributes(element: Element): void {
      const tagName = element.tagName.toLowerCase();
      const allowedAttrsForTag = [
        ...(this.allowedAttributes[tagName] || []),
        ...(this.allowedAttributes['*'] || [])
      ];
      
      // Parcourir tous les attributs
      const attributes = Array.from(element.attributes);
      for (const attr of attributes) {
        const attrName = attr.name.toLowerCase();
        
        // Supprimer les attributs non autorisés
        if (!allowedAttrsForTag.includes(attrName)) {
          element.removeAttribute(attrName);
          continue;
        }
        
        // Sanitiser les valeurs des attributs
        if (attrName === 'href' || attrName === 'src') {
          const value = attr.value.trim().toLowerCase();
          
          // Bloquer les protocoles dangereux
          if (value.startsWith('javascript:') || value.startsWith('data:') || value.startsWith('vbscript:')) {
            element.removeAttribute(attrName);
          }
        }
        
        // Sanitiser les styles
        if (attrName === 'style') {
          this.sanitizeStyle(element);
        }
      }
      
      // Ajouter rel="noopener noreferrer" pour les liens externes
      if (tagName === 'a' && element.hasAttribute('href') && element.getAttribute('target') === '_blank') {
        element.setAttribute('rel', 'noopener noreferrer');
      }
    }
  
    /**
     * Sanitise les styles CSS d'un élément
     * @param element Élément dont le style doit être sanitisé
     */
    private static sanitizeStyle(element: Element): void {
      if (!element.hasAttribute('style')) return;
      
      const style = element.getAttribute('style') || '';
      const safeStyles: string[] = [];
      
      // Liste des propriétés CSS autorisées
      const allowedStyles = [
        'color', 'background-color', 'font-family', 'font-size', 'font-weight',
        'text-align', 'margin', 'padding', 'border', 'width', 'height',
        'display', 'visibility', 'opacity'
      ];
      
      // Analyser et filtrer les styles
      const styleRules = style.split(';');
      for (let rule of styleRules) {
        rule = rule.trim();
        if (!rule) continue;
        
        const [property, value] = rule.split(':').map(part => part.trim());
        
        // Vérifier si la propriété est autorisée
        if (allowedStyles.includes(property)) {
          // Vérifier si la valeur ne contient pas d'expressions dangereuses
          if (!value.includes('expression') && !value.includes('url(') && !value.includes('import')) {
            safeStyles.push(`${property}: ${value}`);
          }
        }
      }
      
      // Mettre à jour le style avec uniquement les règles sûres
      if (safeStyles.length > 0) {
        element.setAttribute('style', safeStyles.join('; '));
      } else {
        element.removeAttribute('style');
      }
    }
  }
  