/** @type {import('next').NextConfig} */
const nextConfig = {
    // Standalone output for Docker optimization
    output: 'standalone',

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
        unoptimized: true, // For standalone deployment
    },

    // Experimental features for performance
    experimental: {
        // Optimize package imports
        optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
    },
};

module.exports = nextConfig;
