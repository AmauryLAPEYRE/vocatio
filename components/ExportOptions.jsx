// components/ExportOptions.jsx
'use client';

import { useState } from 'react';
import { 
  DocumentArrowDownIcon, 
  ArrowLeftIcon, 
  DocumentDuplicateIcon, 
  EnvelopeIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function ExportOptions({ onExport, onBack }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [coverLetterEnabled, setCoverLetterEnabled] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  
  // Gérer l'exportation
  const handleExport = async (format) => {
    if (isExporting) return;
    
    setExportFormat(format);
    setIsExporting(true);
    setExportComplete(false);
    
    try {
      await onExport(format);
      setExportComplete(true);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Gérer la bascule de la lettre de motivation
  const toggleCoverLetter = () => {
    setCoverLetterEnabled(!coverLetterEnabled);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">Options d'exportation</h2>
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          <span className="text-sm">Retour</span>
        </button>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option PDF */}
          <div 
            className={`border rounded-lg p-6 transition-colors ${
              exportFormat === 'pdf' 
                ? 'border-primary-500 bg-primary-50' 
                : 'hover:border-gray-400 cursor-pointer'
            }`}
            onClick={() => setExportFormat('pdf')}
          >
            <div className="flex items-center space-x-4">
              <DocumentArrowDownIcon className="h-10 w-10 text-primary-600" />
              <div>
                <h3 className="font-medium text-lg">PDF haute-fidélité</h3>
                <p className="text-gray-500">Format prêt à être envoyé aux recruteurs</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                Fidélité parfaite à l'original
              </li>
              <li className="flex items-center">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                Compatible avec tous les lecteurs PDF
              </li>
              <li className="flex items-center">
                <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                Conservation des polices et mises en forme
              </li>
            </ul>
            <button 
              className={`mt-4 w-full py-2 rounded-md flex items-center justify-center ${
                isExporting && exportFormat === 'pdf'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : exportComplete && exportFormat === 'pdf'
                  ? 'bg-green-600 text-white'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (!isExporting && !exportComplete) {
                  handleExport('pdf');
                }
              }}
              disabled={isExporting}
            >
              {isExporting && exportFormat === 'pdf' ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Export en cours...
                </>
              ) : exportComplete && exportFormat === 'pdf' ? (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  PDF téléchargé
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Exporter en PDF
                </>
              )}
            </button>
          </div>
          
          {/* Option DOCX (désactivé pour l'exemple) */}
          <div className="border rounded-lg p-6 opacity-50 cursor-not-allowed">
            <div className="flex items-center space-x-4">
              <DocumentDuplicateIcon className="h-10 w-10 text-gray-500" />
              <div>
                <h3 className="font-medium text-lg">Document Word (DOCX)</h3>
                <p className="text-gray-500">Format éditable (bientôt disponible)</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Modifiable dans Microsoft Word
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approximation de la mise en forme originale
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Possibilité de modifications ultérieures
              </li>
            </ul>
            <button 
              className="mt-4 w-full py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
              disabled
            >
              Bientôt disponible
            </button>
          </div>
        </div>
        
        {/* Option lettre de motivation */}
        <div className="mt-8 border rounded-lg p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <EnvelopeIcon className="h-8 w-8 text-indigo-600" />
              <div>
                <h3 className="font-medium text-lg">Générer une lettre de motivation assortie</h3>
                <p className="text-gray-500">Créer une lettre de motivation parfaitement adaptée à l'offre d'emploi</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-1 rounded">PREMIUM</span>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox"
                  checked={coverLetterEnabled}
                  onChange={toggleCoverLetter}
                  className="sr-only peer"
                  disabled
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 opacity-50"></div>
              </label>
            </div>
          </div>
          
          {coverLetterEnabled && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
              <p className="text-indigo-700 text-sm">
                Cette fonctionnalité sera disponible prochainement.
              </p>
            </div>
          )}
        </div>
        
        {/* Options additionnelles */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center opacity-50 cursor-not-allowed">
            <svg className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h4 className="font-medium text-gray-900">Enregistrer comme modèle</h4>
            <p className="text-xs text-gray-500 mt-1">Bientôt disponible</p>
          </div>
          
          <div className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center opacity-50 cursor-not-allowed">
            <svg className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h4 className="font-medium text-gray-900">Envoyer par email</h4>
            <p className="text-xs text-gray-500 mt-1">Bientôt disponible</p>
          </div>
          
          <div className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-center opacity-50 cursor-not-allowed">
            <svg className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <h4 className="font-medium text-gray-900">Partager le CV</h4>
            <p className="text-xs text-gray-500 mt-1">Bientôt disponible</p>
          </div>
        </div>
      </div>
    </div>
  );
}