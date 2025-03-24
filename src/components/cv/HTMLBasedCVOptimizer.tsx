// src/components/cv/HTMLBasedCVOptimizer.tsx
import { useState, useEffect } from 'react';
import { useClaudeAPI } from '@/lib/api/claude';
import { useStore, useCVStore } from '@/store';
import { LoadingState } from '@/components/common/LoadingState';
import { HTMLRecreator } from '@/lib/document-processing/html-recreator';
import { configurePDFWorker } from '@/lib/document-processing/pdf-processor';

interface HTMLBasedCVOptimizerProps {
  onComplete: () => void;
}

export function HTMLBasedCVOptimizer({ onComplete }: HTMLBasedCVOptimizerProps) {
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<any>(null);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState({
    enhanceKeySkills: true,
    adaptToJobDescription: true,
    useProfessionalLanguage: true,
    highlightAchievements: true
  });
  
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
  
  // Configurer le worker PDF.js à l'initialisation du composant
  useEffect(() => {
    // S'assurer que le worker PDF.js est correctement configuré
    configurePDFWorker();
  }, []);
  
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
  useEffect(() => {
    async function analyzeOriginalCV() {
      if (!cvData) return;
      
      try {
        setError(null);
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
          } catch (bufferError) {
            console.error('Erreur avec ArrayBuffer:', bufferError);
            setError('Erreur lors de l\'analyse du CV. Veuillez réimporter votre CV.');
          }
        } else {
          setError('Format de CV non pris en charge pour la préservation du format.');
        }
      } catch (err) {
        console.error('Erreur lors de l\'analyse pour recréation HTML:', err);
        setError('Erreur lors de l\'analyse du CV pour la préservation du format.');
      }
    }
    
    if (cvData && !template) {
      analyzeOriginalCV();
    }
  }, [cvData, template]);
  
  // Optimiser le CV
  const optimizeCV = async () => {
    if (!cvData || !jobData || !analysis || !template) {
      setError('Données manquantes. Veuillez d\'abord télécharger votre CV et une offre d\'emploi.');
      return;
    }
    
    setOptimizing(true);
    setError(null);
    setProgress(40);
    
    try {
      // Extraire les sections du template pour les envoyer à Claude
      const sections: Record<string, string> = {};
      
      // Collecter les sections de toutes les pages
      template.pages.forEach((page: any, pageIndex: number) => {
        page.sections.forEach((section: any) => {
          // Extraire le texte de la section
          const sectionText = section.elements
            .filter((e: any) => e.text && typeof e.text === 'string')
            .map((e: any) => e.text)
            .join(' ');
          
          if (sectionText.trim()) {
            sections[section.id] = sectionText;
          }
        });
      });
      
      setProgress(50);
      
      // Construire la partie des options du prompt
      let optionsPrompt = '';
      
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
      
      // Créer le prompt pour Claude
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
          "section-0": "contenu optimisé de la section...",
          "section-1": "contenu optimisé de la section...",
          ...
        }
        \`\`\`
      `;
      
      setProgress(60);
      
      // Envoyer la requête à Claude
      const response = await sendMessage(prompt);
      
      setProgress(80);
      
      // Extraire le JSON de la réponse
      let jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/);
      
      if (!jsonMatch) {
        // Essayer de trouver juste un objet JSON sans les backticks
        jsonMatch = response.content.match(/(\{[\s\S]*\})/);
      }
      
      if (!jsonMatch) {
        throw new Error('Format de réponse incorrect');
      }
      
      let jsonContent = jsonMatch[1] || jsonMatch[0];
      
      // Nettoyer le JSON si nécessaire
      jsonContent = jsonContent.trim();
      if (!jsonContent.startsWith('{')) {
        jsonContent = jsonContent.substring(jsonContent.indexOf('{'));
      }
      if (!jsonContent.endsWith('}')) {
        jsonContent = jsonContent.substring(0, jsonContent.lastIndexOf('}') + 1);
      }
      
      // Parser le JSON des sections optimisées
      const optimizedSections = JSON.parse(jsonContent);
      
      // Générer le HTML optimisé
      const optimizedHTML = HTMLRecreator.generateHTML(template, optimizedSections);
      
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
        template: template,
        optimizedSections: optimizedSections
      });
      
      setProgress(100);
      
      // Continuer à l'étape suivante
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (err) {
      console.error('Erreur lors de l\'optimisation du CV:', err);
      setError('Une erreur est survenue lors de l\'optimisation du CV. Veuillez réessayer.');
    } finally {
      setOptimizing(false);
    }
  };
  
  if (!cvData || !jobData) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Données manquantes. Veuillez d'abord télécharger votre CV et une offre d'emploi.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Optimisation de votre CV (avec préservation du format)</h2>
        <p className="text-gray-600 mt-2">
          Nous optimisons votre CV pour augmenter sa pertinence tout en conservant exactement le même format visuel.
        </p>
      </div>
      
      {(loading || optimizing) ? (
        <div className="text-center py-12">
          <LoadingState 
            text="Optimisation de votre CV en cours..." 
            subText="Cela peut prendre quelques instants" 
            progress={progress}
            showProgress={true}
          />
        </div>
      ) : template ? (
        <div className="space-y-6">
          {!optimizedCV ? (
            <>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-medium text-blue-800">Format détecté avec succès</h3>
                <p className="mt-1 text-sm text-blue-700">
                  Nous avons analysé votre CV et sommes prêts à l'optimiser en préservant exactement sa mise en page.
                </p>
                <ul className="mt-2 text-sm text-blue-700">
                  <li>• {template.pages.length} page(s) détectée(s)</li>
                  <li>• {template.pages.reduce((acc: number, page: any) => acc + page.sections.length, 0)} section(s) identifiée(s)</li>
                  <li>• Format: {template.pages[0]?.width}x{template.pages[0]?.height} points</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Options d'optimisation</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="enhanceKeySkills"
                      checked={options.enhanceKeySkills}
                      onChange={() => setOptions(prev => ({ ...prev, enhanceKeySkills: !prev.enhanceKeySkills }))}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <label htmlFor="enhanceKeySkills" className="font-medium text-gray-700">
                        Mettre en avant les compétences clés
                      </label>
                      <p className="text-sm text-gray-500">
                        Accentue les compétences particulièrement pertinentes pour le poste visé.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="adaptToJobDescription"
                      checked={options.adaptToJobDescription}
                      onChange={() => setOptions(prev => ({ ...prev, adaptToJobDescription: !prev.adaptToJobDescription }))}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <label htmlFor="adaptToJobDescription" className="font-medium text-gray-700">
                        Adapter au vocabulaire de l'offre
                      </label>
                      <p className="text-sm text-gray-500">
                        Utilise le même vocabulaire et la même terminologie que l'offre d'emploi.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="useProfessionalLanguage"
                      checked={options.useProfessionalLanguage}
                      onChange={() => setOptions(prev => ({ ...prev, useProfessionalLanguage: !prev.useProfessionalLanguage }))}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <label htmlFor="useProfessionalLanguage" className="font-medium text-gray-700">
                        Langage professionnel
                      </label>
                      <p className="text-sm text-gray-500">
                        Utilise un langage professionnel et des verbes d'action percutants.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="highlightAchievements"
                      checked={options.highlightAchievements}
                      onChange={() => setOptions(prev => ({ ...prev, highlightAchievements: !prev.highlightAchievements }))}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <label htmlFor="highlightAchievements" className="font-medium text-gray-700">
                        Mettre en valeur les réalisations
                      </label>
                      <p className="text-sm text-gray-500">
                        Met l'accent sur les réalisations concrètes et les résultats quantifiables.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Aperçu du CV original */}
              <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b">
                  <h3 className="font-medium">Aperçu du CV original</h3>
                </div>
                <div className="p-0 bg-white h-[400px] overflow-auto">
                  {htmlPreview ? (
                    <iframe 
                      srcDoc={htmlPreview}
                      title="CV Preview"
                      className="w-full h-full border-0"
                      sandbox="allow-same-origin allow-scripts"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <p className="text-gray-500">Chargement de l'aperçu...</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={optimizeCV}
                  disabled={loading || optimizing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading || optimizing ? 'Optimisation en cours...' : 'Optimiser mon CV en préservant le format'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Optimisation terminée !</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Votre CV a été optimisé avec succès! Le contenu a été amélioré tout en préservant exactement votre mise en page d'origine.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b">
                  <h3 className="font-medium">Aperçu du CV optimisé</h3>
                </div>
                <div className="p-0 bg-white h-[500px] overflow-auto">
                  {htmlPreview ? (
                    <iframe 
                      srcDoc={htmlPreview}
                      title="CV Preview"
                      className="w-full h-full border-0"
                      sandbox="allow-same-origin allow-scripts"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <p className="text-gray-500">Chargement de l'aperçu...</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={onComplete}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Continuer à la lettre de motivation
                </button>
                
                <button
                  onClick={optimizeCV}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Réoptimiser mon CV
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <LoadingState text="Analyse du format de votre CV en cours..." />
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
}