/** @type {import('next').NextConfig} */

// Detect if running in Docker (standalone mode) or Vercel
const isDocker = process.env.DOCKER_BUILD === 'true';

const nextConfig = {
    // Standalone output only for Docker (not for Vercel)
    ...(isDocker && { output: 'standalone' }),

    // Environment variables (build-time)
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    },

    // Security: Remove X-Powered-By header
    poweredByHeader: false,

    // Enable React strict mode for better development
    reactStrictMode: true,

    // Enable compression
    compress: true,

    // Image optimization settings
    images: {
        unoptimized: isDocker, // Only for Docker standalone
    },

    // Experimental features for performance
    experimental: {
        // Optimize package imports
        optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
    },
};

module.exports = nextConfig;
