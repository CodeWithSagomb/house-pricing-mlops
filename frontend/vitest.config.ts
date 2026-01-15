import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        // Use jsdom for DOM environment
        environment: 'jsdom',

        // Enable global test APIs (describe, it, expect)
        globals: true,

        // Setup file for global configuration
        setupFiles: './vitest.setup.ts',

        // Test file patterns
        include: ['__tests__/**/*.test.{ts,tsx}'],

        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html'],
            reportsDirectory: './coverage',
            exclude: [
                'node_modules/',
                '__tests__/',
                '__mocks__/',
                '*.config.*',
                '.next/',
            ],
            thresholds: {
                statements: 80,
                branches: 75,
                functions: 80,
                lines: 80,
            },
        },

        // Timeout for async tests
        testTimeout: 10000,
    },

    // Path aliases matching tsconfig
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
});
