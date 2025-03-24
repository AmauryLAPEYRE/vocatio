// components/DocumentPreview.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { renderDocumentToHTML } from '@/lib/document/reconstruction';

export default function DocumentPreview({ 
  documentStructure, 
  highlightChanges = false, 
  diffMode = false,
  fullScreen = false 
}) {
  const containerRef = useRef(null);
  const [isRendering, setIsRendering] = useState(true);
  const [scale, setScale] = useState(1);
  
  // Rendu du document
  useEffect(() => {
    if (!documentStructure || !containerRef.current) return;
    
    setIsRendering(true);
    
    const render = async () => {
      try {
        // Nettoyer le conteneur
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
        
        // Options de rendu
        const renderOptions = {
          highlightChanges,
          diffMode,
          scale
        };
        
        // Rendu du document
        const documentElement = await renderDocumentToHTML(documentStructure, renderOptions);
        
        // Ajout au DOM
        containerRef.current.appendChild(documentElement);
      } catch (error) {
        console.error('Erreur lors du rendu du document:', error);
        
        // Afficher un message d'erreur
        const errorElement = document.createElement('div');
        errorElement.className = 'p-4 text-center text-red-500';
        errorElement.textContent = 'Erreur lors du rendu du document';
        
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
        
        containerRef.current.appendChild(errorElement);
      } finally {
        setIsRendering(false);
      }
    };
    
    render();
  }, [documentStructure, highlightChanges, diffMode, scale]);
  
  // Gestion du zoom
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const handleResetZoom = () => {
    setScale(1);
  };
  
  return (
    <div className="relative h-full flex flex-col">
      {/* Contrôles de zoom */}
      <div className="absolute top-3 right-3 z-10 bg-white rounded-lg shadow-md flex p-1">
        <button
          onClick={handleZoomOut}
          className="p-1 text-gray-500 hover:text-gray-700"
          title="Zoom arrière"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        
        <div className="px-2 flex items-center text-sm text-gray-600">
          {Math.round(scale * 100)}%
        </div>
        
        <button
          onClick={handleZoomIn}
          className="p-1 text-gray-500 hover:text-gray-700"
          title="Zoom avant"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        
        <button
          onClick={handleResetZoom}
          className="p-1 ml-1 text-gray-500 hover:text-gray-700 border-l border-gray-200"
          title="Réinitialiser le zoom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      {/* Conteneur du rendu */}
      <div 
        className="flex-1 overflow-auto bg-gray-100"
        style={{ width: '100%', height: '100%' }}
      >
        {isRendering ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="min-h-full flex justify-center p-4"
          />
        )}
      </div>
      
      {/* Légende */}
      {highlightChanges && (
        <div className="p-2 bg-gray-50 border-t text-xs flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-200 mr-1"></div>
            <span>Contenu modifié</span>
          </div>
          
          {diffMode && (
            <>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-200 mr-1"></div>
                <span>Ajouté</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-200 mr-1"></div>
                <span>Supprimé</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}