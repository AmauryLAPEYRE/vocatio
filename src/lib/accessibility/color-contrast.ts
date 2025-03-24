// src/lib/accessibility/color-contrast.ts
  
  /**
   * Utilitaire pour vérifier et améliorer le contraste des couleurs
   * pour l'accessibilité
   */
  export class ColorContrast {
    /**
     * Calcule le rapport de contraste entre deux couleurs (WCAG)
     * @param color1 Couleur au format hexadécimal (#RRGGBB)
     * @param color2 Couleur au format hexadécimal (#RRGGBB)
     * @returns Rapport de contraste (1:1 à 21:1)
     */
    static calculateContrast(color1: string, color2: string): number {
      const luminance1 = this.calculateLuminance(color1);
      const luminance2 = this.calculateLuminance(color2);
      
      // Déterminer la couleur la plus claire et la plus sombre
      const lighter = Math.max(luminance1, luminance2);
      const darker = Math.min(luminance1, luminance2);
      
      // Calculer le rapport de contraste
      return (lighter + 0.05) / (darker + 0.05);
    }
    
    /**
     * Calcule la luminance relative d'une couleur (WCAG)
     * @param color Couleur au format hexadécimal (#RRGGBB)
     * @returns Luminance relative (0 à 1)
     */
    static calculateLuminance(color: string): number {
      // Extraire les composantes RGB
      const rgb = this.hexToRgb(color);
      if (!rgb) return 0;
      
      // Convertir les composantes en valeurs relatives
      const r = rgb.r / 255;
      const g = rgb.g / 255;
      const b = rgb.b / 255;
      
      // Appliquer la formule de luminance
      const R = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
      const G = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
      const B = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
      
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    }
    
    /**
     * Convertit une couleur hexadécimale en RGB
     * @param hex Couleur au format hexadécimal (#RRGGBB)
     * @returns Objet avec les composantes RGB ou null si format invalide
     */
    static hexToRgb(hex: string): { r: number, g: number, b: number } | null {
      // Nettoyer la couleur
      hex = hex.replace(/^#/, '');
      
      // Vérifier le format
      if (!/^[0-9A-F]{6}$/i.test(hex)) {
        return null;
      }
      
      // Extraire les composantes
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      return { r, g, b };
    }
    
    /**
     * Vérifie si le contraste est suffisant pour le niveau AA (WCAG)
     * @param color1 Couleur au format hexadécimal (#RRGGBB)
     * @param color2 Couleur au format hexadécimal (#RRGGBB)
     * @param isLargeText Si le texte est considéré comme "large" (>= 18pt ou >= 14pt bold)
     * @returns Si le contraste est suffisant pour AA
     */
    static isAACompliant(color1: string, color2: string, isLargeText: boolean = false): boolean {
      const contrast = this.calculateContrast(color1, color2);
      return isLargeText ? contrast >= 3 : contrast >= 4.5;
    }
    
    /**
     * Vérifie si le contraste est suffisant pour le niveau AAA (WCAG)
     * @param color1 Couleur au format hexadécimal (#RRGGBB)
     * @param color2 Couleur au format hexadécimal (#RRGGBB)
     * @param isLargeText Si le texte est considéré comme "large" (>= 18pt ou >= 14pt bold)
     * @returns Si le contraste est suffisant pour AAA
     */
    static isAAACompliant(color1: string, color2: string, isLargeText: boolean = false): boolean {
      const contrast = this.calculateContrast(color1, color2);
      return isLargeText ? contrast >= 4.5 : contrast >= 7;
    }
    
    /**
     * Suggère une couleur qui offre un contraste suffisant
     * @param backgroundColor Couleur de fond (#RRGGBB)
     * @param targetContrast Rapport de contraste cible
     * @param preferDarker Préférer assombrir plutôt qu'éclaircir
     * @returns Couleur suggérée au format hexadécimal
     */
    static suggestContrastColor(backgroundColor: string, targetContrast: number = 4.5, preferDarker: boolean = false): string {
      const bgLuminance = this.calculateLuminance(backgroundColor);
      
      // Déterminer si nous devrions utiliser une couleur claire ou sombre
      let useWhite = bgLuminance < 0.5;
      if (preferDarker) {
        useWhite = !useWhite;
      }
      
      // Vérifier si le blanc ou le noir offrent déjà un contraste suffisant
      const whiteContrast = this.calculateContrast(backgroundColor, '#FFFFFF');
      const blackContrast = this.calculateContrast(backgroundColor, '#000000');
      
      if (useWhite && whiteContrast >= targetContrast) {
        return '#FFFFFF';
      } else if (!useWhite && blackContrast >= targetContrast) {
        return '#000000';
      }
      
      // Sinon, ajuster la couleur pour atteindre le contraste souhaité
      const initialColor = useWhite ? '#FFFFFF' : '#000000';
      
      // Commencer par mélanger avec la couleur de fond
      const rgb = this.hexToRgb(backgroundColor);
      if (!rgb) return initialColor;
      
      // Ajuster progressivement jusqu'à atteindre le contraste cible
      const initialRgb = this.hexToRgb(initialColor);
      if (!initialRgb) return initialColor;
      
      const steps = 20; // Nombre d'étapes pour l'ajustement
      for (let i = 1; i <= steps; i++) {
        const ratio = i / steps;
        
        // Mélanger les couleurs
        const r = Math.round(rgb.r * ratio + initialRgb.r * (1 - ratio));
        const g = Math.round(rgb.g * ratio + initialRgb.g * (1 - ratio));
        const b = Math.round(rgb.b * ratio + initialRgb.b * (1 - ratio));
        
        // Convertir en hex
        const mixedColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        
        // Vérifier le contraste
        const contrast = this.calculateContrast(backgroundColor, mixedColor);
        
        if (contrast < targetContrast) {
          // Nous avons dépassé le seuil, retourner la couleur précédente
          if (i > 1) {
            const prevRatio = (i - 1) / steps;
            const prevR = Math.round(rgb.r * prevRatio + initialRgb.r * (1 - prevRatio));
            const prevG = Math.round(rgb.g * prevRatio + initialRgb.g * (1 - prevRatio));
            const prevB = Math.round(rgb.b * prevRatio + initialRgb.b * (1 - prevRatio));
            
            return `#${prevR.toString(16).padStart(2, '0')}${prevG.toString(16).padStart(2, '0')}${prevB.toString(16).padStart(2, '0')}`;
          }
          break;
        }
      }
      
      // Si aucune couleur n'a été trouvée, retourner la couleur initiale
      return initialColor;
    }
  }