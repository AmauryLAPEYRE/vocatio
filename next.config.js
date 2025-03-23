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
    // Optimisations de build pour Vercel
    poweredByHeader: false,
    generateBuildId: async () => {
      return `vocatio-build-${new Date().toISOString().split('T')[0]}`;
    }
  };
  
  module.exports = nextConfig;