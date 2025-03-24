// lib/content/metrics.js

/**
 * Calcule les métriques d'optimisation pour le document
 * @param {Object} optimizedDocument - Document optimisé
 * @param {Object} jobAnalysis - Analyse de l'offre d'emploi
 * @returns {Object} Métriques d'optimisation
 */
export function calculateOptimizationMetrics(optimizedDocument, jobAnalysis) {
    // Extraire le texte complet des blocs modifiés
    const optimizedBlocks = optimizedDocument.blocks.filter(block => block.originalText);
    const allOptimizedText = optimizedBlocks.map(block => block.text).join(' ');
    
    // Calculer les scores par catégorie
    const skillsMatch = calculateKeywordMatch(allOptimizedText, jobAnalysis.skills || []);
    const keywordsMatch = calculateKeywordMatch(allOptimizedText, jobAnalysis.keywords || []);
    const responsibilitiesMatch = calculateConceptMatch(allOptimizedText, jobAnalysis.responsibilities || []);
    
    // Calculer le score global
    const overallScore = calculateOverallScore({
      skillsScore: skillsMatch.score,
      keywordsScore: keywordsMatch.score,
      responsibilitiesScore: responsibilitiesMatch.score
    });
    
    // Calculer les scores par section
    const sectionScores = calculateSectionScores(optimizedDocument);
    
    // Statistiques de modification
    const modificationStats = calculateModificationStats(optimizedDocument);
    
    // Structure finale des métriques
    return {
      overallScore,
      categoryScores: {
        skills: skillsMatch,
        keywords: keywordsMatch,
        responsibilities: responsibilitiesMatch
      },
      sectionScores,
      modificationStats,
      textualSummary: generateTextualSummary({
        overallScore,
        skillsMatch,
        keywordsMatch,
        responsibilitiesMatch,
        modificationStats
      })
    };
  }
  
  /**
   * Calcule la correspondance des mots-clés
   * @param {string} text - Texte optimisé
   * @param {Array} keywords - Mots-clés à rechercher
   * @returns {Object} Résultats de correspondance
   */
  function calculateKeywordMatch(text, keywords) {
    if (!keywords || keywords.length === 0) {
      return {
        score: 1,
        total: 0,
        matched: 0,
        items: []
      };
    }
    
    const textLower = text.toLowerCase();
    const matched = keywords.filter(keyword => {
      if (!keyword) return false;
      return textLower.includes(keyword.toLowerCase());
    });
    
    return {
      score: matched.length / keywords.length,
      total: keywords.length,
      matched: matched.length,
      items: matched
    };
  }
  
  /**
   * Calcule la correspondance des concepts (responsabilités)
   * @param {string} text - Texte optimisé
   * @param {Array} concepts - Concepts à rechercher
   * @returns {Object} Résultats de correspondance
   */
  function calculateConceptMatch(text, concepts) {
    if (!concepts || concepts.length === 0) {
      return {
        score: 1,
        total: 0,
        matched: 0,
        items: []
      };
    }
    
    const textLower = text.toLowerCase();
    
    // Pour chaque concept, vérifier s'il est présent (ou ses mots-clés)
    const results = concepts.map(concept => {
      if (!concept) return { matched: false, concept };
      
      // Diviser le concept en mots-clés
      const keywords = concept.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3) // Ignorer les mots courts
        .map(word => word.replace(/[^\w]/g, '')); // Nettoyer les mots
      
      // Un concept est considéré comme correspondant si au moins 50% de ses mots-clés sont présents
      const matchedKeywords = keywords.filter(keyword => textLower.includes(keyword));
      const threshold = Math.max(1, Math.ceil(keywords.length * 0.5));
      
      return {
        matched: matchedKeywords.length >= threshold,
        concept,
        matchedKeywords,
        score: keywords.length > 0 ? matchedKeywords.length / keywords.length : 0
      };
    });
    
    const matched = results.filter(result => result.matched);
    
    return {
      score: concepts.length > 0 ? matched.length / concepts.length : 1,
      total: concepts.length,
      matched: matched.length,
      items: matched.map(item => item.concept),
      details: results
    };
  }
  
  /**
   * Calcule le score global d'optimisation
   * @param {Object} scores - Scores par catégorie
   * @returns {number} Score global (0-1)
   */
  function calculateOverallScore(scores) {
    // Pondération des différentes catégories
    const weights = {
      skillsScore: 0.4,
      keywordsScore: 0.3,
      responsibilitiesScore: 0.3
    };
    
    let totalWeight = 0;
    let weightedSum = 0;
    
    // Calcul de la somme pondérée
    Object.entries(scores).forEach(([key, score]) => {
      if (typeof score === 'number' && !isNaN(score)) {
        const weight = weights[key] || 0;
        weightedSum += score * weight;
        totalWeight += weight;
      }
    });
    
    // Normalisation
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  
  /**
   * Calcule les scores par section
   * @param {Object} document - Document optimisé
   * @returns {Array} Scores par section
   */
  function calculateSectionScores(document) {
    const { blocks, sections } = document;
    const blocksBySection = {};
    
    // Regrouper les blocs par section
    blocks.forEach(block => {
      if (block.section && block.matchScore !== undefined) {
        if (!blocksBySection[block.section]) {
          blocksBySection[block.section] = [];
        }
        blocksBySection[block.section].push(block);
      }
    });
    
    // Calculer le score moyen par section
    return Object.entries(blocksBySection).map(([sectionId, sectionBlocks]) => {
      // Trouver la section correspondante
      const section = sections.find(s => s.id === sectionId);
      const sectionName = section?.name || sectionId;
      
      // Calculer le score moyen
      const totalScore = sectionBlocks.reduce((sum, block) => sum + (block.matchScore || 0), 0);
      const avgScore = sectionBlocks.length > 0 ? totalScore / sectionBlocks.length : 0;
      
      return {
        id: sectionId,
        name: sectionName,
        type: section?.resumeSectionType || 'other',
        score: avgScore,
        blockCount: sectionBlocks.length
      };
    })
    .sort((a, b) => b.score - a.score); // Tri par score décroissant
  }
  
  /**
   * Calcule les statistiques de modification
   * @param {Object} document - Document optimisé
   * @returns {Object} Statistiques de modification
   */
  function calculateModificationStats(document) {
    const { blocks } = document;
    const modifiedBlocks = blocks.filter(block => block.originalText && block.text !== block.originalText);
    
    if (modifiedBlocks.length === 0) {
      return {
        modifiedBlocks: 0,
        modifiedChars: 0,
        modificationRate: 0,
        averageChangePercentage: 0
      };
    }
    
    // Nombre total de caractères avant/après
    let originalChars = 0;
    let optimizedChars = 0;
    let charDiff = 0;
    
    modifiedBlocks.forEach(block => {
      const originalLength = block.originalText?.length || 0;
      const newLength = block.text?.length || 0;
      
      originalChars += originalLength;
      optimizedChars += newLength;
      charDiff += Math.abs(newLength - originalLength);
    });
    
    // Taux moyen de modification
    const totalBlocks = blocks.filter(block => block.originalText).length;
    const modificationRate = totalBlocks > 0 ? modifiedBlocks.length / totalBlocks : 0;
    
    // Pourcentage moyen de changement par bloc
    const averageChangePercentage = originalChars > 0 ? (charDiff / originalChars) * 100 : 0;
    
    return {
      modifiedBlocks: modifiedBlocks.length,
      totalBlocks,
      modificationRate,
      originalChars,
      optimizedChars,
      charDiff,
      averageChangePercentage
    };
  }
  
  /**
   * Génère un résumé textuel des optimisations
   * @param {Object} metrics - Métriques calculées
   * @returns {string} Résumé textuel
   */
  function generateTextualSummary(metrics) {
    const { 
      overallScore, 
      skillsMatch, 
      keywordsMatch, 
      responsibilitiesMatch,
      modificationStats 
    } = metrics;
    
    // Convertir le score en pourcentage
    const scorePercent = Math.round(overallScore * 100);
    
    // Qualificatif selon le score
    let qualification;
    if (scorePercent >= 90) qualification = "excellente";
    else if (scorePercent >= 75) qualification = "très bonne";
    else if (scorePercent >= 60) qualification = "bonne";
    else if (scorePercent >= 40) qualification = "moyenne";
    else qualification = "limitée";
    
    // Phrase d'introduction
    let summary = `Votre CV présente une ${qualification} correspondance (${scorePercent}%) avec cette offre d'emploi. `;
    
    // Détails sur les modifications
    if (modificationStats.modifiedBlocks > 0) {
      const modifiedPercent = Math.round(modificationStats.modificationRate * 100);
      summary += `${modificationStats.modifiedBlocks} sections ont été optimisées (${modifiedPercent}% du contenu). `;
    }
    
    // Points forts
    const strengths = [];
    
    if (skillsMatch.score >= 0.7) {
      strengths.push(`vous possédez ${Math.round(skillsMatch.score * 100)}% des compétences recherchées`);
    }
    
    if (keywordsMatch.score >= 0.6) {
      strengths.push(`votre profil inclut ${keywordsMatch.matched} mots-clés essentiels sur ${keywordsMatch.total}`);
    }
    
    if (responsibilitiesMatch.score >= 0.6) {
      strengths.push(`vous avez de l'expérience dans ${Math.round(responsibilitiesMatch.score * 100)}% des responsabilités requises`);
    }
    
    if (strengths.length > 0) {
      summary += `Points forts: ${strengths.join(', ')}.`;
    }
    
    return summary;
  }