// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['res.cloudinary.com', 'api.canva.com'],
    },
    env: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      CANVA_CLIENT_ID: process.env.CANVA_CLIENT_ID,
      CANVA_CLIENT_SECRET: process.env.CANVA_CLIENT_SECRET,
    },
    // Pour gérer les fichiers PDF et DOCX
    webpack: (config) => {
      config.resolve.alias.canvas = false;
      config.resolve.alias.encoding = false;
      
      return config;
    },
  };
  
  module.exports = nextConfig;