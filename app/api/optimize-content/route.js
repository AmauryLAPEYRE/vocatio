// app/api/optimize-content/route.js
import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { optimizeContentWithConstraints } from '@/lib/content/adaptation';
import { calculateOptimizationMetrics } from '@/lib/content/metrics';

// Initialisation du client Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * API Route pour l'optimisation de contenu avec Claude
 * @param {Request} request - Requête HTTP
 * @returns {Promise<Response>} Réponse HTTP avec le document optimisé
 */
export async function POST(request) {
  try {
    const { documentStructure, jobDescription } = await request.json();
    
    if (!documentStructure || !jobDescription) {
      return NextResponse.json(
        { error: 'Structure de document et description de poste requises' },
        { status: 400 }
      );
    }
    
    // Analyser l'offre d'emploi
    console.log('Analyse de l\'offre d\'emploi...');
    const jobAnalysis = await analyzeJobPosting(jobDescription);
    
    // Optimiser le contenu avec contraintes spatiales
    console.log('Optimisation du contenu...');
    const optimizedDocument = await optimizeContentWithConstraints(
      documentStructure,
      jobAnalysis,
      anthropic
    );
    
    // Calculer les métriques d'optimisation
    console.log('Calcul des métriques d\'optimisation...');
    const optimizationMetrics = calculateOptimizationMetrics(
      optimizedDocument,
      jobAnalysis
    );
    
    // Ajouter les métriques d'optimisation au document
    const finalDocument = {
      ...optimizedDocument,
      optimizationMetrics
    };
    
    return NextResponse.json(finalDocument);
  } catch (error) {
    console.error('Erreur lors de l\'optimisation du contenu:', error);
    
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'optimisation du contenu',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Analyse une offre d'emploi pour en extraire les informations clés
 * @param {string} jobDescription - Description de l'offre d'emploi
 * @returns {Promise<Object>} Analyse structurée de l'offre
 */
async function analyzeJobPosting(jobDescription) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      system: "Tu es un expert en analyse d'offres d'emploi. Extrait les compétences clés, responsabilités, qualifications et mots-clés importants de cette offre d'emploi. Structure ta réponse en JSON.",
      messages: [
        {
          role: "user",
          content: `Analyse cette offre d'emploi et extrait ses éléments clés:
          
          ${jobDescription}
          
          Réponds avec un JSON structuré contenant:
          - skills: liste des compétences techniques et soft skills
          - responsibilities: principales responsabilités du poste
          - qualifications: formations et expériences requises
          - keywords: mots-clés importants à mettre en avant
          - industry: secteur d'activité
          - seniority: niveau de séniorité (junior, intermédiaire, senior)
          `
        }
      ]
    });
    
    // Extraire le JSON de la réponse
    const content = response.content[0].text;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                     content.match(/{[\s\S]*}/);
                     
    const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Erreur lors de l'analyse de l'offre d'emploi:", error);
    
    // Fallback: structure minimale en cas d'erreur
    return {
      skills: [],
      responsibilities: [],
      qualifications: [],
      keywords: [],
      industry: "",
      seniority: "intermediate"
    };
  }
}

// Configuration de l'API route
export const config = {
  runtime: 'edge'
};