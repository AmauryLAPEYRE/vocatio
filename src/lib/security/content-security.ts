// src/lib/security/content-security.ts

/**
 * Configure les politiques de sécurité du contenu (CSP)
 * pour protéger contre les attaques XSS et autres vulnérabilités
 */
export class ContentSecurity {
    /**
     * Génère les entêtes CSP pour Next.js
     * @returns Objet avec les entêtes à utiliser dans next.config.js
     */
    static getHeaders(): {key: string, value: string}[] {
      return [
        {
          key: 'Content-Security-Policy',
          value: this.generateCSPHeader()
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        }
      ];
    }
  
    /**
     * Génère le contenu de l'entête CSP
     */
    private static generateCSPHeader(): string {
      const policies = {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
        'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        'font-src': ["'self'", "https://fonts.gstatic.com", "data:"],
        'img-src': ["'self'", "data:", "/api/placeholder"],
        'connect-src': ["'self'", "https://api.anthropic.com"],
        'frame-src': ["'self'"],
        'worker-src': ["'self'", "blob:"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"]
      };
  
      return Object.entries(policies)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');
    }
  }
  
  // next.config.js (modifications)
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
      domains: [],
    },
    experimental: {
      optimizeCss: true,
      scrollRestoration: true,
    },
    env: {
      APP_NAME: 'Vocatio',
      APP_VERSION: '1.0.0',
    },
    // Définition des entêtes de sécurité pour les requêtes HTTP
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            {
              key: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=()',
            }
          ],
        },
      ];
    },
    // Optimisations de build pour Vercel
    poweredByHeader: false,
    generateBuildId: async () => {
      return `vocatio-build-${new Date().toISOString().split('T')[0]}`;
    }
  };
  
  module.exports = nextConfig;
  