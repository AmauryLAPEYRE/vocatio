// src/app/api/extract-cv/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAI, PROMPTS } from '@/services/ai/claude';
import mammoth from 'mammoth';

// Pour utiliser pdf.js dans Next.js côté serveur
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // pdf.js n'est pas directement accessible côté serveur dans Next.js
    // Nous allons créer une API simple pour extraire le texte
    
    // Convertir le buffer en base64 pour le transfert
    const base64Data = buffer.toString('base64');
    
    // Extraire les premiers Ko du fichier pour les métadonnées
    const pdfHeader = buffer.slice(0, Math.min(1024, buffer.length));
    let extractedText = '';
    
    // Analyser manuellement certaines métadonnées
    const headerText = pdfHeader.toString('utf-8', 0, Math.min(1024, buffer.length));
    
    // Extraire le titre si présent
    const titleMatch = headerText.match(/\/Title\s*\(([^)]+)\)/);
    if (titleMatch && titleMatch[1]) {
      extractedText += `Titre: ${titleMatch[1]}\n`;
    }
    
    // Extraire l'auteur si présent
    const authorMatch = headerText.match(/\/Author\s*\(([^)]+)\)/);
    if (authorMatch && authorMatch[1]) {
      extractedText += `Auteur: ${authorMatch[1]}\n`;
    }
    
    // Extraire la date si présente
    const dateMatch = headerText.match(/\/CreationDate\s*\(([^)]+)\)/);
    if (dateMatch && dateMatch[1]) {
      extractedText += `Date: ${dateMatch[1]}\n`;
    }
    
    // Pour une extraction plus avancée en production, vous devriez implémenter
    // une solution plus robuste, comme un microservice dédié à l'extraction de texte
    // ou utiliser une API comme Google Document AI, Amazon Textract, etc.
    
    // Pour l'instant, nous fournissons un message à Claude expliquant la situation
    extractedText += `\nContenu principal du CV: Le fichier PDF a été téléchargé avec succès (taille: ${buffer.length} octets). Cependant, l'extraction complète du texte n'est pas disponible dans cette configuration serveur.\n\nPour traiter ce CV, veuillez demander à l'utilisateur de télécharger une version DOCX ou texte de son CV pour une meilleure analyse.\n`;
    
    return extractedText;
  } catch (error) {
    console.error('Erreur lors de l\'extraction du texte du PDF:', error);
    return `Erreur lors de l'extraction du texte: ${error.message}. Veuillez télécharger un fichier PDF valide ou essayer avec un fichier DOCX.`;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("Début du traitement de la requête POST");
    
    const formData = await request.formData();
    console.log("FormData récupéré");
    
    const file = formData.get('file') as File | null;
    console.log("Fichier récupéré:", file ? `${file.name} (${file.size} bytes)` : "null");
    
    if (!file) {
      console.log("Aucun fichier trouvé dans formData");
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }
    
    // Vérifier le type de fichier
    const fileType = file.name.split('.').pop()?.toLowerCase();
    console.log("Type de fichier détecté:", fileType);
    
    if (fileType !== 'pdf' && fileType !== 'docx') {
      console.log("Type de fichier non supporté:", fileType);
      return NextResponse.json(
        { error: 'Format de fichier non supporté. Veuillez télécharger un fichier PDF ou DOCX.' },
        { status: 400 }
      );
    }
    
    // Lire le contenu du fichier
    console.log("Lecture du contenu du fichier...");
    
    try {
      // Convertir le fichier en ArrayBuffer puis en Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log("Buffer créé, taille:", buffer.length);
      
      // Extraire le texte selon le type de fichier
      let text = '';
      
      if (fileType === 'pdf') {
        console.log("Analyse du fichier PDF...");
        text = await extractTextFromPDF(buffer);
        console.log("Texte extrait du PDF (partiel), longueur:", text.length);
      } else if (fileType === 'docx') {
        console.log("Analyse du fichier DOCX avec mammoth...");
        const result = await mammoth.extractRawText({
          buffer: buffer
        });
        text = result.value;
        console.log("Texte extrait du DOCX, longueur:", text.length);
      }
      
      if (!text || text.trim() === '') {
        console.log("Aucun texte n'a pu être extrait du fichier");
        return NextResponse.json(
          { error: 'Impossible d\'extraire le texte du fichier. Veuillez essayer avec un autre format ou contacter le support.' },
          { status: 400 }
        );
      }
      
      // Informations minimales pour un CV
      const minimalCVStructure = {
        personalInfo: {
          name: "",
          email: "",
          phone: "",
          address: "",
          linkedin: "",
          summary: ""
        },
        skills: [],
        experiences: [],
        education: [],
        certifications: [],
        languages: [],
        projects: []
      };
      
      // Appeler Claude pour extraire les informations structurées
      console.log("Appel à l'API Claude...");
      
      // Création d'un prompt spécifique pour les PDF difficiles à analyser
      const prompt = `
Tu es un expert en analyse de CV. Analyse ce texte extrait d'un CV et remplis le modèle JSON suivant avec les informations que tu peux trouver.
Pour chaque champ, si tu ne trouves pas l'information correspondante, laisse simplement une chaîne vide ou un tableau vide.
N'invente jamais d'informations et n'essaie pas de deviner. Utilise uniquement les informations explicitement présentes dans le texte.

Texte du CV:
"""
${text}
"""

Réponds UNIQUEMENT avec un objet JSON valide comme indiqué ci-dessous, sans explications ni préambule.

${JSON.stringify(minimalCVStructure, null, 2)}
`;
      
      const aiResponse = await callAI(prompt, {
        temperature: 0.1,
        max_tokens: 3000
      });
      console.log("Réponse reçue de Claude");
      
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
            const cvData = JSON.parse(jsonPart);
            console.log("Données CV extraites avec succès");
            return NextResponse.json({ data: cvData });
          } catch (innerJsonError) {
            console.error("Erreur lors du parsing de la partie JSON:", innerJsonError);
            
            // En cas d'échec, utiliser la structure minimale avec un message d'erreur
            return NextResponse.json({
              data: minimalCVStructure,
              error: "L'analyse du CV a échoué. Veuillez vérifier le format du fichier ou télécharger une version DOCX pour de meilleurs résultats."
            });
          }
        } else {
          console.error("La réponse ne contient pas de JSON valide");
          console.log("Réponse brute de Claude:", aiResponse.substring(0, 200) + "...");
          
          // Si la réponse ne contient pas de JSON, utiliser la structure minimale
          return NextResponse.json({
            data: minimalCVStructure,
            error: "L'analyse du CV n'a pas produit de résultats exploitables. Veuillez essayer avec un document au format DOCX."
          });
        }
      } catch (jsonError) {
        console.error("Erreur de parsing JSON:", jsonError);
        console.log("Réponse brute de Claude:", aiResponse.substring(0, 200) + "...");
        
        // En cas d'erreur générale de parsing, utiliser la structure minimale
        return NextResponse.json({
          data: minimalCVStructure,
          error: "Une erreur s'est produite lors de l'analyse du CV. Notre équipe a été notifiée du problème."
        });
      }
    } catch (processingError) {
      console.error("Erreur lors du traitement du fichier:", processingError);
      return NextResponse.json(
        { error: 'Erreur lors du traitement du fichier. Veuillez réessayer avec un autre document ou contacter le support.', details: processingError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur générale:", error);
    return NextResponse.json(
      { error: 'Une erreur inattendue est survenue. Veuillez réessayer ultérieurement.', details: error.message },
      { status: 500 }
    );
  }
}