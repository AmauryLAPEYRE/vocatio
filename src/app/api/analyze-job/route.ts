// src/app/api/analyze-job/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { callAI, PROMPTS } from '@/services/ai/claude';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { jobDescription } = await request.json();
    
    if (!jobDescription || jobDescription.trim() === '') {
      return NextResponse.json(
        { error: 'Description de poste vide' },
        { status: 400 }
      );
    }
    
    // Appeler Claude pour analyser l'offre d'emploi
    const prompt = PROMPTS.JOB_ANALYSIS.replace('{{JOB_TEXT}}', jobDescription);
    const aiResponse = await callAI(prompt, {
      temperature: 0.1,
      max_tokens: 2000
    });
    
    try {
      // Convertir la réponse en JSON
      const jobData = JSON.parse(aiResponse);
      return NextResponse.json({ data: jobData });
    } catch (jsonError) {
      console.error('Erreur lors du parsing de la réponse JSON:', jsonError);
      return NextResponse.json(
        { error: 'Impossible de structurer les données de l\'offre d\'emploi' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erreur lors de l\'analyse de l\'offre d\'emploi:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors du traitement de l\'offre d\'emploi' },
      { status: 500 }
    );
  }
}