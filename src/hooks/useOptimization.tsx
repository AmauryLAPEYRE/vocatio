// src/hooks/useOptimization.tsx

import { useState, useCallback } from 'react';
import { useClaudeAPI } from 'src/lib/api/claude';
import { useStore, useCVStore } from 'src/store';
import { HTMLRecreator } from 'src/lib/document-processing/html-recreator';
import { useError } from './useError';

interface OptimizationOptions {
  preserveStructure?: boolean;
  enhanceKeySkills?: boolean;
  adaptToJobDescription?: boolean;
  useProfessionalLanguage?: boolean;
  highlightAchievements?: boolean;
  customPromptAddition?: string;
}

/**
 * Hook pour gérer l'optimisation de CV avec des options avancées
 */
export function useOptimization() {
  const [optimizing, setOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [template, setTemplate] = useState<any>(null);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  
  const { error, handleError, clearError } = useError({ showToast: true });
  
  // API Claude
  const { sendMessage, loading } = useClaudeAPI({
    temperature: 0.3,
    systemPrompt: `
      Tu es un expert en optimisation de CV pour des candidatures professionnelles.
      Ta tâche est d'analyser un CV et une offre d'emploi, puis de proposer une 
      version optimisée du CV qui met en valeur les compétences et expériences 
      pertinentes pour le poste.
      
      RÈGLES CRUCIALES:
      1. Ne jamais inventer ou falsifier des informations - utilise uniquement les éléments présents dans le CV original
      2. Conserver exactement la même structure et organisation que le CV original
      3. Se concentrer sur les correspondances entre les compétences du candidat et les exigences du poste
      4. Optimiser uniquement le contenu (mots, descriptions) sans rien ajouter ou supprimer de fondamental
      
      Pour chaque section du CV, tu recevras l'identifiant et le contenu original.
      Tu dois fournir uniquement le contenu optimisé pour chaque section, sans modifier la structure.
    `
  });
  
  // Accès au store pour les données
  const { 
    originalContent: cvData, 
    optimizedContent: optimizedCV,
  } = useStore((state) => state.cv);
  
  const setOptimizedCV = useCVStore((state) => state.setOptimizedCV);
  
  const { 
    content: jobData, 
    skills: jobSkills 
  } = useStore((state) => state.job);
  
  const { analysis, matchedSkills } = useStore((state) => state.matching);
  
  // Préparation du template HTML
  const prepareTemplate = useCallback(async () => {
    if (!cvData) return null;
    
    try {
      clearError();
      setProgress(10);
      
      // Vérifier si nous avons les données Base64 (méthode préférée)
      if ('originalPdfBase64' in cvData && cvData.originalPdfBase64) {
        // Analyser le PDF en utilisant les données Base64
        const extractedTemplate = await HTMLRecreator.analyzePDF(cvData.originalPdfBase64);
        setTemplate(extractedTemplate);
        
        // Générer un aperçu HTML sans optimisation
        const html = HTMLRecreator.generateHTML(extractedTemplate);
        setHtmlPreview(html);
        
        setProgress(30);
        return extractedTemplate;
      }
      // Sinon, essayer avec l'ArrayBuffer si disponible
      else if ('originalArrayBuffer' in cvData && cvData.originalArrayBuffer) {
        try {
          // Créer une copie pour éviter les problèmes de détachement
          const buffer = cvData.originalArrayBuffer.slice(0);
          
          // Analyser le PDF pour créer le template
          const extractedTemplate = await HTMLRecreator.analyzePDF(buffer);
          setTemplate(extractedTemplate);
          
          // Générer un aperçu HTML sans optimisation
          const html = HTMLRecreator.generateHTML(extractedTemplate);
          setHtmlPreview(html);
          
          setProgress(30);
          return extractedTemplate;
        } catch (bufferError) {
          throw handleError(bufferError, 'document');
        }
      } else {
        throw handleError(new Error('Format de CV non pris en charge pour la préservation du format.'), 'format');
      }
    } catch (err) {
      throw handleError(err, 'document');
    }
  }, [cvData, clearError, handleError]);
  
  // Optimiser le CV
  const optimizeCV = useCallback(async (options: OptimizationOptions = {}) => {
    if (!cvData || !jobData || !analysis) {
      handleError(new Error('Données manquantes pour l\'optimisation'), 'validation');
      return;
    }
    
    setOptimizing(true);
    clearError();
    setProgress(0);
    
    try {
      // Étape 1: Préparer le template HTML
      const cvTemplate = template || await prepareTemplate();
      if (!cvTemplate) {
        throw handleError(new Error('Impossible de préparer le template du CV'), 'document');
      }
      
      setProgress(40);
      
      // Étape 2: Extraire les sections du template
      const sections: Record<string, string> = {};
      
      // Collecter les sections de toutes les pages
      cvTemplate.pages.forEach((page: any, pageIndex: number) => {
        page.sections.forEach((section: any) => {
          // Extraire le texte de la section
          const sectionText = section.elements
            .filter((e: any) => e.text) // Filtrer les éléments avec du texte
            .map((e: any) => e.text)
            .join(' ');
          
          if (sectionText.trim()) {
            sections[section.id] = sectionText;
          }
        });
      });
      
      setProgress(50);
      
      // Étape 3: Créer le prompt pour Claude
      // Construire la partie des options du prompt
      let optionsPrompt = '';
      
      if (options.preserveStructure) {
        optionsPrompt += 'Conserve absolument la structure et l\'organisation du CV original.\n';
      }
      
      if (options.enhanceKeySkills) {
        optionsPrompt += 'Mets particulièrement en avant les compétences clés qui correspondent à l\'offre d\'emploi.\n';
      }
      
      if (options.adaptToJobDescription) {
        optionsPrompt += 'Adapte le vocabulaire et les descriptions pour mieux correspondre à celui utilisé dans l\'offre d\'emploi.\n';
      }
      
      if (options.useProfessionalLanguage) {
        optionsPrompt += 'Utilise un langage professionnel et des verbes d\'action percutants.\n';
      }
      
      if (options.highlightAchievements) {
        optionsPrompt += 'Mets l\'accent sur les réalisations concrètes et les résultats quantifiables.\n';
      }
      
      if (options.customPromptAddition) {
        optionsPrompt += options.customPromptAddition + '\n';
      }
      
      // Prompt principal
      let prompt = `
        # OFFRE D'EMPLOI
        ${jobData.text}
        
        ${matchedSkills ? `
        # COMPÉTENCES REQUISES IDENTIFIÉES
        ${matchedSkills.filter(skill => skill.inJob).map(skill => skill.skill).join(', ')}
        ` : ''}
        
        # ANALYSE DE CORRESPONDANCE
        ${analysis}
        
        # OPTIONS D'OPTIMISATION
        ${optionsPrompt}
        
        # INSTRUCTIONS
        Optimise chaque section du CV ci-dessous pour mieux correspondre à l'offre d'emploi.
        Conserve exactement la même structure, mais améliore uniquement le contenu textuel.
        Pour chaque section, fournis uniquement le contenu optimisé en JSON.
        
        # SECTIONS DU CV ORIGINAL
      `;
      
      // Ajouter chaque section au prompt
      Object.entries(sections).forEach(([id, content]) => {
        prompt += `
          ## Section ID: ${id}
          ${content}
        `;
      });
      
      prompt += `
        # FORMAT DE RÉPONSE REQUIS
        Réponds avec un objet JSON où les clés sont les IDs de section et les valeurs sont le contenu optimisé:
        \`\`\`json
        {
          "section-1-0": "contenu optimisé de la section...",
          "section-1-1": "contenu optimisé de la section...",
          ...
        }
        \`\`\`
      `;
      
      setProgress(60);
      
      // Étape 4: Envoyer la requête à Claude
      const response = await sendMessage(prompt);
      
      setProgress(80);
      
      // Étape 5: Extraire le JSON de la réponse
      const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       response.content.match(/\{[\s\S]*\}/);
                       
      if (!jsonMatch) {
        throw handleError(new Error('Format de réponse incorrect de l\'API'), 'api');
      }
      
      // Parser le JSON des sections optimisées
      const optimizedSections = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
      // Étape 6: Générer le HTML optimisé
      const optimizedHTML = HTMLRecreator.generateHTML(cvTemplate, optimizedSections);
      
      // Mettre à jour l'aperçu
      setHtmlPreview(optimizedHTML);
      
      // Créer le texte complet optimisé pour le stockage
      const fullOptimizedText = Object.values(optimizedSections).join('\n\n');
      
      // Mettre à jour le store avec le CV optimisé
      setOptimizedCV({
        text: fullOptimizedText,
        originalFormat: 'html',
        optimizationDate: new Date(),
        tokenUsage: response.tokenUsage,
        formattedHTML: optimizedHTML,
        template: cvTemplate,
        optimizedSections: optimizedSections
      });
      
      setProgress(100);
      return {
        success: true,
        html: optimizedHTML,
        text: fullOptimizedText,
        template: cvTemplate,
        sections: optimizedSections
      };
    } catch (err) {
      handleError(err, 'optimization');
      return { success: false, error: err };
    } finally {
      setOptimizing(false);
    }
  }, [
    cvData, 
    jobData, 
    analysis, 
    template, 
    matchedSkills, 
    prepareTemplate, 
    sendMessage, 
    setOptimizedCV, 
    handleError, 
    clearError
  ]);
  
  return {
    optimizeCV,
    prepareTemplate,
    optimizing,
    loading,
    progress,
    template,
    htmlPreview,
    error,
    clearError
  };
}