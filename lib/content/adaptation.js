// lib/content/adaptation.js
import { buildOptimizationPrompt } from './prompts';

/**
 * Optimise le contenu du document en respectant les contraintes spatiales
 * @param {Object} documentStructure - Structure du document
 * @param {Object} jobAnalysis - Analyse de l'offre d'emploi
 * @param {Object} anthropicClient - Client Anthropic API
 * @returns {Promise<Object>} Document optimisé
 */
export async function optimizeContentWithConstraints(
  documentStructure,
  jobAnalysis,
  anthropicClient
) {
  const { sections, blocks, editableZones } = documentStructure;
  
  // Ajouter un mappage des blocs par ID pour un accès plus facile
  const blocksById = {};
  blocks.forEach(block => {
    blocksById[block.id] = { ...block };
  });
  
  // Grouper les zones modifiables par section
  const zonesBySection = groupZonesBySection(editableZones, sections);
  
  // Optimiser chaque section en parallèle
  const optimizationPromises = Object.entries(zonesBySection).map(
    async ([sectionId, sectionZones]) => {
      // Trouver la section correspondante
      const section = sections.find(s => s.id === sectionId);
      
      if (!section || sectionZones.length === 0) {
        return { sectionId, optimizedBlocks: [] };
      }
      
      // Calculer les contraintes spatiales pour cette section
      const spatialConstraints = calculateSpatialConstraints(sectionZones, blocksById);
      
      // Optimiser la section avec Claude
      const optimizedContent = await optimizeSectionWithClaude(
        section,
        sectionZones,
        jobAnalysis,
        spatialConstraints,
        anthropicClient
      );
      
      // Retourner les blocs optimisés de cette section
      return {
        sectionId,
        optimizedBlocks: optimizedContent.blocks || []
      };
    }
  );
  
  // Attendre que toutes les optimisations soient terminées
  const sectionResults = await Promise.all(optimizationPromises);
  
  // Fusionner les résultats
  const optimizedBlocks = [];
  sectionResults.forEach(result => {
    result.optimizedBlocks.forEach(optimizedBlock => {
      optimizedBlocks.push(optimizedBlock);
    });
  });
  
  // Mettre à jour les blocs avec le contenu optimisé
  const updatedBlocks = blocks.map(block => {
    const optimized = optimizedBlocks.find(ob => ob.id === block.id);
    
    if (optimized && optimized.optimizedText) {
      return {
        ...block,
        text: optimized.optimizedText,
        originalText: block.text,
        matchScore: optimized.matchScore || 0.5
      };
    }
    
    return block;
  });
  
  // Retourner le document mis à jour
  return {
    ...documentStructure,
    blocks: updatedBlocks
  };
}

/**
 * Groupe les zones modifiables par section
 * @param {Array} editableZones - Zones modifiables
 * @param {Array} sections - Sections du document
 * @returns {Object} Zones groupées par ID de section
 */
function groupZonesBySection(editableZones, sections) {
  const zonesBySection = {};
  
  // Initialiser un objet vide pour chaque section
  sections.forEach(section => {
    zonesBySection[section.id] = [];
  });
  
  // Grouper les zones par section
  editableZones.forEach(zone => {
    if (zone.section) {
      if (!zonesBySection[zone.section]) {
        zonesBySection[zone.section] = [];
      }
      zonesBySection[zone.section].push(zone);
    } else {
      // Si pas de section, mettre dans "autres"
      if (!zonesBySection['other']) {
        zonesBySection['other'] = [];
      }
      zonesBySection['other'].push(zone);
    }
  });
  
  return zonesBySection;
}

/**
 * Calcule les contraintes spatiales pour une section
 * @param {Array} sectionZones - Zones de la section
 * @param {Object} blocksById - Blocs indexés par ID
 * @returns {Object} Contraintes spatiales
 */
function calculateSpatialConstraints(sectionZones, blocksById) {
  // Calculer l'espace total disponible
  const totalChars = sectionZones.reduce((sum, zone) => {
    const block = blocksById[zone.id];
    return sum + (block?.text?.length || 0);
  }, 0);
  
  // Calculer la densité moyenne de caractères par unité d'aire
  let totalArea = 0;
  let charCount = 0;
  
  sectionZones.forEach(zone => {
    const block = blocksById[zone.id];
    if (block && block.text && block.bbox) {
      const area = block.bbox.width * block.bbox.height;
      totalArea += area;
      charCount += block.text.length;
    }
  });
  
  const charDensity = charCount > 0 && totalArea > 0 
    ? charCount / totalArea 
    : 0.01; // Valeur par défaut si pas de données
  
  // Calculer les contraintes par zone
  const zoneConstraints = sectionZones.map(zone => {
    const block = blocksById[zone.id];
    
    if (!block || !block.bbox) {
      return {
        id: zone.id,
        maxChars: 100, // Valeur par défaut
        originalLength: block?.text?.length || 0,
        weight: 1
      };
    }
    
    const area = block.bbox.width * block.bbox.height;
    const maxChars = Math.floor(area * charDensity * 0.95); // 5% de marge
    
    return {
      id: zone.id,
      maxChars: Math.max(maxChars, 10), // Au moins 10 caractères
      originalLength: block.text?.length || 0,
      weight: charCount > 0 ? (block.text?.length || 0) / charCount : 0.5
    };
  });
  
  return {
    totalChars,
    charDensity,
    zones: zoneConstraints
  };
}

/**
 * Optimise une section avec Claude API
 * @param {Object} section - Section à optimiser
 * @param {Array} sectionZones - Zones de la section
 * @param {Object} jobAnalysis - Analyse de l'offre d'emploi
 * @param {Object} constraints - Contraintes spatiales
 * @param {Object} anthropicClient - Client Anthropic API
 * @returns {Promise<Object>} Contenu optimisé
 */
async function optimizeSectionWithClaude(
  section,
  sectionZones,
  jobAnalysis,
  constraints,
  anthropicClient
) {
  try {
    // Construire le prompt pour Claude
    const prompt = buildOptimizationPrompt(
      section,
      sectionZones,
      jobAnalysis,
      constraints
    );
    
    // Appeler l'API Claude
    const response = await anthropicClient.messages.create({
      model: "claude-3-sonnet-20240229", // Modèle plus léger et rapide
      max_tokens: 4000,
      system: "Tu es un expert en optimisation de CV. Ta mission est d'adapter précisément le contenu d'un CV pour correspondre à une offre d'emploi spécifique, tout en respectant scrupuleusement les contraintes spatiales indiquées.",
      messages: [{ role: "user", content: prompt }]
    });
    
    // Extraire le JSON de la réponse
    const content = response.content[0].text;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                     content.match(/{[\s\S]*}/);
                     
    const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
    const result = JSON.parse(jsonString);
    
    // Valider les contraintes de longueur
    const validatedResult = validateLengthConstraints(result, constraints);
    
    return validatedResult;
  } catch (error) {
    console.error(`Erreur lors de l'optimisation de la section ${section.id}:`, error);
    
    // Fallback: renvoyer le contenu original
    return {
      blocks: sectionZones.map(zone => ({
        id: zone.id,
        originalText: zone.text,
        optimizedText: zone.text,
        matchScore: 0
      }))
    };
  }
}

/**
 * Valide que les textes optimisés respectent les contraintes de longueur
 * @param {Object} result - Résultat de l'optimisation
 * @param {Object} constraints - Contraintes spatiales
 * @returns {Object} Résultat validé
 */
function validateLengthConstraints(result, constraints) {
  const constraintsByZoneId = {};
  constraints.zones.forEach(zone => {
    constraintsByZoneId[zone.id] = zone.maxChars;
  });
  
  // Vérifier et ajuster si nécessaire
  const validatedBlocks = result.blocks.map(block => {
    const maxChars = constraintsByZoneId[block.id] || 100;
    
    if (block.optimizedText && block.optimizedText.length > maxChars) {
      console.warn(`Texte optimisé trop long pour le bloc ${block.id}, troncature appliquée`);
      
      // Tronquer en préservant les mots complets
      let truncated = block.optimizedText.substring(0, maxChars);
      const lastSpaceIndex = truncated.lastIndexOf(' ');
      
      if (lastSpaceIndex > maxChars * 0.8) { // Au moins 80% du texte
        truncated = truncated.substring(0, lastSpaceIndex);
      }
      
      return {
        ...block,
        optimizedText: truncated,
        truncated: true
      };
    }
    
    return block;
  });
  
  return {
    ...result,
    blocks: validatedBlocks
  };
}