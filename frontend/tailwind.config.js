/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './lib/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            colors: {
                // Dark Navy Background
                navy: {
                    900: '#0a0f1a',
                    800: '#0f172a',
                    700: '#1e293b',
                    600: '#334155',
                },
                // Teal Accent (Primary)
                teal: {
                    50: '#f0fdfa',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                },
                // Keep primary for compatibility
                primary: {
                    50: '#f0fdfa',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                },
            },
            backgroundImage: {
                // Gradient for card borders
                'gradient-teal': 'linear-gradient(180deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%)',
                'gradient-teal-horizontal': 'linear-gradient(90deg, #14b8a6 0%, #22d3ee 100%)',
                // Glass effects
                'glass-dark': 'linear-gradient(135deg, rgba(15, 25, 40, 0.9) 0%, rgba(10, 15, 26, 0.95) 100%)',
                // Card gradients
                'card-dark': 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(10, 15, 26, 0.9) 100%)',
            },
            boxShadow: {
                'glow-teal': '0 0 20px rgba(20, 184, 166, 0.3)',
                'glow-teal-sm': '0 0 10px rgba(20, 184, 166, 0.2)',
                'glow-green': '0 0 15px rgba(16, 185, 129, 0.4)',
                'glow-gold': '0 0 15px rgba(245, 158, 11, 0.3)',
                'card-dark': '0 4px 20px rgba(0, 0, 0, 0.3)',
                'card-dark-hover': '0 8px 30px rgba(0, 0, 0, 0.4)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'wave': 'wave 2s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(20, 184, 166, 0.2)' },
                    '100%': { boxShadow: '0 0 20px rgba(20, 184, 166, 0.5)' },
                },
                wave: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-3px)' },
                },
            },
        },
    },
    plugins: [],
};
