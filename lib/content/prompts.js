// lib/content/prompts.js

/**
 * Construit un prompt structuré pour l'optimisation avec Claude
 * @param {Object} section - Section du CV
 * @param {Array} zones - Zones modifiables de la section
 * @param {Object} jobAnalysis - Analyse de l'offre d'emploi
 * @param {Object} constraints - Contraintes spatiales
 * @returns {string} Prompt structuré
 */
export function buildOptimizationPrompt(section, zones, jobAnalysis, constraints) {
    // Convertir l'analyse du poste en texte formaté
    const jobAnalysisText = formatJobAnalysis(jobAnalysis);
    
    // Formatter les zones de texte à optimiser
    const zonesText = zones.map(zone => 
      `Bloc ID ${zone.id}: "${zone.text}"`
    ).join('\n\n');
    
    // Formatter les contraintes spatiales
    const constraintsText = formatConstraints(constraints);
    
    // Instructions adaptées au type de section
    const sectionInstructions = getSectionSpecificInstructions(section, jobAnalysis);
    
    // Construire le prompt complet
    return `
  Je vais te fournir une section "${section.name}" d'un CV à optimiser pour qu'elle corresponde mieux à une offre d'emploi spécifique.
  
  ## OFFRE D'EMPLOI - ANALYSE
  ${jobAnalysisText}
  
  ## CONTENU ACTUEL DE LA SECTION "${section.name.toUpperCase()}"
  ${zonesText}
  
  ## CONTRAINTES SPATIALES (TRÈS IMPORTANT)
  ${constraintsText}
  
  ## INSTRUCTIONS GÉNÉRALES
  1. Optimise chaque bloc de texte pour mieux correspondre à l'offre d'emploi
  2. RESPECTE STRICTEMENT le nombre maximal de caractères (maxChars) pour chaque bloc
  3. Conserve le sens général et les informations factuelles
  4. Intègre naturellement les compétences et mots-clés de l'offre d'emploi
  5. Adapte le ton et le vocabulaire au niveau de séniorité indiqué (${jobAnalysis.seniority || 'intermédiaire'})
  6. N'invente PAS de nouvelles expériences ou qualifications
  
  ## INSTRUCTIONS SPÉCIFIQUES POUR CETTE SECTION
  ${sectionInstructions}
  
  ## FORMAT DE RÉPONSE
  Réponds uniquement avec un JSON au format suivant:
  \`\`\`json
  {
    "blocks": [
      {
        "id": "ID_DU_BLOC",
        "originalText": "Texte original",
        "optimizedText": "Texte optimisé",
        "matchScore": 0.85 // Score de 0 à 1 indiquant la pertinence pour l'offre
      },
      ...
    ]
  }
  \`\`\`
  
  IMPORTANT: Vérifie que chaque "optimizedText" respecte STRICTEMENT la contrainte maxChars correspondante.
  `;
  }
  
  /**
   * Formate l'analyse du poste pour le prompt
   * @param {Object} jobAnalysis - Analyse de l'offre d'emploi
   * @returns {string} Texte formaté
   */
  function formatJobAnalysis(jobAnalysis) {
    const sections = [
      {
        title: 'Compétences recherchées',
        data: jobAnalysis.skills,
        formatter: items => items.map(skill => `- ${skill}`).join('\n')
      },
      {
        title: 'Responsabilités principales',
        data: jobAnalysis.responsibilities,
        formatter: items => items.map(resp => `- ${resp}`).join('\n')
      },
      {
        title: 'Qualifications requises',
        data: jobAnalysis.qualifications,
        formatter: items => items.map(qual => `- ${qual}`).join('\n')
      },
      {
        title: 'Mots-clés importants',
        data: jobAnalysis.keywords,
        formatter: items => items.join(', ')
      },
      {
        title: 'Secteur d\'activité',
        data: jobAnalysis.industry,
        formatter: value => value
      },
      {
        title: 'Niveau de séniorité',
        data: jobAnalysis.seniority,
        formatter: value => value
      }
    ];
    
    // Construire le texte formaté
    let formattedText = '';
    
    sections.forEach(section => {
      if (section.data && (
          (Array.isArray(section.data) && section.data.length > 0) || 
          (!Array.isArray(section.data) && section.data)
      )) {
        formattedText += `### ${section.title}\n`;
        
        if (Array.isArray(section.data)) {
          formattedText += section.formatter(section.data);
        } else {
          formattedText += section.formatter(section.data);
        }
        
        formattedText += '\n\n';
      }
    });
    
    return formattedText;
  }
  
  /**
   * Formate les contraintes spatiales pour le prompt
   * @param {Object} constraints - Contraintes spatiales
   * @returns {string} Texte formaté
   */
  function formatConstraints(constraints) {
    let constraintsText = `Densité moyenne de caractères: ${constraints.charDensity.toFixed(4)} caractères par unité d'aire\n\n`;
    
    constraintsText += 'Contraintes par bloc:\n';
    constraints.zones.forEach(zone => {
      constraintsText += `- Bloc ${zone.id}: maximum ${zone.maxChars} caractères (actuellement: ${zone.originalLength})\n`;
    });
    
    return constraintsText;
  }
  
  /**
   * Génère des instructions spécifiques selon le type de section
   * @param {Object} section - Section du CV
   * @param {Object} jobAnalysis - Analyse de l'offre d'emploi
   * @returns {string} Instructions spécifiques
   */
  function getSectionSpecificInstructions(section, jobAnalysis) {
    // Instructions par défaut
    let instructions = "Adapte le contenu pour mettre en valeur la correspondance avec l'offre d'emploi.";
    
    // Adapter selon le type de section CV
    if (section.resumeSectionType) {
      switch (section.resumeSectionType) {
        case 'experience':
          instructions = `
  - Met en avant les expériences les plus pertinentes pour le poste
  - Utilise des verbes d'action alignés avec les responsabilités du poste
  - Quantifie les réalisations quand c'est possible
  - Met en évidence les compétences spécifiques utilisées
  - Adapte le vocabulaire pour refléter celui de l'offre d'emploi
  - Prioritise les mots-clés: ${(jobAnalysis.keywords || []).slice(0, 5).join(', ')}
  `;
          break;
          
        case 'education':
          instructions = `
  - Mets en valeur les formations et diplômes les plus pertinents
  - Souligne les cours ou projets alignés avec les compétences recherchées
  - Ajuste le niveau de détail selon la pertinence pour le poste
  - Si l'offre requiert des certifications spécifiques, assure-toi qu'elles soient visibles
  `;
          break;
          
        case 'skills':
          instructions = `
  - Réorganise les compétences pour mettre en premier celles qui correspondent à l'offre
  - Utilise exactement les mêmes termes que dans l'offre d'emploi quand c'est pertinent
  - Ajoute le niveau de maîtrise si absent et pertinent
  - Groupe les compétences par catégories si approprié
  - Compétences principales à mettre en avant: ${(jobAnalysis.skills || []).slice(0, 7).join(', ')}
  `;
          break;
          
        case 'profile':
          instructions = `
  - Résume clairement le profil en alignement avec le poste visé
  - Intègre 2-3 compétences clés mentionnées dans l'offre d'emploi
  - Adapte le ton au niveau de séniorité recherché (${jobAnalysis.seniority || 'intermédiaire'})
  - Mentionne le secteur d'activité spécifique si pertinent (${jobAnalysis.industry || ''})
  - Évoque l'ambition professionnelle en lien avec le poste
  `;
          break;
          
        case 'languages':
          instructions = `
  - Si des langues spécifiques sont mentionnées dans l'offre, assure-toi qu'elles sont bien visibles
  - Précise les niveaux de maîtrise selon les standards (CECRL: A1-C2, ou débutant/intermédiaire/courant/bilingue)
  - Si pertinent, mentionne l'expérience professionnelle dans ces langues
  `;
          break;
          
        case 'projects':
          instructions = `
  - Mets en avant les projets utilisant les technologies/compétences mentionnées dans l'offre
  - Souligne les méthodologies et approches alignées avec les responsabilités du poste
  - Quantifie les résultats et impacts quand c'est possible
  - Mentionne le travail d'équipe si l'offre valorise la collaboration
  `;
          break;
          
        default:
          // Instructions par défaut
          break;
      }
    }
    
    return instructions;
  }