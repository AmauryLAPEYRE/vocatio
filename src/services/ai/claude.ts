// src/services/ai/claude.ts
import axios from 'axios';

interface AnthropicResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

interface AnthropicOptions {
  temperature?: number;
  max_tokens?: number;
}

/**
 * Appelle l'API Claude (Anthropic) avec un prompt donné
 * @param prompt Texte du prompt à envoyer à l'API
 * @param options Options (température, tokens max)
 * @returns Texte de la réponse
 */
export async function callAI(prompt: string, options: AnthropicOptions = {}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('La clé API Anthropic n\'est pas configurée');
  }
  
  try {
    const response = await axios.post<AnthropicResponse>(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-opus-20240229',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature ?? 0.3,
        max_tokens: options.max_tokens ?? 4000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    // Extraction du texte de la réponse
    if (response.data.content && response.data.content.length > 0) {
      return response.data.content[0].text;
    }
    
    throw new Error('Format de réponse Anthropic inattendu');
  } catch (error) {
    console.error('Erreur lors de l\'appel à l\'API Claude:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Erreur API Claude (${error.response.status}): ${error.response.data}`);
    }
    throw error;
  }
}

// Prompts optimisés pour Claude
export const PROMPTS = {
  // Prompt pour extraire les informations du CV
  CV_EXTRACTION: `
  Extrait UNIQUEMENT les informations EXPLICITEMENT présentes dans ce CV.
  Consignes importantes:
  - Ne fais AUCUNE supposition sur des informations non mentionnées
  - Ne complète PAS les informations manquantes
  - Si une section est vide ou ambiguë, retourne un tableau vide pour cette section
  - Indique clairement les parties où les informations sont incomplètes
  
  CV à analyser:
  {{CV_TEXT}}
  
  Réponds uniquement avec un objet JSON structuré au format suivant:
  {
    "personalInfo": {
      "name": "",
      "email": "",
      "phone": "",
      "address": "",
      "linkedin": "",
      "summary": ""
    },
    "skills": [],
    "experiences": [
      {
        "company": "",
        "title": "",
        "location": "",
        "startDate": "",
        "endDate": "",
        "description": "",
        "achievements": []
      }
    ],
    "education": [
      {
        "institution": "",
        "degree": "",
        "field": "",
        "startDate": "",
        "endDate": "",
        "description": ""
      }
    ],
    "certifications": [],
    "languages": [],
    "projects": []
  }
  `,
  
  // Prompt pour analyser l'offre d'emploi
  JOB_ANALYSIS: `
  Analyse cette offre d'emploi et extrait toutes les informations pertinentes.
  Ne fait aucune supposition et n'invente aucune information.
  
  Offre d'emploi:
  {{JOB_TEXT}}
  
  Réponds uniquement avec un objet JSON structuré au format suivant:
  {
    "title": "",
    "company": "",
    "location": "",
    "description": "",
    "requiredSkills": [],
    "preferredSkills": [],
    "responsibilities": [],
    "qualifications": [],
    "educationLevel": "",
    "experienceLevel": ""
  }
  `,
  
  // Prompt pour optimiser le résumé
  SUMMARY_OPTIMIZATION: `
  Optimise ce résumé professionnel pour mieux correspondre à l'offre d'emploi.
  RÈGLES ABSOLUES:
  1. Utilise UNIQUEMENT des informations qui existent déjà dans le texte original
  2. Ne crée JAMAIS de nouvelles compétences ou expériences
  3. Reformule et réorganise pour mettre en valeur ce qui correspond le mieux à l'offre
  4. Conserve toutes les informations factuelles
  
  Résumé original:
  {{ORIGINAL_SUMMARY}}
  
  Poste visé: {{JOB_TITLE}}
  
  Description du poste:
  {{JOB_DESCRIPTION}}
  
  Réponds uniquement avec le résumé optimisé, sans commentaires ni explications.
  `,
  
  // Prompt pour optimiser les expériences
  EXPERIENCE_OPTIMIZATION: `
  Optimise cette description d'expérience professionnelle pour mieux correspondre 
  à l'offre d'emploi, en respectant ces règles STRICTES:
  
  1. Utilise UNIQUEMENT les informations présentes dans l'expérience originale
  2. NE CRÉE PAS de nouvelles compétences, responsabilités ou réalisations
  3. Reformule et réorganise le contenu existant pour mettre en valeur:
     - Les compétences qui correspondent aux exigences de l'offre
     - Les responsabilités similaires à celles demandées
     - Les réalisations pertinentes pour le poste
  4. Conserve toutes les informations factuelles (dates, entreprise, titre)
  5. Maintiens le même niveau de responsabilité et d'expérience
  
  Expérience originale:
  {{ORIGINAL_EXPERIENCE}}
  
  Exigences du poste:
  {{JOB_REQUIREMENTS}}
  
  Réponds avec un objet JSON au même format que l'expérience originale, contenant uniquement l'expérience optimisée.
  `,
  
  // Prompt pour optimiser les compétences
  SKILLS_OPTIMIZATION: `
  Optimise cette liste de compétences pour mieux correspondre aux exigences du poste.
  Règles strictes:
  1. Tu dois UNIQUEMENT reformuler, réorganiser ou mettre en évidence des compétences EXISTANTES
  2. Tu ne dois JAMAIS inventer de nouvelles compétences
  3. Tu peux regrouper des compétences similaires ou les présenter différemment
  4. Tu peux utiliser les termes exacts des compétences requises UNIQUEMENT si une compétence équivalente existe déjà
  
  Compétences originales:
  {{ORIGINAL_SKILLS}}
  
  Compétences requises pour le poste:
  {{REQUIRED_SKILLS}}
  
  Compétences préférées pour le poste:
  {{PREFERRED_SKILLS}}
  
  Réponds avec un tableau JSON contenant uniquement les compétences optimisées.
  `
};