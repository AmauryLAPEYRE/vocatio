// src/hooks/useLetterGeneration.tsx
import { useState, useCallback } from 'react';
import { useClaudeAPI } from 'src/lib/api/claude';
import { useStore, useLetterStore } from 'src/store';
import { useError } from './useError';
import { useLoading } from '@/components/common/LoadingState';

// Types plus détaillés
export interface LetterStyle {
  id: string;
  label: string;
  description: string;
  tone: string;
  structure: string;
  example?: string;
}

export interface LetterCustomization {
  includeIntroduction: boolean;
  includeExperience: boolean;
  includeSkills: boolean;
  includeMotivation: boolean;
  includeAvailability: boolean;
  requestInterview: boolean;
  useFormality: 'formal' | 'standard' | 'casual';
  useLength: 'concise' | 'standard' | 'detailed';
  highlightKeywords: boolean;
  personalization: string;
}

// Styles d'écriture prédéfinis avec plus de détails
export const LETTER_STYLES: LetterStyle[] = [
  { 
    id: 'professional', 
    label: 'Professionnel', 
    description: 'Style formel et structuré, adapté à la plupart des entreprises', 
    tone: 'Ton formel qui exprime le professionnalisme et la rigueur',
    structure: 'Structure traditionnelle avec introduction, corps et conclusion clairs'
  },
  { 
    id: 'creative', 
    label: 'Créatif', 
    description: 'Style dynamique avec une touche personnelle, pour les secteurs créatifs', 
    tone: 'Ton enthousiaste et inventif qui démontre une personnalité créative',
    structure: 'Structure plus flexible avec des éléments narratifs et personnels'
  },
  { 
    id: 'technical', 
    label: 'Technique', 
    description: 'Axé sur les compétences techniques, idéal pour les postes spécialisés', 
    tone: 'Ton précis et factuel qui met en avant l\'expertise technique',
    structure: 'Accent sur les compétences techniques et les réalisations concrètes'
  },
  { 
    id: 'enthusiastic', 
    label: 'Enthousiaste', 
    description: 'Ton passionné et énergique, pour démontrer votre motivation', 
    tone: 'Ton dynamique et passionné qui exprime une forte motivation',
    structure: 'Structure qui met en avant l\'intérêt pour l\'entreprise et le poste'
  },
  { 
    id: 'concise', 
    label: 'Concis', 
    description: 'Style direct et efficace, pour les recruteurs pressés', 
    tone: 'Ton direct et factuel qui va à l\'essentiel',
    structure: 'Structure épurée avec paragraphes courts et messages clés en évidence'
  },
  { 
    id: 'storytelling', 
    label: 'Storytelling', 
    description: 'Raconte votre parcours comme une histoire cohérente', 
    tone: 'Ton narratif qui présente votre parcours comme un récit captivant',
    structure: 'Introduction narrative, développement cohérent et conclusion impactante'
  },
  { 
    id: 'impact', 
    label: 'Impact', 
    description: 'Met l\'accent sur vos réalisations quantifiables', 
    tone: 'Ton orienté résultats avec des preuves concrètes de vos accomplissements',
    structure: 'Structure centrée sur les résultats mesurables et l\'impact de votre travail'
  }
];

// Options par défaut
const DEFAULT_CUSTOMIZATION: LetterCustomization = {
  includeIntroduction: true,
  includeExperience: true,
  includeSkills: true,
  includeMotivation: true,
  includeAvailability: true,
  requestInterview: true,
  useFormality: 'standard',
  useLength: 'standard',
  highlightKeywords: true,
  personalization: ''
};

/**
 * Hook personnalisé pour la génération de lettres de motivation
 */
export function useLetterGeneration() {
  const [selectedStyle, setSelectedStyle] = useState<string>('professional');
  const [customizations, setCustomizations] = useState<LetterCustomization>(DEFAULT_CUSTOMIZATION);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  
  // Gestion des erreurs et chargement
  const { error, handleError, clearError } = useError({ showToast: true });
  const {
    loading: generating,
    message,
    progress,
    startLoading,
    updateMessage,
    updateProgress,
    stopLoading
  } = useLoading('letter');
  
  // API Claude
  const { sendMessage } = useClaudeAPI({
    temperature: 0.7,
    systemPrompt: `
      Tu es un expert en rédaction de lettres de motivation professionnelles.
      Ta tâche est de créer une lettre de motivation personnalisée qui met en valeur
      l'adéquation entre le profil du candidat et le poste visé, en respectant le style demandé.
      
      RÈGLES IMPORTANTES:
      1. Ne jamais inventer d'informations - utilise uniquement les éléments fournis dans le CV
      2. Adapter le ton et le style selon les préférences indiquées
      3. La lettre doit être concise, impactante et sans fautes
      4. Mettre en avant les correspondances entre les compétences du candidat et les exigences du poste
      5. Personnaliser la lettre en fonction de l'entreprise et du poste spécifiques
      
      Ta réponse doit contenir uniquement le texte de la lettre de motivation, sans introduction ni conclusion.
    `
  });
  
  // Stores
  const { 
    originalContent: cvData,
    optimizedContent: optimizedCV
  } = useStore((state) => state.cv);
  
  const { 
    content: jobData,
    companyName,
    jobTitle,
    skills: jobSkills
  } = useStore((state) => state.job);
  
  const { matchedSkills } = useStore((state) => state.matching);
  
  // Actions du store
  const setLetterContent = useLetterStore((state) => state.setLetterContent);
  const letterContent = useStore((state) => state.letter.content);
  
  /**
   * Met à jour les options de personnalisation
   */
  const updateCustomization = useCallback((
    key: keyof LetterCustomization, 
    value: any
  ) => {
    setCustomizations(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  /**
   * Réinitialise les options de personnalisation
   */
  const resetCustomizations = useCallback(() => {
    setCustomizations(DEFAULT_CUSTOMIZATION);
  }, []);
  
  /**
   * Génère la lettre de motivation basée sur le style et les personnalisations
   */
  const generateLetter = useCallback(async (forceRegenerate = false) => {
    if ((!cvData || !jobData) && !forceRegenerate) {
      handleError(new Error('Données manquantes. Veuillez d\'abord télécharger votre CV et une offre d\'emploi.'), 'validation');
      return null;
    }
    
    if (letterContent && !forceRegenerate) {
      return { content: letterContent };
    }
    
    startLoading('preparing');
    clearError();
    
    try {
      // Trouver le style sélectionné
      const style = LETTER_STYLES.find(s => s.id === selectedStyle) || LETTER_STYLES[0];
      
      updateProgress(10);
      updateMessage('analyzing');
      
      // Préparer les sections à inclure
      const sections = [];
      if (customizations.includeIntroduction) sections.push('introduction présentant brièvement le candidat et son intérêt pour le poste');
      if (customizations.includeExperience) sections.push('paragraphe sur les expériences pertinentes en lien avec le poste');
      if (customizations.includeSkills) sections.push('paragraphe sur les compétences techniques et soft skills correspondant aux besoins');
      if (customizations.includeMotivation) sections.push('paragraphe expliquant la motivation pour rejoindre cette entreprise spécifique');
      if (customizations.includeAvailability) sections.push('mention de la disponibilité');
      if (customizations.requestInterview) sections.push('demande d\'entretien');
      
      updateProgress(30);
      
      // Obtenir les compétences correspondantes
      const relevantSkills = matchedSkills 
        ? matchedSkills
            .filter(skill => skill.inCV && skill.inJob)
            .map(skill => skill.skill)
        : jobSkills || [];
      
      // Créer les instructions de formalité
      let formalityInstructions = '';
      switch (customizations.useFormality) {
        case 'formal':
          formalityInstructions = 'Utilise un langage très formel et soutenu, avec des tournures professionnelles.';
          break;
        case 'casual':
          formalityInstructions = 'Utilise un langage moins formel mais toujours professionnel, avec une touche personnelle.';
          break;
        default:
          formalityInstructions = 'Utilise un langage professionnel standard, ni trop formel ni trop décontracté.';
      }
      
      // Créer les instructions de longueur
      let lengthInstructions = '';
      switch (customizations.useLength) {
        case 'concise':
          lengthInstructions = 'Rédige une lettre très concise (environ 250 mots maximum).';
          break;
        case 'detailed':
          lengthInstructions = 'Rédige une lettre détaillée mais toujours dans une seule page (environ 400-450 mots).';
          break;
        default:
          lengthInstructions = 'Rédige une lettre de longueur standard (environ 300-350 mots).';
      }
      
      updateProgress(50);
      updateMessage('writing');
      
      // Personnalisation additionnelle
      const additionalInstructions = customizations.personalization 
        ? `Instructions additionnelles: ${customizations.personalization}` 
        : '';
      
      // Créer le prompt pour Claude
      const prompt = `
        # CV DU CANDIDAT
        ${optimizedCV ? optimizedCV.text : cvData.text}
        
        # OFFRE D'EMPLOI
        ${jobData.text}
        
        # INFORMATIONS COMPLÉMENTAIRES
        - Nom de l'entreprise: ${companyName || 'Non spécifié'}
        - Titre du poste: ${jobTitle || 'Non spécifié'}
        ${relevantSkills.length > 0 ? `- Compétences clés: ${relevantSkills.join(', ')}` : ''}
        
        # STYLE DE RÉDACTION DEMANDÉ: ${style.label}
        ${style.description}
        Ton: ${style.tone}
        Structure: ${style.structure}
        
        # PARAMÈTRES DE PERSONNALISATION
        ${formalityInstructions}
        ${lengthInstructions}
        ${customizations.highlightKeywords ? 'Intègre subtilement les mots-clés de l\'offre d\'emploi.' : ''}
        ${additionalInstructions}
        
        # SECTIONS À INCLURE
        ${sections.join(', ')}
        
        # INSTRUCTIONS
        Rédige une lettre de motivation personnalisée pour cette offre d'emploi spécifique, en utilisant uniquement les informations fournies dans le CV. 
        La lettre doit être professionnelle, sans erreurs, et adaptée aux conventions du pays d'origine de l'offre.
        Ne pas inventer d'informations qui ne sont pas dans le CV.
        
        Produis uniquement le texte de la lettre de motivation, sans formule d'appel ni signature.
      `;
      
      updateProgress(70);
      
      // Envoyer la requête à Claude
      const response = await sendMessage(prompt);
      
      updateProgress(90);
      
      // Mettre à jour le store avec la lettre générée
      const content = response.content.trim();
      
      setLetterContent({
        content,
        style: selectedStyle,
        generationDate: new Date(),
        customizations,
        tokenUsage: response.tokenUsage
      });
      
      updateProgress(100);
      
      return {
        content,
        style: selectedStyle,
        customizations,
        tokenUsage: response.tokenUsage
      };
    } catch (err) {
      return handleError(err, 'api');
    } finally {
      stopLoading();
    }
  }, [
    cvData, 
    jobData, 
    letterContent, 
    optimizedCV,
    companyName, 
    jobTitle, 
    jobSkills,
    matchedSkills,
    selectedStyle, 
    customizations, 
    sendMessage, 
    setLetterContent,
    handleError,
    clearError,
    startLoading,
    updateMessage,
    updateProgress,
    stopLoading
  ]);
  
  return {
    generateLetter,
    selectedStyle,
    setSelectedStyle,
    customizations,
    updateCustomization,
    resetCustomizations,
    generating,
    error,
    progress,
    message,
    previewMode,
    setPreviewMode,
    letterStyles: LETTER_STYLES
  };
}
