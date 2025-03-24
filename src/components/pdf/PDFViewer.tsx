// src/components/pdf/PDFViewer.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';

interface PDFViewerProps {
  pdfData: ArrayBuffer | string; // Accepte soit un ArrayBuffer, soit une chaîne Base64
  width?: number;
  height?: number;
  scale?: number;
  page?: number;
}

export function PDFViewer({ pdfData, width = 800, height = 800, scale = 1.2, page = 1 }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Configuration du worker
  useEffect(() => {
    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
      const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    }
  }, []);

  // Affichage du PDF
  useEffect(() => {
    async function renderPDF() {
      if (!canvasRef.current || !pdfData) return;

      setLoading(true);
      setError(null);

      try {
        // Préparation des données du PDF
        let pdfBuffer: ArrayBuffer;
        
        if (typeof pdfData === 'string') {
          // Conversion Base64 en ArrayBuffer
          const binaryString = window.atob(pdfData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          pdfBuffer = bytes.buffer;
        } else {
          pdfBuffer = pdfData;
        }

        // Chargement du PDF
        const loadingTask = pdfjs.getDocument({ 
          data: pdfBuffer,
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
          cMapPacked: true
        });
        
        const pdf = await loadingTask.promise;
        setTotalPages(pdf.numPages);
        
        // Limiter la page courante au nombre total de pages
        const pageNum = Math.min(currentPage, pdf.numPages);
        
        // Obtenir la page
        const page = await pdf.getPage(pageNum);
        
        // Configurer le canvas
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Ajuster la taille du canvas selon les dimensions de la page
        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Ajuster le style du canvas pour respecter la taille max
        if (canvas.width > width) {
          const ratio = width / canvas.width;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${canvas.height * ratio}px`;
        }
        
        // Rendre la page
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du rendu du PDF:', err);
        setError(`Erreur lors du rendu du PDF: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        setLoading(false);
      }
    }
    
    renderPDF();
  }, [pdfData, currentPage, scale, width, height]);

  // Gestion de la navigation entre les pages
  const changePage = (delta: number) => {
    if (currentPage + delta >= 1 && currentPage + delta <= totalPages) {
      setCurrentPage(currentPage + delta);
    }
  };

  return (
    <div className="pdf-viewer">
      {loading && (
        <div className="flex justify-center items-center h-40">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      
      {error && (
        <div className="text-red-500 p-4 border border-red-200 rounded">
          {error}
        </div>
      )}
      
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          className={`border rounded shadow-sm mx-auto ${loading ? 'hidden' : 'block'}`}
        />
        
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-2">
            <button 
              onClick={() => changePage(-1)} 
              disabled={currentPage <= 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Précédente
            </button>
            
            <span>
              Page {currentPage} sur {totalPages}
            </span>
            
            <button 
              onClick={() => changePage(1)} 
              disabled={currentPage >= totalPages}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Suivante
            </button>
          </div>
        )}
      </div>
    </div>
  );
}