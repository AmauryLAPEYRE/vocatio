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
  private readonly baseUrl = 'https://api.canva.com/v1';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiration: Date | null = null;

  constructor() {
    this.clientId = process.env.CANVA_CLIENT_ID || '';
    this.clientSecret = process.env.CANVA_CLIENT_SECRET || '';
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('Canva API credentials not set. Template functionality will be limited.');
    }
  }

  /**
   * Obtient un token d'accès pour l'API Canva
   */
  private async getAccessToken(): Promise<string> {
    // Vérifier si le token existant est encore valide
    if (this.accessToken && this.tokenExpiration && this.tokenExpiration > new Date()) {
      return this.accessToken;
    }

    try {
      const response = await axios.post('https://api.canva.com/oauth2/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
        scope: 'templates.read designs.write'
      });

      this.accessToken = response.data.access_token;
      // Définir l'expiration (généralement 1 heure)
      this.tokenExpiration = new Date(Date.now() + response.data.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Canva access token:', error);
      throw new Error('Failed to authenticate with Canva API');
    }
  }

  /**
   * Récupère tous les templates de CV disponibles depuis Canva
   */
  async getTemplates(): Promise<CanvaTemplate[]> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(`${this.baseUrl}/templates`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          category: 'resume',
          limit: 50
        }
      });

      // Transformer la réponse en format utilisable
      return response.data.templates.map((template: any) => ({
        id: template.id,
        name: template.name,
        thumbnailUrl: template.thumbnailUrl,
        category: template.category,
        tags: template.tags || [],
        description: template.description || ''
      }));
    } catch (error) {
      console.error('Failed to fetch Canva templates:', error);
      
      // En cas d'erreur avec l'API Canva, retourner quelques templates par défaut
      // Ces templates devraient idéalement être stockés dans une base de données ou un fichier de configuration
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
      const templates = await this.getTemplates();
      
      // Utiliser l'API Claude pour trouver les templates les plus pertinents
      const token = await this.getAccessToken();
      const apiKey = process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        throw new Error('API Anthropic non configurée');
      }
      
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-7-sonnet-20250219',
          messages: [
            {
              role: 'user',
              content: `
              Basé sur cette offre d'emploi et cette liste de templates CV, identifie les 3 templates les plus appropriés.
              
              Offre d'emploi:
              Titre: ${jobTitle}
              Description: ${jobDescription}
              
              Templates disponibles:
              ${JSON.stringify(templates.map(t => ({
                id: t.id,
                name: t.name,
                tags: t.tags,
                category: t.category,
                description: t.description
              })))}
              
              Réponds uniquement avec un tableau JSON des IDs des 3 templates les plus pertinents, sans commentaire additionnel.
              Exemple: ["template-id-1", "template-id-2", "template-id-3"]
              `
            }
          ],
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      // Extraire les IDs recommandés
      const recommendedIds = JSON.parse(response.data.content[0].text);
      
      // Filtrer les templates pour ne garder que les recommandés
      const recommendedTemplates = templates.filter(t => recommendedIds.includes(t.id));
      
      // Si moins de 3 recommandations, compléter avec d'autres templates
      if (recommendedTemplates.length < 3) {
        const remainingTemplates = templates.filter(t => !recommendedIds.includes(t.id));
        return [...recommendedTemplates, ...remainingTemplates.slice(0, 3 - recommendedTemplates.length)];
      }
      
      return recommendedTemplates;
    } catch (error) {
      console.error('Failed to get recommended templates:', error);
      // En cas d'erreur, retourner tous les templates disponibles
      const allTemplates = await this.getTemplates();
      return allTemplates.slice(0, 3);
    }
  }

  /**
   * Crée un CV en utilisant un template Canva et les données du CV optimisé
   */
  async createResumeDesign(templateId: string, cvData: CVData): Promise<CanvaDesignResponse> {
    try {
      const token = await this.getAccessToken();

      // Préparer les données à injecter dans le template
      const designData = this.formatCVDataForCanva(cvData);

      // Appeler l'API Canva pour créer un design à partir du template
      const response = await axios.post(
        `${this.baseUrl}/designs`, 
        {
          templateId: templateId,
          data: designData
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Retourner les informations du design créé
      return {
        designId: response.data.designId,
        exportUrl: response.data.exportUrl,
        previewUrl: response.data.previewUrl
      };
    } catch (error) {
      console.error('Failed to create resume design in Canva:', error);
      throw new Error('Échec de la création du CV avec le template Canva');
    }
  }

  /**
   * Exporte un design Canva au format PDF
   */
  async exportDesignAsPDF(designId: string): Promise<string> {
    try {
      const token = await this.getAccessToken();

      // Demander l'export du design en PDF
      const exportResponse = await axios.post(
        `${this.baseUrl}/designs/${designId}/exports`,
        {
          format: 'pdf'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Récupérer l'URL de téléchargement du PDF
      const exportId = exportResponse.data.exportId;
      
      // Attendre que l'export soit prêt (poll l'API)
      let exportStatus = 'in_progress';
      let pdfUrl = '';
      
      while (exportStatus === 'in_progress') {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
        
        const statusResponse = await axios.get(
          `${this.baseUrl}/designs/${designId}/exports/${exportId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        exportStatus = statusResponse.data.status;
        
        if (exportStatus === 'completed') {
          pdfUrl = statusResponse.data.url;
        } else if (exportStatus === 'failed') {
          throw new Error('Export PDF échoué sur Canva');
        }
      }
      
      return pdfUrl;
    } catch (error) {
      console.error('Failed to export design as PDF:', error);
      throw new Error('Échec de l\'export du CV en PDF');
    }
  }

  /**
   * Formate les données du CV pour l'API Canva
   * Cela dépend de la structure attendue par les templates Canva
   */
  private formatCVDataForCanva(cvData: CVData): any {
    // Remarque: la structure exacte dépend des champs attendus par vos templates Canva
    return {
      personal_info: {
        name: cvData.personalInfo.name,
        email: cvData.personalInfo.email,
        phone: cvData.personalInfo.phone,
        address: cvData.personalInfo.address,
        linkedin: cvData.personalInfo.linkedin,
        summary: cvData.personalInfo.summary
      },
      skills: cvData.skills.map(skill => ({ name: skill })),
      experiences: cvData.experiences.map(exp => ({
        title: exp.title,
        company: exp.company,
        location: exp.location || '',
        start_date: exp.startDate,
        end_date: exp.endDate,
        description: exp.description,
        achievements: exp.achievements || []
      })),
      education: cvData.education.map(edu => ({
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        start_date: edu.startDate,
        end_date: edu.endDate,
        description: edu.description || ''
      })),
      certifications: (cvData.certifications || []).map(cert => ({
        name: cert.name,
        issuer: cert.issuer,
        date: cert.date,
        description: cert.description || ''
      })),
      languages: (cvData.languages || []).map(lang => ({
        language: lang.language,
        proficiency: lang.proficiency
      })),
      projects: (cvData.projects || []).map(proj => ({
        name: proj.name,
        description: proj.description,
        url: proj.url || '',
        start_date: proj.startDate || '',
        end_date: proj.endDate || '',
        technologies: proj.technologies || []
      }))
    };
  }
}

// Exporter une instance du service
export const canvaService = new CanvaService();