// src/app/api/extract-cv/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAI, PROMPTS } from '@/services/ai/claude';
import { parse as pdfParse } from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }
    
    // Vérifier le type de fichier
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (fileType !== 'pdf' && fileType !== 'docx') {
      return NextResponse.json(
        { error: 'Format de fichier non supporté. Veuillez télécharger un fichier PDF ou DOCX.' },
        { status: 400 }
      );
    }
    
    // Extraire le texte du fichier
    let text = '';
    const buffer = await file.arrayBuffer();
    
    if (fileType === 'pdf') {
      const data = await pdfParse(Buffer.from(buffer));
      text = data.text;
    } else if (fileType === 'docx') {
      const result = await mammoth.extractRawText({
        arrayBuffer: buffer
      });
      text = result.value;
    }
    
    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'Impossible d\'extraire le texte du fichier' },
        { status: 400 }
      );
    }
    
    // Appeler Claude pour extraire les informations structurées
    const prompt = PROMPTS.CV_EXTRACTION.replace('{{CV_TEXT}}', text);
    const aiResponse = await callAI(prompt, {
      temperature: 0.1,
      max_tokens: 3000
    });
    
    try {
      // Convertir la réponse en JSON
      const cvData = JSON.parse(aiResponse);
      return NextResponse.json({ data: cvData });
    } catch (jsonError) {
      console.error('Erreur lors du parsing de la réponse JSON:', jsonError);
      return NextResponse.json(
        { error: 'Impossible de structurer les données du CV' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erreur lors de l\'extraction du CV:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors du traitement du CV' },
      { status: 500 }
    );
  }
}