// src/components/job/JobUploader.tsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useClaudeAPI } from 'src/lib/api/claude';
import { useStore } from 'src/store';
import { Loader } from 'src/components/common/Loader';
import { processDocument } from 'src/lib/document-processing/document-processor';

interface JobUploaderProps {
  onComplete: () => void;
}

export function JobUploader({ onComplete }: JobUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobText, setJobText] = useState('');
  const [manualEntry, setManualEntry] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    jobLocation: ''
  });
  
  const { sendMessage } = useClaudeAPI({
    temperature: 0.1,
    systemPrompt: `
      Tu es un expert en analyse d'offres d'emploi.
      Ta tâche est d'extraire les informations clés d'une offre d'emploi, notamment :
      
      1. Le titre du poste
      2. Le nom de l'entreprise
      3. La localisation du poste
      4. Les compétences requises
      5. Les qualifications/exigences
      
      Ton analyse doit être précise et extraire uniquement les informations explicitement mentionnées.
    `
  });
  
  const setJobData = useStore((state) => state.job.setJobData);
  const setJobSkills = useStore((state) => state.job.setJobSkills);
  const setJobRequirements = useStore((state) => state.job.setJobRequirements);
  
  // Gestionnaire pour l'import de fichier
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setLoading(true);
    setError(null);
    
    try {
      // Traiter le document
      const documentInfo = await processDocument(file);
      
      // Mettre à jour le texte pour l'analyse
      setJobText(documentInfo.text);
      
      // Analyser le contenu de l'offre
      await analyzeJobContent(documentInfo.text);
    } catch (err) {
      console.error('Erreur lors du traitement de l\'offre d\'emploi:', err);
      setError('Une erreur est survenue lors de l\'analyse du document. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Configuration de dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: loading || manualEntry
  });
  
  // Analyser le contenu de l'offre d'emploi avec Claude
  const analyzeJobContent = async (text: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Créer le prompt pour Claude
      const prompt = `
        # OFFRE D'EMPLOI
        ${text}
        
        # INSTRUCTIONS
        Analyse cette offre d'emploi et extrait les informations suivantes au format JSON:
        
        \`\`\`json
        {
          "companyName": "Nom de l'entreprise",
          "jobTitle": "Titre du poste",
          "jobLocation": "Localisation",
          "skills": ["compétence1", "compétence2", ...],
          "requirements": ["exigence1", "exigence2", ...]
        }
        \`\`\`
        
        Règles:
        1. Si une information n'est pas disponible, utilise null
        2. Pour les compétences, extrais tous les savoir-faire techniques et soft skills mentionnés
        3. Pour les exigences, inclus les qualifications, expérience et diplômes requis
        4. Ne retourne que le JSON, sans explications ni commentaires additionnels
      `;
      
      // Envoyer la requête à Claude
      const response = await sendMessage(prompt);
      
      // Extraire le JSON de la réponse
      const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         response.content.match(/\{[\s\S]*\}/);
                         
      if (!jsonMatch) {
        throw new Error('Format de réponse incorrect');
      }
      
      // Parser le JSON
      const jobInfo = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
      // Mettre à jour le store
      setJobData({
        content: {
          text,
          metadata: {}
        },
        companyName: jobInfo.companyName,
        jobTitle: jobInfo.jobTitle,
        jobLocation: jobInfo.jobLocation,
        uploadDate: new Date()
      });
      
      // Mettre à jour les compétences et exigences
      if (jobInfo.skills && Array.isArray(jobInfo.skills)) {
        setJobSkills(jobInfo.skills);
      }
      
      if (jobInfo.requirements && Array.isArray(jobInfo.requirements)) {
        setJobRequirements(jobInfo.requirements);
      }
      
      // Mettre à jour le formulaire
      setFormData({
        companyName: jobInfo.companyName || '',
        jobTitle: jobInfo.jobTitle || '',
        jobLocation: jobInfo.jobLocation || ''
      });
      
      // Passer à l'étape suivante
      onComplete();
    } catch (err) {
      console.error('Erreur lors de l\'analyse de l\'offre:', err);
      setError('Une erreur est survenue lors de l\'analyse de l\'offre. Veuillez vérifier et compléter les informations manuellement.');
      
      // En cas d'erreur, on garde quand même le texte pour permettre l'édition manuelle
      setJobData({
        content: {
          text,
          metadata: {}
        },
        uploadDate: new Date()
      });
      
      // Basculer en mode d'entrée manuelle
      setManualEntry(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Gestionnaire pour l'entrée manuelle
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobText.trim()) {
      setError('Veuillez saisir le contenu de l\'offre d\'emploi.');
      return;
    }
    
    // Analyser le contenu saisi manuellement
    await analyzeJobContent(jobText);
  };
  
  // Gestionnaire de changement dans le formulaire
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'jobText') {
      setJobText(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Finaliser l'entrée manuelle
  const completeManualEntry = () => {
    // Mettre à jour le store avec les données du formulaire
    setJobData({
      content: {
        text: jobText,
        metadata: {}
      },
      companyName: formData.companyName,
      jobTitle: formData.jobTitle,
      jobLocation: formData.jobLocation,
      uploadDate: new Date()
    });
    
    // Passer à l'étape suivante
    onComplete();
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Importer l'offre d'emploi</h2>
        <p className="text-gray-600 mt-2">
          Téléchargez ou saisissez l'offre d'emploi pour laquelle vous souhaitez postuler
        </p>
      </div>
      
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setManualEntry(false)}
          className={`px-4 py-2 rounded-md ${
            !manualEntry 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Importer un fichier
        </button>
        <button
          onClick={() => setManualEntry(true)}
          className={`px-4 py-2 rounded-md ${
            manualEntry 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Saisir manuellement
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <Loader text="Analyse de l'offre d'emploi en cours... Cela peut prendre quelques instants." />
        </div>
      ) : manualEntry ? (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label htmlFor="jobText" className="block text-sm font-medium text-gray-700 mb-1">
              Contenu de l'offre d'emploi
            </label>
            <textarea
              id="jobText"
              name="jobText"
              value={jobText}
              onChange={handleFormChange}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Copiez-collez ici le texte complet de l'offre d'emploi..."
              required
            />
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Titre du poste
              </label>
              <input
                type="text"
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="ex: Développeur Frontend"
              />
            </div>
            
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l'entreprise
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="ex: Entreprise ABC"
              />
            </div>
            
            <div>
              <label htmlFor="jobLocation" className="block text-sm font-medium text-gray-700 mb-1">
                Localisation
              </label>
              <input
                type="text"
                id="jobLocation"
                name="jobLocation"
                value={formData.jobLocation}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="ex: Paris, France"
              />
            </div>
          </div>
          
          <div className="flex justify-between pt-4">
            {jobText.trim() ? (
              <button
                type="button"
                onClick={completeManualEntry}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Continuer
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Analyser
              </button>
            )}
          </div>
        </form>
      ) : (
        <>
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
          >
            <input {...getInputProps()} />
            
            <svg 
              className="mx-auto h-12 w-12 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            
            <p className="mt-4 text-sm text-gray-600">
              {isDragActive
                ? "Déposez l'offre d'emploi ici..."
                : "Glissez-déposez l'offre d'emploi ici, ou cliquez pour sélectionner un fichier"}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Formats acceptés: PDF, DOCX, TXT
            </p>
          </div>
          
          <div className="text-center">
            <span className="text-sm text-gray-500">ou</span>
          </div>
          
          <div className="text-center">
            <button
              onClick={() => setManualEntry(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Copiez-collez le texte de l'offre d'emploi
            </button>
          </div>
        </>
      )}
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="bg-blue-50 p-4 rounded-md">
        <h3 className="font-medium text-blue-800">Conseils pour l'importation de l'offre</h3>
        <ul className="mt-2 text-sm text-blue-700 space-y-1">
          <li>• Importez l'offre complète pour une meilleure analyse</li>
          <li>• Incluez toutes les sections (description, exigences, avantages)</li>
          <li>• Vérifiez que les informations extraites sont correctes</li>
          <li>• Si nécessaire, complétez ou corrigez les informations manuellement</li>
        </ul>
      </div>
    </div>
  );
}