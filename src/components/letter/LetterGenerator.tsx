// src/components/letter/LetterGenerator.tsx
import { useState, useEffect } from 'react';
import { useClaudeAPI } from 'amos/lib/api/claude';
import { useStore } from 'amos/store';
import { Loader } from 'amos/components/common/Loader';

// Styles d'écriture disponibles pour les lettres de motivation
const WRITING_STYLES = [
  { id: 'professional', label: 'Professionnel', description: 'Style formel et structuré, adapté à la plupart des entreprises' },
  { id: 'creative', label: 'Créatif', description: 'Style dynamique avec une touche personnelle, pour les secteurs créatifs' },
  { id: 'technical', label: 'Technique', description: 'Axé sur les compétences techniques, idéal pour les postes spécialisés' },
  { id: 'enthusiastic', label: 'Enthousiaste', description: 'Ton passionné et énergique, pour démontrer votre motivation' },
  { id: 'concise', label: 'Concis', description: 'Style direct et efficace, pour les recruteurs pressés' }
];

interface LetterGeneratorProps {
  onComplete: () => void;
}

export function LetterGenerator({ onComplete }: LetterGeneratorProps) {
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customizations, setCustomizations] = useState({
    includeIntroduction: true,
    includeExperience: true,
    includeSkills: true,
    includeMotivation: true,
    includeAvailability: true,
    requestInterview: true
  });
  
  const { sendMessage, loading } = useClaudeAPI({
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
  2
  const { 
    originalContent: cvData,
    optimizedContent: optimizedCV
  } = useStore((state) => state.cv);
  
  const { 
    content: jobData,
    companyName,
    jobTitle
  } = useStore((state) => state.job);
  
  const { 
    setLetterContent,
    content: existingLetter
  } = useStore((state) => state.letter);
  
  // Génération automatique d'une première lettre
  useEffect(() => {
    if (!existingLetter && cvData && jobData && optimizedCV && !generating) {
      generateLetter();
    }
  }, [existingLetter, cvData, jobData, optimizedCV, generating]);
  
  // Gestion des changements dans les personnalisations
  const handleCustomizationChange = (key: keyof typeof customizations) => {
    setCustomizations(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Fonction de génération de la lettre
  const generateLetter = async () => {
    if (!cvData || !jobData) {
      setError('Données manquantes. Veuillez d\'abord télécharger votre CV et une offre d\'emploi.');
      return;
    }
    
    setGenerating(true);
    setError(null);
    
    try {
      // Préparer les sections à inclure
      const sections = [];
      if (customizations.includeIntroduction) sections.push('introduction présentant brièvement le candidat et son intérêt pour le poste');
      if (customizations.includeExperience) sections.push('paragraphe sur les expériences pertinentes en lien avec le poste');
      if (customizations.includeSkills) sections.push('paragraphe sur les compétences techniques et soft skills correspondant aux besoins');
      if (customizations.includeMotivation) sections.push('paragraphe expliquant la motivation pour rejoindre cette entreprise spécifique');
      if (customizations.includeAvailability) sections.push('mention de la disponibilité');
      if (customizations.requestInterview) sections.push('demande d\'entretien');
      
      // Définir le style d'écriture
      const styleDescriptions = {
        professional: 'formel, structuré et respectueux des conventions professionnelles',
        creative: 'dynamique, personnel tout en restant professionnel, avec une touche d\'originalité',
        technical: 'précis, orienté compétences techniques, utilisant une terminologie spécifique au secteur',
        enthusiastic: 'passionné, énergique, montrant un fort intérêt pour l\'entreprise et le poste',
        concise: 'direct, efficace, allant droit au but sans détails superflus'
      };
      
      // Créer le prompt pour Claude
      const prompt = `
        # CV DU CANDIDAT
        ${optimizedCV ? optimizedCV.text : cvData.text}
        
        # OFFRE D'EMPLOI
        ${jobData.text}
        
        # INFORMATIONS COMPLÉMENTAIRES
        - Nom de l'entreprise: ${companyName || 'Non spécifié'}
        - Titre du poste: ${jobTitle || 'Non spécifié'}
        
        # STYLE DE RÉDACTION
        ${styleDescriptions[selectedStyle as keyof typeof styleDescriptions]}
        
        # SECTIONS À INCLURE
        ${sections.join(', ')}
        
        # INSTRUCTIONS
        Rédige une lettre de motivation personnalisée pour cette offre d'emploi spécifique, en utilisant uniquement les informations fournies dans le CV. 
        La lettre doit être professionnelle, sans erreurs, et adaptée aux conventions du pays d'origine de l'offre.
        Ne pas inventer d'informations qui ne sont pas dans le CV.
        
        Produis uniquement le texte de la lettre de motivation, sans formule d'appel ni signature.
      `;
      
      // Envoyer la requête à Claude
      const response = await sendMessage(prompt);
      
      // Mettre à jour le store avec la lettre générée
      setLetterContent({
        content: response.content,
        style: selectedStyle,
        generationDate: new Date(),
        customizations,
        tokenUsage: response.tokenUsage
      });
      
      // Rester sur la même page pour permettre des ajustements
    } catch (err) {
      console.error('Erreur lors de la génération de la lettre:', err);
      setError('Une erreur est survenue lors de la génération de la lettre. Veuillez réessayer.');
    } finally {
      setGenerating(false);
    }
  };
  
  if (!cvData || !jobData || !optimizedCV) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Données manquantes. Veuillez d'abord télécharger votre CV et une offre d'emploi, puis optimiser votre CV.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Générateur de lettre de motivation</h2>
        <p className="text-gray-600 mt-2">
          Créez une lettre de motivation personnalisée pour accompagner votre CV optimisé
        </p>
      </div>
      
      {(loading || generating) && !existingLetter ? (
        <div className="text-center py-12">
          <Loader text="Génération de votre lettre en cours... Cela peut prendre quelques instants." />
        </div>
      ) : (
        <div className="space-y-6">
          {existingLetter && (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
                <h3 className="font-medium">Lettre de motivation</h3>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Style: {WRITING_STYLES.find(style => style.id === existingLetter.style)?.label || 'Personnalisé'}
                </span>
              </div>
              <div className="p-6 whitespace-pre-line">
                {existingLetter.content}
              </div>
            </div>
          )}
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-3">Style d'écriture</h3>
                <div className="space-y-2">
                  {WRITING_STYLES.map(style => (
                    <div key={style.id} className="flex items-start">
                      <input
                        type="radio"
                        id={`style-${style.id}`}
                        name="writing-style"
                        value={style.id}
                        checked={selectedStyle === style.id}
                        onChange={() => setSelectedStyle(style.id)}
                        className="mt-1 mr-2"
                      />
                      <label htmlFor={`style-${style.id}`} className="text-sm">
                        <span className="font-medium">{style.label}</span>
                        <p className="text-gray-500 text-xs mt-0.5">{style.description}</p>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium mb-3">Sections à inclure</h3>
                <div className="space-y-2">
                  {Object.entries(customizations).map(([key, value]) => (
                    <div key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`section-${key}`}
                        checked={value}
                        onChange={() => handleCustomizationChange(key as keyof typeof customizations)}
                        className="mr-2"
                      />
                      <label htmlFor={`section-${key}`} className="text-sm">
                        {key === 'includeIntroduction' && 'Introduction'}
                        {key === 'includeExperience' && 'Expériences'}
                        {key === 'includeSkills' && 'Compétences'}
                        {key === 'includeMotivation' && 'Motivation'}
                        {key === 'includeAvailability' && 'Disponibilité'}
                        {key === 'requestInterview' && 'Demande d\'entretien'}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2">
              {existingLetter ? (
                <div className="bg-gray-50 p-4 rounded-md space-y-4">
                  <h3 className="font-medium">Modifier votre lettre</h3>
                  <p className="text-sm text-gray-600">
                    Vous pouvez régénérer votre lettre de motivation en modifiant le style d'écriture ou les sections à inclure, puis en cliquant sur le bouton ci-dessous.
                  </p>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={generateLetter}
                      disabled={loading || generating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {loading || generating ? 'Génération...' : 'Régénérer la lettre'}
                    </button>
                    
                    <button
                      onClick={onComplete}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Continuer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 p-6 rounded-md">
                  <h3 className="font-medium text-blue-800 mb-3">Conseils pour une lettre efficace</h3>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li>• Personnalisez votre lettre pour chaque entreprise</li>
                    <li>• Mettez en avant les compétences pertinentes pour le poste</li>
                    <li>• Expliquez pourquoi vous êtes intéressé par cette entreprise spécifique</li>
                    <li>• Soyez concis et direct (une page maximum)</li>
                    <li>• Relisez attentivement avant d'envoyer</li>
                  </ul>
                </div>
              )}
            </div>
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