// app/api/export-document/route.js
import { NextResponse } from 'next/server';
import { renderDocumentToPDF } from '@/lib/export/pdf-generator';

/**
 * API route pour l'export du document optimisé
 * @param {Request} request - Requête HTTP
 * @returns {Promise<Response>} Réponse HTTP avec le document exporté
 */
export async function POST(request) {
  try {
    const { documentStructure, format = 'pdf' } = await request.json();
    
    if (!documentStructure) {
      return NextResponse.json(
        { error: 'Structure de document requise' },
        { status: 400 }
      );
    }
    
    // Selon le format demandé
    switch (format.toLowerCase()) {
      case 'pdf':
        // Générer le PDF
        const pdfBuffer = await renderDocumentToPDF(documentStructure);
        
        // Renvoyer le PDF comme fichier téléchargeable
        return new Response(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="cv-optimise.pdf"'
          }
        });
        
      case 'docx':
        // Pour l'instant, non implémenté
        return NextResponse.json(
          { error: 'L\'export DOCX n\'est pas encore disponible' },
          { status: 501 }
        );
        
      default:
        return NextResponse.json(
          { error: 'Format non supporté' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erreur lors de l\'export du document:', error);
    
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'export du document',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Configuration de la route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
};