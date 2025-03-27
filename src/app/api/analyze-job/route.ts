// src/app/api/analyze-job/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAI, PROMPTS } from '@/services/ai/claude';

// Structure minimale pour une offre d'emploi
const minimalJobStructure = {
  title: "",
  company: "",
  location: "",
  description: "",
  requiredSkills: [],
  preferredSkills: [],
  responsibilities: [],
  qualifications: [],
  educationLevel: "",
  experienceLevel: ""
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("Début de l'analyse de l'offre d'emploi");
    
    const { jobDescription } = await request.json();
    
    if (!jobDescription || jobDescription.trim() === '') {
      console.log("Description de poste vide");
      return NextResponse.json(
        { error: 'Description de poste vide' },
        { status: 400 }
      );
    }
    
    console.log("Appel à l'API Claude pour analyser l'offre d'emploi");
    
    // Création d'un prompt amélioré pour garantir une réponse JSON
    const prompt = `
Tu es un expert en analyse d'offres d'emploi. Analyse cette offre d'emploi et extrait toutes les informations pertinentes.
Ne fais aucune supposition et n'invente aucune information.

Offre d'emploi:
"""
${jobDescription}
"""

Réponds UNIQUEMENT avec un objet JSON structuré au format suivant, sans aucun commentaire ou texte supplémentaire:

${JSON.stringify(minimalJobStructure, null, 2)}

Rappel important: Ta réponse doit être UNIQUEMENT le JSON, sans aucun texte avant ou après.
`;
    
    const aiResponse = await callAI(prompt, {
      temperature: 0.1,
      max_tokens: 2000
    });
    
    console.log("Réponse reçue de Claude, longueur:", aiResponse.length);
    
    try {
      // Vérifier si la réponse ressemble à du JSON
      const jsonStartIndex = aiResponse.indexOf('{');
      const jsonEndIndex = aiResponse.lastIndexOf('}');
      
      if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
        // Extraire seulement la partie JSON de la réponse
        const jsonPart = aiResponse.substring(jsonStartIndex, jsonEndIndex + 1);
        console.log("Partie JSON extraite de la réponse");
        
        // Essayer de parser cette partie
        try {
          const jobData = JSON.parse(jsonPart);
          console.log("Données de l'offre d'emploi extraites avec succès");
          return NextResponse.json({ data: jobData });
        } catch (innerJsonError) {
          console.error("Erreur lors du parsing de la partie JSON:", innerJsonError);
          
          // En cas d'échec, utiliser la structure minimale avec un message d'erreur
          return NextResponse.json({
            data: {...minimalJobStructure, description: jobDescription.substring(0, 200) + "..."},
            error: "L'analyse de l'offre d'emploi a échoué. Veuillez vérifier le format du texte et réessayer."
          });
        }
      } else {
        console.error("La réponse ne contient pas de JSON valide");
        console.log("Réponse brute de Claude:", aiResponse.substring(0, 200) + "...");
        
        // Analyse manuelle basique pour récupérer au moins le titre
        const lines = jobDescription.split('\n');
        let title = lines[0].trim();
        if (title.length > 50) title = "Poste à pourvoir"; // Titre par défaut

        // Si la réponse ne contient pas de JSON, utiliser la structure minimale avec les données basiques
        return NextResponse.json({
          data: {...minimalJobStructure, title: title, description: jobDescription},
          error: "L'analyse de l'offre d'emploi n'a pas produit de résultats exploitables."
        });
      }
    } catch (jsonError) {
      console.error("Erreur de parsing JSON:", jsonError);
      console.log("Réponse brute de Claude:", aiResponse.substring(0, 200) + "...");
      
      // Tentative simple d'extraction de données minimales
      const lines = jobDescription.split('\n');
      let title = lines[0].trim();
      if (title.length > 50) title = "Poste à pourvoir"; // Titre par défaut
      
      // En cas d'erreur générale de parsing, utiliser la structure minimale
      return NextResponse.json({
        data: {...minimalJobStructure, title: title, description: jobDescription},
        error: "Une erreur s'est produite lors de l'analyse de l'offre d'emploi. Veuillez réessayer."
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'analyse de l'offre d'emploi:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du traitement de l'offre d'emploi", details: error.message },
      { status: 500 }
    );
  }
}