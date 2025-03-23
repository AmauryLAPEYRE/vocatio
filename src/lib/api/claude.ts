// src/lib/api/claude.ts
/**
 * Hook personnalisé pour utiliser l'API Claude
 */
import { useState } from 'react';

interface UseClaudeAPIProps {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

interface ClaudeAPIResponse {
  content: string;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
}

export function useClaudeAPI({ 
  model = 'claude-3-5-sonnet-20240307', 
  temperature = 0.7, 
  maxTokens = 4000,
  systemPrompt
}: UseClaudeAPIProps = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Envoie un message à l'API Claude
   * @param prompt Message à envoyer
   * @returns Réponse de Claude
   */
  const sendMessage = async (prompt: string): Promise<ClaudeAPIResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
          system: systemPrompt
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la communication avec Claude');
      }
      
      const data = await response.json();
      
      return {
        content: data.content[0].text,
        tokenUsage: {
          input: data.usage.input_tokens,
          output: data.usage.output_tokens,
          total: data.usage.input_tokens + data.usage.output_tokens
        }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    sendMessage,
    loading,
    error
  };
}