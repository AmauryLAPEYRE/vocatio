// src/components/cv/ComparisonView.tsx
import React, { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { HTMLRecreator } from '@/lib/document-processing/html-recreator';
import { LoadingState } from '@/components/common/LoadingState';

interface ComparisonViewProps {
  showDiff?: boolean;
  showControls?: boolean;
  onClose?: () => void;
}

export function ComparisonView({ 
  showDiff = true, 
  showControls = true,
  onClose 
}: ComparisonViewProps) {
  const { 
    originalContent: cvData, 
    optimizedContent: optimizedCV 
  } = useStore((state) => state.cv);
  
  const [originalHtml, setOriginalHtml] = useState<string | null>(null);
  const [optimizedHtml, setOptimizedHtml] = useState<string | null>(null);
  const [syncScroll, setSyncScroll] = useState(true);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'original' | 'optimized'>('side-by-side');
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState<string | null>(null);
  
  // Référence aux iframes pour la synchronisation du défilement
  const originalIframeRef = React.useRef<HTMLIFrameElement>(null);
  const optimizedIframeRef = React.useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    async function generateHtml() {
      if (!cvData) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Générer le HTML original
        let template;
        if ('originalPdfBase64' in cvData && cvData.originalPdfBase64) {
          template = await HTMLRecreator.analyzePDF(cvData.originalPdfBase64);
        } else if ('originalArrayBuffer' in cvData && cvData.originalArrayBuffer) {
          template = await HTMLRecreator.analyzePDF(cvData.originalArrayBuffer.slice(0));
        }
        
        if (template) {
          const html = HTMLRecreator.generateHTML(template);
          setOriginalHtml(html);
          
          // Générer le HTML optimisé si disponible
          if (optimizedCV?.optimizedSections) {
            const optimizedHtml = HTMLRecreator.generateHTML(template, optimizedCV.optimizedSections);
            setOptimizedHtml(optimizedHtml);
          }
        }
      } catch (err) {
        console.error('Erreur lors de la génération du HTML:', err);
        setError('Une erreur est survenue lors de la préparation de la comparaison.');
      } finally {
        setLoading(false);
      }
    }
    
    generateHtml();
  }, [cvData, optimizedCV]);
  
  // Gérer la synchronisation du défilement entre les deux iframes
  useEffect(() => {
    if (!syncScroll || viewMode !== 'side-by-side') return;
    
    const handleOriginalScroll = () => {
      if (optimizedIframeRef.current && originalIframeRef.current) {
        const originalDoc = originalIframeRef.current.contentDocument || originalIframeRef.current.contentWindow?.document;
        const optimizedDoc = optimizedIframeRef.current.contentDocument || optimizedIframeRef.current.contentWindow?.document;
        
        if (originalDoc && optimizedDoc) {
          optimizedDoc.documentElement.scrollTop = originalDoc.documentElement.scrollTop;
          optimizedDoc.documentElement.scrollLeft = originalDoc.documentElement.scrollLeft;
        }
      }
    };
    
    const handleOptimizedScroll = () => {
      if (optimizedIframeRef.current && originalIframeRef.current) {
        const originalDoc = originalIframeRef.current.contentDocument || originalIframeRef.current.contentWindow?.document;
        const optimizedDoc = optimizedIframeRef.current.contentDocument || optimizedIframeRef.current.contentWindow?.document;
        
        if (originalDoc && optimizedDoc) {
          originalDoc.documentElement.scrollTop = optimizedDoc.documentElement.scrollTop;
          originalDoc.documentElement.scrollLeft = optimizedDoc.documentElement.scrollLeft;
        }
      }
    };
    
    const origIframe = originalIframeRef.current;
    const optIframe = optimizedIframeRef.current;
    
    if (origIframe && optIframe) {
      origIframe.addEventListener('load', () => {
        const doc = origIframe.contentDocument || origIframe.contentWindow?.document;
        if (doc) {
          doc.addEventListener('scroll', handleOriginalScroll);
        }
      });
      
      optIframe.addEventListener('load', () => {
        const doc = optIframe.contentDocument || optIframe.contentWindow?.document;
        if (doc) {
          doc.addEventListener('scroll', handleOptimizedScroll);
        }
      });
    }
    
    return () => {
      if (origIframe && optIframe) {
        const origDoc = origIframe.contentDocument || origIframe.contentWindow?.document;
        const optDoc = optIframe.contentDocument || optIframe.contentWindow?.document;
        
        if (origDoc) {
          origDoc.removeEventListener('scroll', handleOriginalScroll);
        }
        
        if (optDoc) {
          optDoc.removeEventListener('scroll', handleOptimizedScroll);
        }
      }
    };
  }, [syncScroll, viewMode]);
  
  // Gérer le zoom des iframes
  useEffect(() => {
    function applyZoom(iframe: HTMLIFrameElement | null) {
      if (!iframe) return;
      
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        // Appliquer le zoom en CSS
        doc.body.style.transformOrigin = 'top left';
        doc.body.style.transform = `scale(${zoom / 100})`;
        doc.body.style.width = `${10000 / zoom * 100}px`;
      }
    }
    
    applyZoom(originalIframeRef.current);
    applyZoom(optimizedIframeRef.current);
  }, [zoom]);
  
  if (loading) {
    return <LoadingState text="Préparation de la comparaison..." />;
  }
  
  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 rounded-md">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  
  if (!originalHtml) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-md">
        <p className="text-gray-500">Aucun CV à afficher. Veuillez d'abord importer un CV.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Contrôles */}
      {showControls && (
        <div className="p-4 border-b flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <select 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value as any)}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="side-by-side">Côte à côte</option>
              <option value="original">Original uniquement</option>
              <option value="optimized">Optimisé uniquement</option>
            </select>
            
            <div className="flex items-center space-x-1">
              <label htmlFor="zoom-control" className="text-sm text-gray-600">Zoom:</label>
              <select 
                id="zoom-control"
                value={zoom} 
                onChange={(e) => setZoom(Number(e.target.value))}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              >
                <option value="50">50%</option>
                <option value="75">75%</option>
                <option value="100">100%</option>
                <option value="125">125%</option>
                <option value="150">150%</option>
              </select>
            </div>
            
            {viewMode === 'side-by-side' && (
              <label className="flex items-center space-x-1 text-sm">
                <input 
                  type="checkbox" 
                  checked={syncScroll} 
                  onChange={() => setSyncScroll(!syncScroll)}
                  className="rounded"
                />
                <span>Synchroniser le défilement</span>
              </label>
            )}
          </div>
          
          {onClose && (
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Fermer la comparaison
            </button>
          )}
        </div>
      )}
      
      {/* Contenu des CV */}
      <div className={`flex ${viewMode === 'side-by-side' ? 'flex-row' : 'flex-col'}`}>
        {/* CV Original */}
        {(viewMode === 'side-by-side' || viewMode === 'original') && (
          <div className={`${viewMode === 'side-by-side' ? 'w-1/2 border-r' : 'w-full'}`}>
            <div className="bg-gray-100 px-4 py-2">
              <h3 className="font-medium text-gray-800">CV Original</h3>
            </div>
            <div className="p-0 bg-white h-[600px] overflow-auto">
              <iframe 
                ref={originalIframeRef}
                srcDoc={originalHtml}
                title="CV Original"
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>
        )}
        
        {/* CV Optimisé */}
        {(viewMode === 'side-by-side' || viewMode === 'optimized') && (
          <div className={`${viewMode === 'side-by-side' ? 'w-1/2' : 'w-full'}`}>
            <div className="bg-gray-100 px-4 py-2">
              <h3 className="font-medium text-gray-800">CV Optimisé</h3>
            </div>
            <div className="p-0 bg-white h-[600px] overflow-auto">
              {optimizedHtml ? (
                <iframe 
                  ref={optimizedIframeRef}
                  srcDoc={optimizedHtml}
                  title="CV Optimisé"
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts"
                />
              ) : (
                <div className="text-center p-8">
                  <p className="text-gray-500">Aucun CV optimisé disponible. Veuillez d'abord optimiser votre CV.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Affichage des différences */}
      {showDiff && optimizedHtml && viewMode === 'side-by-side' && (
        <div className="p-4 border-t">
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-medium text-blue-800 mb-2">Modifications apportées</h4>
            <ul className="text-sm space-y-1">
              <li className="text-blue-700">
                • Le contenu a été optimisé pour correspondre à l'offre d'emploi tout en préservant la mise en page.
              </li>
              <li className="text-blue-700">
                • Des mots-clés pertinents ont été intégrés naturellement dans le texte.
              </li>
              <li className="text-blue-700">
                • Les compétences pertinentes ont été mises en avant.
              </li>
              <li className="text-blue-700">
                • Le langage a été adapté au secteur visé.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}