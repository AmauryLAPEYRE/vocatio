// src/components/cv/HTMLBasedCVOptimizer.tsx
import { useState, useEffect } from 'react';
import { useClaudeAPI } from 'src/lib/api/claude';
import { useStore, useCVStore } from 'src/store';
import { Loader } from 'src/components/common/Loader';
import { HTMLRecreator } from 'src/lib/document-processing/html-recreator';

interface HTMLBasedCVOptimizerProps {
  onComplete: () => void;
}

export function HTMLBasedCVOptimizer({ onComplete }: HTMLBasedCVOptimizerProps) {
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<any>(null);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  
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
  
  // Utiliser useStore pour les données en lecture seule
  const { 
    originalContent: cvData, 
    optimizedContent: optimizedCV,
  } = useStore((state) => state.cv);
  
  const setOptimizedCV = useCVStore((state) => state.setOptimizedCV);
  
  const { 
    content: jobData, 
    skills: jobSkills 
  } = useStore((state) => state.job);
  
  const { analysis } = useStore((state) => state.matching);
  
  // Analyser le CV original pour créer le template HTML
  useEffect(() => {
    async function analyzeOriginalCV() {
      if (!cvData || !('originalArrayBuffer' in cvData) || !cvData.originalArrayBuffer) {
        return;
      }
      
      try {
        console.log('Analyse du CV original pour recréation HTML');
        setError(null);
        
        // Récupérer l'ArrayBuffer du PDF original
        const arrayBuffer = cvData.originalArrayBuffer;
        
        // Analyser le PDF pour créer le template
        const extractedTemplate = await HTMLRecreator.analyzePDF(arrayBuffer);
        setTemplate(extractedTemplate);
        
        // Générer un aperçu HTML sans optimisation
        const html = HTMLRecreator.generateHTML(extractedTemplate);
        setHtmlPreview(html);
        
        console.log('Template et aperçu HTML créés avec succès');
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
    
    try {
      // Extraire les sections du template pour les envoyer à Claude
      const sections: Record<string, string> = {};
      
      // Collecter les sections de toutes les pages
      template.pages.forEach((page: any, pageIndex: number) => {
        page.sections.forEach((section: any) => {
          // Extraire le texte de la section
          const sectionText = section.elements.map((e: any) => e.text).join(' ');
          sections[section.id] = sectionText;
        });
      });
      
      // Créer le prompt pour Claude en incluant chaque section
      let prompt = `
        # OFFRE D'EMPLOI
        ${jobData.text}
        
        # ANALYSE DE CORRESPONDANCE
        ${analysis}
        
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
      
      // Envoyer la requête à Claude
      const response = await sendMessage(prompt);
      
      // Extraire le JSON de la réponse
      const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         response.content.match(/\{[\s\S]*\}/);
                         
      if (!jsonMatch) {
        throw new Error('Format de réponse incorrect');
      }
      
      // Parser le JSON des sections optimisées
      const optimizedSections = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
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
        formattedHTML: optimizedHTML, // Stocke la version HTML complète
        template: template, // Stocke le template pour l'export
        optimizedSections: optimizedSections // Stocke les sections optimisées
      });
      
      // Passer à l'étape suivante
      onComplete();
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
          <Loader text="Optimisation de votre CV en cours... Cela peut prendre quelques instants." />
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
                  <li>• {template.fonts.length} police(s) utilisée(s)</li>
                  <li>• Format: {template.pages[0]?.width}x{template.pages[0]?.height} points</li>
                </ul>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={optimizeCV}
                  disabled={loading || optimizing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  Optimiser mon CV en préservant le format
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-medium text-green-800">Optimisation terminée</h3>
                <p className="mt-1 text-sm text-green-700">
                  Votre CV a été optimisé avec succès tout en préservant exactement sa mise en page originale.
                </p>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={onComplete}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Continuer
                </button>
              </div>
            </>
          )}
          
          {/* Aperçu du CV dans un iframe */}
          {htmlPreview && (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 border-b">
                <h3 className="font-medium">Aperçu du CV {optimizedCV ? 'optimisé' : 'original'}</h3>
              </div>
              <div className="p-4">
                <iframe
                  srcDoc={htmlPreview}
                  title="Aperçu du CV"
                  className="w-full border h-[700px]"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Loader text="Analyse du format de votre CV en cours..." />
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