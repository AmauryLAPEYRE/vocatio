// src/components/matcher/MatchAnalysis.tsx
import { useState, useEffect } from 'react';
import { useClaudeAPI } from 'src/lib/api/claude';
import { useStore, useMatchingStore } from 'src/store';
import { Loader } from 'src/components/common/Loader';
import { SkillBadge } from 'src/components/common/SkillBadge';

interface MatchAnalysisProps {
  onComplete: () => void;
}

export function MatchAnalysis({ onComplete }: MatchAnalysisProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  
  const { sendMessage, loading } = useClaudeAPI({
    temperature: 0.2,
    systemPrompt: `
      Tu es un expert en analyse de CV et d'offres d'emploi. 
      Ta tâche est d'analyser un CV et une offre d'emploi pour déterminer :
      
      1. Le score de correspondance global (en pourcentage)
      2. Les compétences du candidat qui correspondent aux exigences du poste
      3. Les compétences requises par le poste qui ne sont pas présentes dans le CV
      4. Des recommandations spécifiques pour améliorer le CV
      
      Ton analyse doit être objective, précise et constructive.
      Utilise uniquement les informations fournies dans le CV et l'offre d'emploi.
    `
  });
  
  // Extraire à la fois le contenu du CV et le nom du fichier
  const { 
    originalContent: cvData,
    fileName: cvFileName
  } = useStore((state) => state.cv);
  
  const { 
    content: jobData,
    companyName,
    jobTitle
  } = useStore((state) => state.job);
  
  // Utiliser useStore pour les données en lecture seule
  const {
    analyzed,
    matchingScore,
    analysis,
    matchedSkills,
  } = useStore((state) => state.matching);
  
  // Utiliser useMatchingStore pour les actions
  const setMatchingData = useMatchingStore((state) => state.setMatchingData);
  
  // Lancer l'analyse automatiquement au chargement du composant
  useEffect(() => {
    if (!analysisStarted && cvData && jobData && !analyzed) {
      analyzeMatch();
    }
  }, [cvData, jobData, analyzed, analysisStarted]);
  
  // Fonction d'analyse de correspondance
  const analyzeMatch = async () => {
    if (!cvData || !jobData) {
      setError('Données manquantes. Veuillez d\'abord télécharger votre CV et une offre d\'emploi.');
      return;
    }
    
    setAnalyzing(true);
    setAnalysisStarted(true);
    setError(null);
    
    try {
      // Créer le prompt pour Claude
      const prompt = `
        # CV
        ${cvData.text}
        
        # OFFRE D'EMPLOI
        ${jobData.text}
        
        # INSTRUCTIONS
        Analyse la correspondance entre ce CV et cette offre d'emploi en suivant ces étapes:
        
        1. Identifie les compétences et qualifications requises dans l'offre d'emploi.
        2. Identifie les compétences et expériences mentionnées dans le CV.
        3. Détermine quelles compétences correspondent entre les deux.
        4. Calcule un score de correspondance global (pourcentage).
        5. Présente ton analyse comme suit:
        
        ## Aperçu (résumé en 2-3 phrases)
        
        ## Score de correspondance
        [Score en pourcentage]
        
        ## Correspondances positives
        - Compétence/Expérience 1 : [brève explication de la correspondance]
        - Compétence/Expérience 2 : [brève explication de la correspondance]
        ...
        
        ## Lacunes identifiées
        - Exigence 1 : [ce qui manque ou pourrait être renforcé]
        - Exigence 2 : [ce qui manque ou pourrait être renforcé]
        ...
        
        ## Recommandations d'optimisation
        - Recommandation 1
        - Recommandation 2
        ...
        
        ## Liste de compétences
        Répertorie toutes les compétences dans ce format JSON:
        \`\`\`json
        [
          {"skill": "Nom de la compétence", "inCV": true/false, "inJob": true/false, "relevant": true/false},
          ...
        ]
        \`\`\`
      `;
      
      // Envoyer la requête à Claude
      const response = await sendMessage(prompt);
      
      // Extraire le score de correspondance
      const scoreMatch = response.content.match(/## Score de correspondance\s*\n\s*(\d+)%/);
      const scoreValue = scoreMatch ? parseInt(scoreMatch[1]) : null;
      
      // Extraire la liste des compétences JSON
      const skillsMatch = response.content.match(/```json\s*\n([\s\S]*?)\n\s*```/);
      let skillsList = null;
      
      if (skillsMatch) {
        try {
          skillsList = JSON.parse(skillsMatch[1]);
        } catch (err) {
          console.error('Erreur lors du parsing JSON des compétences:', err);
        }
      }
      
      // Mettre à jour le store avec les résultats de l'analyse
      setMatchingData({
        analyzed: true,
        matchingScore: scoreValue,
        analysis: response.content,
        matchedSkills: skillsList,
        tokenUsage: response.tokenUsage
      });
      
      // Passer à l'étape suivante
      onComplete();
    } catch (err) {
      console.error('Erreur lors de l\'analyse de correspondance:', err);
      setError('Une erreur est survenue lors de l\'analyse. Veuillez réessayer.');
    } finally {
      setAnalyzing(false);
    }
  };
  
  // Rendu du composant lorsque l'analyse est terminée
  const renderAnalysisResult = () => {
    if (!analysis) return null;
    
    // Diviser l'analyse en sections
    const sections = analysis.split(/##\s+/);
    
    // Fonction pour retirer les caractères de formatation markdown
    const cleanMarkdown = (text: string) => {
      return text.replace(/\*\*/g, '').replace(/`/g, '');
    };
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Résultat de l'analyse</h3>
          
          {/* Score de correspondance */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-700 mb-2">Score de correspondance</h4>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full ${
                    (matchingScore || 0) >= 80 ? 'bg-green-500' : 
                    (matchingScore || 0) >= 60 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                  style={{ width: `${matchingScore || 0}%` }}
                ></div>
              </div>
              <span className="ml-3 font-bold text-lg">{matchingScore || 0}%</span>
            </div>
          </div>
          
          {/* Aperçu général */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-700 mb-2">Aperçu général</h4>
            <p className="text-gray-600">{sections[1]?.trim()}</p>
          </div>
          
          {/* Correspondances positives */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-700 mb-2">Points forts</h4>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              {sections.find(s => s.startsWith('Correspondances positives'))
                ?.split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map((line, index) => (
                  <div key={index} className="mb-2">
                    <p className="text-green-800">{cleanMarkdown(line)}</p>
                  </div>
                ))}
            </div>
          </div>
          
          {/* Lacunes identifiées */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-700 mb-2">Points à améliorer</h4>
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              {sections.find(s => s.startsWith('Lacunes identifiées'))
                ?.split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map((line, index) => (
                  <div key={index} className="mb-2">
                    <p className="text-red-800">{cleanMarkdown(line)}</p>
                  </div>
                ))}
            </div>
          </div>
          
          {/* Recommandations */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-700 mb-2">Recommandations</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              {sections.find(s => s.startsWith('Recommandations'))
                ?.split('\n')
                .filter(line => line.trim().startsWith('-'))
                .map((line, index) => (
                  <div key={index} className="mb-2">
                    <p className="text-blue-800">{cleanMarkdown(line)}</p>
                  </div>
                ))}
            </div>
          </div>
          
          {/* Compétences */}
          {matchedSkills && (
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">Compétences analysées</h4>
              <div className="border border-gray-200 rounded-md p-4">
                <div className="flex flex-wrap gap-2">
                  {matchedSkills.map((skill, index) => (
                    <SkillBadge 
                      key={index}
                      skill={skill.skill}
                      inCV={skill.inCV}
                      inJob={skill.inJob}
                      relevant={skill.relevant}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onComplete}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Continuer à l'optimisation du CV
          </button>
        </div>
      </div>
    );
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
        <h2 className="text-2xl font-bold text-gray-800">Analyse de correspondance</h2>
        <p className="text-gray-600 mt-2">
          Nous analysons la correspondance entre votre CV et l'offre d'emploi
        </p>
      </div>
      
      {(loading || analyzing) && !analysis ? (
        <div className="text-center py-12">
          <Loader text="Analyse de correspondance en cours... Cela peut prendre quelques instants." />
        </div>
      ) : analysis ? (
        renderAnalysisResult()
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800">Comment fonctionne l'analyse?</h3>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>• Extraction des compétences et expériences de votre CV</li>
              <li>• Identification des exigences et qualifications recherchées dans l'offre</li>
              <li>• Évaluation de la correspondance entre votre profil et le poste</li>
              <li>• Génération de recommandations personnalisées</li>
            </ul>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-800 mb-2">CV analysé</h3>
              <p className="text-sm text-gray-600">{cvFileName || 'CV'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {cvData.text.length} caractères • {cvData.text.split(/\s+/).length} mots
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-800 mb-2">Offre d'emploi analysée</h3>
              <p className="text-sm text-gray-600">{jobTitle || 'Poste'}{companyName ? ` chez ${companyName}` : ''}</p>
              <p className="text-xs text-gray-500 mt-1">
                {jobData.text.length} caractères • {jobData.text.split(/\s+/).length} mots
              </p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={analyzeMatch}
              disabled={loading || analyzing}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading || analyzing ? 'Analyse en cours...' : 'Lancer l\'analyse'}
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