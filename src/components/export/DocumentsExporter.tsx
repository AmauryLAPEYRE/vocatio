// src/components/export/DocumentsExporter.tsx
import { useState } from 'react';
import { useStore } from 'src/store';
import { jsPDF } from 'jspdf';
import { CVPreview } from 'src/components/cv/CVPreview';
import { LetterPreview } from 'src/components/letter/LetterPreview';
import { Loader } from 'src/components/common/Loader';
import { Button } from 'src/components/common/Button';
import { HTMLtoPDFExporter } from 'src/lib/document-processing/html-to-pdf';

/**
 * Composant pour l'exportation des documents finalisés (CV optimisé et lettre de motivation)
 */
export function DocumentsExporter() {
  const [exportingCV, setExportingCV] = useState(false);
  const [exportingLetter, setExportingLetter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Récupérer les données des stores
  const {
    cv: { optimizedContent: optimizedCV, fileName: cvFileName, template: cvTemplate },
    job: { companyName, jobTitle },
    letter: { content: letterContent }
  } = useStore();
  
  /**
   * Exporte le CV optimisé en PDF
   */
  const exportCV = async () => {
    if (!optimizedCV) {
      setError('Aucun CV optimisé disponible. Veuillez d\'abord optimiser votre CV.');
      return;
    }
    
    setExportingCV(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Vérifier si nous avons un CV optimisé avec HTML préservant le format
      if (optimizedCV.formattedHTML) {
        // Utiliser le HTML pour générer un PDF qui préserve exactement le format
        console.log("Export CV avec format préservé (HTML)");
        
        // Récupérer les dimensions de page du template
        const pageSize = cvTemplate?.pages[0] ? {
          width: cvTemplate.pages[0].width,
          height: cvTemplate.pages[0].height
        } : undefined;
        
        // Générer le PDF à partir du HTML
        const pdfBlob = await HTMLtoPDFExporter.exportHTML(optimizedCV.formattedHTML, {
          pageSize,
          margin: { top: 0, right: 0, bottom: 0, left: 0 }
        });
        
        // Génération du nom de fichier
        const companyText = companyName ? `-${companyName.replace(/\s+/g, '-')}` : '';
        const exportFileName = `CV-optimise${companyText}.pdf`;
        
        // Télécharger le PDF
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setSuccess('CV exporté avec succès avec préservation exacte du format !');
      } else {
        // Méthode traditionnelle si le HTML n'est pas disponible
        console.log("Export CV traditionnel (texte uniquement)");
        
        // Créer un nouveau document PDF (A4)
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Configuration du texte
        doc.setFont('Helvetica');
        doc.setFontSize(11);
        
        // Ajouter le texte du CV
        const splitText = doc.splitTextToSize(optimizedCV.text, 180);
        doc.text(splitText, 15, 20);
        
        // Génération du nom de fichier
        const companyText = companyName ? `-${companyName.replace(/\s+/g, '-')}` : '';
        const exportFileName = `CV-optimise${companyText}.pdf`;
        
        // Télécharger le PDF
        doc.save(exportFileName);
        
        setSuccess('CV exporté avec succès !');
      }
    } catch (err) {
      console.error('Erreur lors de l\'exportation du CV:', err);
      setError('Une erreur est survenue lors de l\'exportation du CV. Veuillez réessayer.');
    } finally {
      setExportingCV(false);
    }
  };
  
  /**
   * Exporte la lettre de motivation en PDF
   */
  const exportLetter = async () => {
    if (!letterContent) {
      setError('Aucune lettre de motivation disponible. Veuillez d\'abord générer une lettre.');
      return;
    }
    
    setExportingLetter(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Créer un nouveau document PDF (A4)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Configuration du document
      doc.setFont('Helvetica');
      
      // En-tête de la lettre
      const currentDate = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Coordonnées de l'expéditeur (en haut à droite)
      doc.setFontSize(10);
      doc.text('Votre Nom', 150, 20);
      doc.text('Votre Adresse', 150, 25);
      doc.text('Votre Email', 150, 30);
      doc.text('Votre Téléphone', 150, 35);
      doc.text(currentDate, 150, 45);
      
      // Coordonnées du destinataire (en haut à gauche)
      doc.text(companyName || 'Nom de l\'entreprise', 20, 60);
      doc.text('À l\'attention du service recrutement', 20, 65);
      doc.text('Adresse de l\'entreprise', 20, 70);
      
      // Objet de la lettre
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Objet : Candidature au poste de ${jobTitle || 'poste visé'}`, 20, 85);
      doc.setFont('Helvetica', 'normal');
      
      // Formule d'appel
      doc.text('Madame, Monsieur,', 20, 100);
      
      // Corps de la lettre
      doc.setFontSize(11);
      const splitText = doc.splitTextToSize(letterContent, 170);
      doc.text(splitText, 20, 115);
      
      // Formule de politesse
      const lastLineY = Math.min(115 + splitText.length * 6, 250);
      doc.text('Je vous prie d\'agréer, Madame, Monsieur, l\'expression de mes salutations distinguées.', 20, lastLineY + 10);
      
      // Signature
      doc.text('Votre Nom', 20, lastLineY + 25);
      
      // Génération du nom de fichier
      const companyText = companyName ? `-${companyName.replace(/\s+/g, '-')}` : '';
      const jobText = jobTitle ? `-${jobTitle.replace(/\s+/g, '-')}` : '';
      const exportFileName = `Lettre-de-motivation${jobText}${companyText}.pdf`;
      
      // Télécharger le PDF
      doc.save(exportFileName);
      
      setSuccess('Lettre de motivation exportée avec succès !');
    } catch (err) {
      console.error('Erreur lors de l\'exportation de la lettre:', err);
      setError('Une erreur est survenue lors de l\'exportation de la lettre. Veuillez réessayer.');
    } finally {
      setExportingLetter(false);
    }
  };
  
  /**
   * Exporte à la fois le CV et la lettre de motivation
   */
  const exportAll = async () => {
    if (!optimizedCV || !letterContent) {
      setError('Certains documents ne sont pas disponibles. Veuillez générer tous les documents avant d\'exporter.');
      return;
    }
    
    setExportingCV(true);
    setExportingLetter(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Exporter les deux documents
      await exportCV();
      await exportLetter();
      
      setSuccess('Documents exportés avec succès !');
    } catch (err) {
      console.error('Erreur lors de l\'exportation des documents:', err);
      setError('Une erreur est survenue lors de l\'exportation des documents. Veuillez réessayer.');
    } finally {
      setExportingCV(false);
      setExportingLetter(false);
    }
  };
  
  /**
   * Permet d'imprimer directement le CV (pour une meilleure fidélité)
   */
  const printCV = async () => {
    if (!optimizedCV || !optimizedCV.formattedHTML) {
      setError('Aucun CV optimisé disponible pour impression.');
      return;
    }
    
    try {
      await HTMLtoPDFExporter.printHTML(optimizedCV.formattedHTML);
      setSuccess('CV envoyé à l\'impression !');
    } catch (err) {
      console.error('Erreur lors de l\'impression du CV:', err);
      setError('Une erreur est survenue lors de l\'impression du CV.');
    }
  };
  
  // Vérifier si les documents sont disponibles
  const hasOptimizedCV = !!optimizedCV;
  const hasFormattedCV = !!optimizedCV?.formattedHTML;
  const hasLetter = !!letterContent;
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Exportation des documents</h2>
        <p className="text-gray-600 mt-2">
          Exporter votre CV optimisé et votre lettre de motivation au format PDF
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Aperçu du CV */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Votre CV optimisé</h3>
          {hasOptimizedCV ? (
            <>
              <div className="border rounded-md shadow-sm overflow-hidden">
                {hasFormattedCV ? (
                  <div className="bg-gray-100 px-4 py-3 border-b">
                    <h4 className="font-medium">Aperçu du CV (format préservé)</h4>
                  </div>
                ) : (
                  <div className="bg-gray-100 px-4 py-3 border-b">
                    <h4 className="font-medium">Aperçu du CV</h4>
                  </div>
                )}
                <div className="p-4 max-h-96 overflow-y-auto">
                  {hasFormattedCV ? (
                    <iframe 
                      srcDoc={optimizedCV.formattedHTML}
                      title="CV optimisé"
                      className="w-full border h-96"
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div className="whitespace-pre-line">
                      {optimizedCV.text}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-center space-x-2">
                <Button
                  onClick={exportCV}
                  isLoading={exportingCV}
                  icon={(
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                >
                  Exporter le CV en PDF
                </Button>
                
                {hasFormattedCV && (
                  <Button
                    onClick={printCV}
                    variant="outline"
                    icon={(
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    )}
                  >
                    Imprimer
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800">
              Aucun CV optimisé disponible. Veuillez d'abord compléter l'étape d'optimisation du CV.
            </div>
          )}
        </div>
        
        {/* Aperçu de la lettre */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">Votre lettre de motivation</h3>
          {hasLetter ? (
            <>
              <div className="border rounded-md shadow-sm overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b">
                  <h4 className="font-medium">Aperçu de la lettre</h4>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  <div className="whitespace-pre-line">
                    {letterContent}
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={exportLetter}
                  isLoading={exportingLetter}
                  icon={(
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                >
                  Exporter la lettre en PDF
                </Button>
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800">
              Aucune lettre de motivation disponible. Veuillez d'abord compléter l'étape de création de lettre.
            </div>
          )}
        </div>
      </div>
      
      {/* Options d'exportation globale */}
      {hasOptimizedCV && hasLetter && (
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-4">Tout exporter</h3>
          <p className="text-blue-700 mb-4">
            Exportez votre CV optimisé et votre lettre de motivation en une seule opération.
          </p>
          <div className="flex justify-center">
            <Button
              variant="primary"
              size="large"
              onClick={exportAll}
              isLoading={exportingCV || exportingLetter}
              icon={(
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
            >
              Exporter tous les documents
            </Button>
          </div>
        </div>
      )}
      
      {/* Messages de succès ou d'erreur */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
          {success}
        </div>
      )}
      
      {/* Conseils d'utilisation */}
      <div className="bg-gray-50 p-4 rounded-md mt-6">
        <h3 className="font-medium text-gray-800 mb-2">Conseils pour l'utilisation des documents</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Personnalisez vos coordonnées dans les documents avant de les envoyer</li>
          <li>• Relisez attentivement le CV et la lettre pour vérifier toutes les informations</li>
          <li>• Pour le CV, utilisez l'option d'impression pour une fidélité parfaite si disponible</li>
          <li>• Envoyez vos candidatures depuis une adresse email professionnelle</li>
          <li>• Suivez vos candidatures une semaine après l'envoi si vous n'avez pas de réponse</li>
        </ul>
      </div>
      
      {/* Politique de confidentialité */}
      <div className="text-xs text-gray-500 text-center mt-8">
        <p>Conformément à notre politique de confidentialité, aucune donnée de votre CV ou de votre lettre n'est stockée sur nos serveurs.</p>
        <p>Tous les documents sont traités localement dans votre navigateur.</p>
      </div>
    </div>
  );
}