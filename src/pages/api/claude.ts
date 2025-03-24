// src/pages/api/claude.ts
import { NextRequest } from 'next/server';

// Type pour les requêtes vers l'API Claude
interface ClaudeRequest {
  model: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  temperature?: number;
  max_tokens?: number;
  system?: string;
}

// Type pour les réponses de l'API Claude
interface ClaudeResponse {
  id: string;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  content: {
    type: string;
    text: string;
  }[];
}

/**
 * Endpoint Vercel Edge Function pour l'API Claude
 * Permet d'éviter d'exposer la clé API côté client
 */
export default async function handler(req: NextRequest) {
  // Vérifier la méthode
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    // Récupérer le corps de la requête
    const requestBody = await req.json();
    
    // Validation des entrées
    if (!requestBody.messages || !Array.isArray(requestBody.messages)) {
      return new Response(JSON.stringify({ error: 'Format de message invalide' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Configurer la requête vers l'API Claude
    const claudeRequest: ClaudeRequest = {
      model: requestBody.model || 'claude-3-7-sonnet-20250219',
      messages: requestBody.messages,
      temperature: requestBody.temperature || 0.7,
      max_tokens: requestBody.max_tokens || 4000,
      system: requestBody.system || undefined
    };
    
    // Envoyer la requête à l'API Claude
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(claudeRequest)
    });
    
    // Récupérer et traiter la réponse
    const data = await claudeResponse.json() as ClaudeResponse;
    
    // Renvoyer la réponse au client
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Erreur lors de la communication avec Claude:', error);
    return new Response(JSON.stringify({ 
      error: 'Erreur de serveur lors de la communication avec Claude' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export const config = {
  runtime: 'edge',
};