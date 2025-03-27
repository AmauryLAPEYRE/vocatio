// src/app/api/canva/token/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const clientId = process.env.CANVA_CLIENT_ID;
    const clientSecret = process.env.CANVA_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Identifiants Canva non configurés' },
        { status: 500 }
      );
    }
    
    // Préparer les données pour l'API Canva
    const data = new URLSearchParams();
    data.append('client_id', clientId);
    data.append('client_secret', clientSecret);
    data.append('grant_type', 'client_credentials');
    data.append('scope', 'templates.read designs.write');
    
    // Appeler l'API Canva depuis le serveur
    const response = await fetch('https://api.canva.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: data.toString(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur Canva:', errorText);
      return NextResponse.json(
        { error: `Erreur lors de l'authentification Canva: ${response.status}` },
        { status: response.status }
      );
    }
    
    const tokenData = await response.json();
    return NextResponse.json(tokenData);
  } catch (error) {
    console.error('Erreur lors de la récupération du token Canva:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'authentification Canva' },
      { status: 500 }
    );
  }
}