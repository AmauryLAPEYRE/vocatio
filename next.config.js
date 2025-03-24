// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['cdn.vocatio.ai'],
  },
  experimental: {
    serverComponentsExternalPackages: ['onnxruntime-web', 'tesseract.js'],
    esmExternals: 'loose',
  },
  webpack: (config) => {
    // ONNX Runtime Web nécessite des configurations spécifiques
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false
    };
    
    // Optimisation pour les workers PDF.js
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js/,
      type: 'asset/resource',
      generator: {
        filename: 'static/chunks/[name].[hash][ext]',
      },
    });
    
    return config;
  },
  // Configurations spécifiques pour les Edge Functions
  serverRuntimeConfig: {
    modelPath: '/models/layoutlm-quantized.onnx',
  },
  // Configuration pour augmenter la taille des payloads
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  }
};

module.exports = nextConfig;
