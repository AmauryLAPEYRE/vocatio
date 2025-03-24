// components/DocumentComparison.jsx
'use client';

import { useState, useEffect } from 'react';
import { useVocatioStore } from '@/store';
import { 
  ArrowsRightLeftIcon, 
  DocumentDuplicateIcon, 
  ArrowLeftIcon, 
  DocumentArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

import DocumentPreview from './DocumentPreview';

export default function DocumentComparison({ onExport, onBack }) {
  const { originalDocument, optimizedDocument } = useVocatioStore();
  const [viewMode, setViewMode] = useState('sideBySide'); // 'sideBySide' | 'diff' | 'optimized'
  const [highlightChanges, setHighlightChanges] = useState(true);
  const [originalUrl, setOriginalUrl] = useState('');
  
  // Créer une URL pour le document original
  useEffect(() => {
    if (originalDocument) {
      const url = URL.createObjectURL(originalDocument);
      setOriginalUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [originalDocument]);
  
  if (!optimizedDocument || !originalDocument) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <p className="text-gray-500">Document non disponible</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">Comparaison et prévisualisation</h2>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setViewMode('sideBySide')}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === 'sideBySide' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="hidden md:inline">Côte à côte</span>
            <span className="inline md:hidden">2 vues</span>
          </button>
          
          <button
            onClick={() => setViewMode('diff')}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === 'diff' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="hidden md:inline">Différences</span>
            <span className="inline md:hidden">Diff</span>
          </button>
          
          <button
            onClick={() => setViewMode('optimized')}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === 'optimized' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="hidden md:inline">Optimisé</span>
            <span className="inline md:hidden">Final</span>
          </button>
        </div>
      </div>
      
      <div className="p-6">
        {viewMode === 'sideBySide' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="border-b pb-2 mb-4">
                <h3 className="font-medium text-gray-700">CV Original</h3>
              </div>
              <div className="border rounded-lg overflow-hidden bg-gray-50" style={{ height: '600px' }}>
                {/* Intégration du PDF original */}
                <iframe
                  src={originalUrl}
                  className="w-full h-full"
                  title="CV Original"
                />
              </div>
            </div>
            
            <div>
              <div className="border-b pb-2 mb-4 flex justify-between">
                <h3 className="font-medium text-gray-700">CV Optimisé</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="highlight-changes"
                    checked={highlightChanges}
                    onChange={() => setHighlightChanges(!highlightChanges)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="highlight-changes" className="ml-2 text-sm text-gray-600">
                    Surligner les changements
                  </label>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '600px' }}>
                {/* Rendu du document optimisé */}
                <DocumentPreview 
                  documentStructure={optimizedDocument} 
                  highlightChanges={highlightChanges}
                />
              </div>
            </div>
          </div>
        )}
        
        {viewMode === 'diff' && (
          <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '600px' }}>
            {/* Vue des différences */}
            <DocumentPreview 
              documentStructure={optimizedDocument}
              highlightChanges={true}
              diffMode={true}
              originalDocument={originalDocument}
            />
          </div>
        )}
        
        {viewMode === 'optimized' && (
          <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '600px' }}>
            {/* Vue plein écran du document optimisé */}
            <DocumentPreview 
              documentStructure={optimizedDocument} 
              highlightChanges={false}
              fullScreen={true}
            />
          </div>
        )}
      </div>
      
      <div className="p-4 border-t bg-gray-50 flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Retour
        </button>
        
        <div className="space-x-3">
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            Voir original
          </a>
          
          <button
            onClick={onExport}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 flex items-center"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Exporter le CV optimisé
          </button>
        </div>
      </div>
    </div>
  );
}