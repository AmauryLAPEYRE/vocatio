// src/app/api/canva/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Récupérer le token d'accès via notre API route
    const tokenResponse = await fetch(new URL('/api/canva/token', request.url).toString(), {
      method: 'POST',
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Erreur lors de l\'authentification Canva' },
        { status: tokenResponse.status }
      );
    }
    
    const { access_token } = await tokenResponse.json();
    
    // Utiliser le token pour récupérer les templates
    const templatesResponse = await fetch('https://api.canva.com/v1/templates?category=resume&limit=50', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    
    if (!templatesResponse.ok) {
      const errorText = await templatesResponse.text();
      console.error('Erreur Canva Templates:', errorText);
      return NextResponse.json(
        { error: `Erreur lors de la récupération des templates: ${templatesResponse.status}` },
        { status: templatesResponse.status }
      );
    }
    
    const templatesData = await templatesResponse.json();
    return NextResponse.json(templatesData);
  } catch (error) {
    console.error('Erreur lors de la récupération des templates Canva:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des templates' },
      { status: 500 }
    );
  }
}