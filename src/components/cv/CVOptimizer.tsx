// src/components/cv/CVOptimizer.tsx
import { useState, useEffect } from 'react';
import { useClaudeAPI } from 'src/lib/api/claude';
import { useStore } from 'src/store';
import { Loader } from 'src/components/common/Loader';
import { CVPreview } from './CVPreview';

interface CVOptimizerProps {
  onComplete: () => void;
}

export function CVOptimizer({ onComplete }: CVOptimizerProps) {
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizationStarted, setOptimizationStarted] = useState(false);
  
  const { sendMessage, loading } = useClaudeAPI({
    temperature: 0.3,
    systemPrompt: `
      Tu es un expert en optimisation de CV pour des candidatures professionnelles.
      Ta tâche est d'analyser un CV et une offre d'emploi, puis de proposer une 
      version optimisée du CV qui met en valeur les compétences et expériences 
      pertinentes pour le poste.
      
      RÈGLES IMPORTANTES:
      1. Ne jamais inventer ou falsifier des informations - utilise uniquement les éléments présents dans le CV original
      2. Conserver la même structure générale que le CV original
      3. Se concentrer sur les correspondances entre les compétences du candidat et les exigences du poste
      4. Reformuler les descriptions pour mettre en avant les réalisations pertinentes
      5. Utiliser des mots-clés de l'offre d'emploi lorsque c'est pertinent et honnête
      
      Ta réponse doit contenir uniquement le texte optimisé du CV, pas d'explications supplémentaires.
    `
  });
  
  const { 
    originalContent: cvData, 
    optimizedContent: optimizedCV,
    setOptimizedCV 
  } = useStore((state) => state.cv);
  
  const { 
    content: jobData, 
    skills: jobSkills 
  } = useStore((state) => state.job);
  
  const { 
    matchingScore,
    analysis 
  } = useStore((state) => state.matching);
  
  // Optimiser le CV automatiquement au chargement du composant
  useEffect(() => {
    if (!optimizationStarted && cvData && jobData && analysis && !optimizedCV) {
      optimizeCV();
    }
  }, [cvData, jobData, analysis, optimizedCV, optimizationStarted]);
  
  // Fonction d'optimisation du CV
  const optimizeCV = async () => {
    if (!cvData || !jobData || !analysis) {
      setError('Données manquantes. Veuillez d\'abord télécharger votre CV et une offre d\'emploi.');
      return;
    }
    
    setOptimizing(true);
    setOptimizationStarted(true);
    setError(null);
    
    try {
      // Créer le prompt pour Claude
      const prompt = `
        # CV ORIGINAL
        ${cvData.text}
        
        # OFFRE D'EMPLOI
        ${jobData.text}
        
        # ANALYSE DE CORRESPONDANCE
        ${analysis}
        
        # INSTRUCTIONS
        Optimise ce CV pour cette offre d'emploi spécifique en suivant les règles suivantes:
        1. Préserve EXACTEMENT la même structure et les sections que le CV original
        2. Ne modifie que les descriptions et les formulations pour mieux correspondre à l'offre
        3. Conserve toutes les dates, titres de postes et noms d'entreprises tels quels
        4. N'invente JAMAIS de nouvelles expériences ou compétences
        5. Utilise les mots-clés pertinents de l'offre d'emploi
        6. Mets en avant les réalisations qui correspondent aux besoins exprimés dans l'offre
        
        Retourne le CV optimisé complet, en conservant sa structure originale.
      `;
      
      // Envoyer la requête à Claude
      const response = await sendMessage(prompt);
      
      // Mettre à jour le store avec le CV optimisé
      setOptimizedCV({
        text: response.content,
        originalFormat: 'text', // Pour l'instant, on retourne en format texte
        optimizationDate: new Date(),
        tokenUsage: response.tokenUsage
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
        <h2 className="text-2xl font-bold text-gray-800">Optimisation de votre CV</h2>
        <p className="text-gray-600 mt-2">
          Nous optimisons votre CV pour augmenter sa pertinence par rapport à l'offre d'emploi
        </p>
      </div>
      
      {(loading || optimizing) ? (
        <div className="text-center py-12">
          <Loader text="Optimisation de votre CV en cours... Cela peut prendre quelques instants." />
        </div>
      ) : optimizedCV ? (
        <div className="space-y-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-medium text-green-800">Optimisation terminée</h3>
            <p className="mt-1 text-sm text-green-700">
              Votre CV a été optimisé avec succès pour correspondre à l'offre d'emploi.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">CV Original</h3>
              <CVPreview />
            </div>
            <div>
              <h3 className="font-medium mb-2">CV Optimisé</h3>
              <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b">
                  <h3 className="font-medium">Aperçu du CV optimisé</h3>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto whitespace-pre-line">
                  {optimizedCV.text}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={onComplete}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Continuer
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-medium text-blue-800">Comment fonctionne l'optimisation?</h3>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>• Analyse de votre CV et de l'offre d'emploi</li>
              <li>• Identification des compétences et expériences pertinentes</li>
              <li>• Reformulation pour mettre en valeur les correspondances</li>
              <li>• Conservation de la structure et du format original</li>
              <li>• Aucune invention de compétences ou d'expériences</li>
            </ul>
          </div>
          
          {matchingScore && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="font-medium text-yellow-800">Score de correspondance actuel</h3>
              <div className="mt-2 flex items-center">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${matchingScore}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">{matchingScore}%</span>
              </div>
            </div>
          )}
          
          <div className="flex justify-center">
            <button
              onClick={optimizeCV}
              disabled={loading || optimizing}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading || optimizing ? 'Optimisation en cours...' : 'Optimiser mon CV'}
            </button>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}