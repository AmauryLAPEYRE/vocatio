// src/services/templates/canvaService.ts
import axios from 'axios';
import { CVData } from '@/store/appStore';

// Types pour les templates Canva
export interface CanvaTemplate {
  id: string;
  name: string;
  thumbnailUrl: string;
  category: string;
  tags: string[];
  description?: string;
}

interface CanvaDesignResponse {
  designId: string;
  exportUrl: string;
  previewUrl: string;
}

/**
 * Service d'intégration avec l'API Canva
 * Récupère les templates, remplit les données et génère les CVs PDF
 */
export class CanvaService {
  /**
   * Récupère tous les templates de CV disponibles depuis Canva
   */
  async getTemplates(): Promise<CanvaTemplate[]> {
    try {
      console.log("Récupération des templates Canva via l'API route...");
      
      // Utiliser notre API route au lieu d'appeler Canva directement
      const response = await axios.get('/api/canva/templates');
      
      // Transformer la réponse en format utilisable
      if (response.data.templates && Array.isArray(response.data.templates)) {
        return response.data.templates.map((template: any) => ({
          id: template.id,
          name: template.name,
          thumbnailUrl: template.thumbnailUrl,
          category: template.category || 'resume',
          tags: template.tags || [],
          description: template.description || ''
        }));
      }
      
      throw new Error('Format de réponse Canva inattendu');
    } catch (error) {
      console.error('Failed to fetch Canva templates:', error);
      
      // En cas d'erreur, retourner des templates par défaut
      return [
        {
          id: 'template-minimal',
          name: 'Minimal',
          thumbnailUrl: '/placeholders/minimal-cv.png',
          category: 'resume',
          tags: ['simple', 'clean', 'modern'],
          description: 'Design épuré et professionnel, idéal pour tout secteur.'
        },
        {
          id: 'template-professional',
          name: 'Professionnel',
          thumbnailUrl: '/placeholders/professional-cv.png',
          category: 'resume',
          tags: ['corporate', 'formal', 'traditional'],
          description: 'Design formel et traditionnel, parfait pour les secteurs conservateurs.'
        },
        {
          id: 'template-creative',
          name: 'Créatif',
          thumbnailUrl: '/placeholders/creative-cv.png',
          category: 'resume',
          tags: ['modern', 'colorful', 'unique'],
          description: 'Design moderne et coloré pour les profils créatifs.'
        }
      ];
    }
  }

  /**
   * Récupère les templates recommandés en fonction du profil et du poste
   */
  async getRecommendedTemplates(jobTitle: string, jobDescription: string): Promise<CanvaTemplate[]> {
    try {
      console.log("Récupération des templates recommandés via l'API route...");
      
      // Utiliser notre API route pour les recommandations
      const response = await axios.post('/api/canva/recommend', {
        jobTitle,
        jobDescription
      });
      
      if (response.data.templates && Array.isArray(response.data.templates)) {
        return response.data.templates.map((template: any) => ({
          id: template.id,
          name: template.name,
          thumbnailUrl: template.thumbnailUrl || '/placeholders/template-default.png',
          category: template.category || 'resume',
          tags: template.tags || [],
          description: template.description || ''
        }));
      }
      
      throw new Error('Format de réponse inattendu pour les recommandations');
    } catch (error) {
      console.error('Failed to get recommended templates:', error);
      
      // En cas d'erreur, récupérer tous les templates disponibles
      const allTemplates = await this.getTemplates();
      return allTemplates.slice(0, 3);
    }
  }

  /**
   * Crée un CV en utilisant un template Canva et les données du CV optimisé
   * Note: Pour une application de production, cette méthode devrait être
   * implémentée via une API route côté serveur également
   */
  async createResumeDesign(templateId: string, cvData: CVData): Promise<CanvaDesignResponse> {
    // Simuler la création d'un design Canva pour l'interface de démo
    // Dans une application de production, cette fonction devrait appeler
    // une API route qui contacte l'API Canva
    return {
      designId: `design-${templateId}-${Date.now()}`,
      exportUrl: '/api/export-cv',
      previewUrl: `/placeholders/${templateId.includes('minimal') ? 'minimal' : templateId.includes('professional') ? 'professional' : 'creative'}-cv.png`
    };
  }

  /**
   * Exporte un design Canva au format PDF
   * Note: Pour une application de production, cette méthode devrait être
   * implémentée via une API route côté serveur également
   */
  async exportDesignAsPDF(designId: string): Promise<string> {
    // Simuler l'export d'un PDF pour l'interface de démo
    // Dans une application de production, cette fonction devrait appeler
    // une API route qui contacte l'API Canva
    return `/api/export-cv/${designId}`;
  }
}

// Exporter une instance du service
export const canvaService = new CanvaService();