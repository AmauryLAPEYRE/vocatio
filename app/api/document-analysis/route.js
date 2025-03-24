// app/api/document-analysis/route.js
import { NextResponse } from 'next/server';
import { InferenceSession } from 'onnxruntime-web';
import { preprocessDocument } from '@/lib/layoutlm/preprocessing';
import { extractDocumentStructure } from '@/lib/document/extraction';

// Initialisation du cache KV (utilise Vercel KV en production)
const CACHE_TTL = 86400; // 24h en secondes
const documentCache = new Map();

/**
 * API Edge Function pour l'analyse de document avec LayoutLM
 * @param {Request} request - Requête HTTP
 * @returns {Promise<Response>} Réponse HTTP avec la structure du document
 */
export async function POST(request) {
  try {
    // Récupération et validation des données
    const formData = await request.formData();
    const pdfFile = formData.get('pdf');
    const pageRenderings = JSON.parse(formData.get('pageRenderings') || '[]');
    
    if (!pdfFile) {
      return NextResponse.json(
        { error: 'Fichier PDF requis' },
        { status: 400 }
      );
    }
    
    // Génération d'un identifiant unique pour ce document
    const documentHash = await generateDocumentHash(pdfFile);
    
    // Vérification du cache
    const cachedResult = documentCache.get(documentHash);
    if (cachedResult) {
      console.log('Résultat trouvé en cache:', documentHash);
      return NextResponse.json(JSON.parse(cachedResult));
    }
    
    // Prétraitement du document pour LayoutLM
    const { pdfData, textBlocks, visualFeatures } = await preprocessDocument(
      pdfFile,
      pageRenderings
    );
    
    // Chargement du modèle LayoutLM optimisé (au format ONNX)
    console.log('Chargement du modèle LayoutLM...');
    const modelPath = process.env.NEXT_PUBLIC_VERCEL_URL 
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/models/layoutlm-quantized.onnx`
      : '/models/layoutlm-quantized.onnx';
    
    const model = await InferenceSession.create(modelPath, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all'
    });
    
    // Préparation des tenseurs d'entrée pour LayoutLM
    const inputTensors = prepareLayoutLMInput(textBlocks, visualFeatures);
    
    // Exécution de l'inférence
    console.log('Exécution de l\'inférence LayoutLM...');
    const results = await model.run(inputTensors);
    
    // Extraction de la structure complète du document
    const documentStructure = extractDocumentStructure(
      results,
      textBlocks,
      pdfData
    );
    
    // Mise en cache du résultat
    const resultJSON = JSON.stringify(documentStructure);
    documentCache.set(documentHash, resultJSON);
    
    // Planifier l'expiration du cache
    setTimeout(() => {
      documentCache.delete(documentHash);
    }, CACHE_TTL * 1000);
    
    return NextResponse.json(documentStructure);
  } catch (error) {
    console.error('Erreur lors de l\'analyse du document:', error);
    
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'analyse du document',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Génère un hash unique pour un document
 * @param {File} file - Fichier PDF
 * @returns {Promise<string>} Hash du document
 */
async function generateDocumentHash(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Prépare les tenseurs d'entrée pour LayoutLM
 * @param {Array} textBlocks - Blocs de texte extraits
 * @param {Array} visualFeatures - Caractéristiques visuelles extraites
 * @returns {Object} Tenseurs d'entrée pour LayoutLM
 */
function prepareLayoutLMInput(textBlocks, visualFeatures) {
  // Dans une implémentation réelle, nous préparerions ici les tenseurs
  // selon le format exact attendu par le modèle LayoutLM quantifié
  
  // Structure simplifiée pour l'exemple
  return {
    input_ids: new Float32Array([/* ... */]),
    attention_mask: new Float32Array([/* ... */]),
    token_type_ids: new Float32Array([/* ... */]),
    bbox: new Float32Array([/* ... */]),
    image: new Float32Array([/* ... */])
  };
}

// Configuration de l'Edge Function
export const config = {
  runtime: 'edge',
  regions: ['fra1', 'cdg1']  // Régions européennes pour RGPD
};