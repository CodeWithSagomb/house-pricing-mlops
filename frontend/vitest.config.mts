import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
                statements: 10,
                branches: 10,
                functions: 10,
                lines: 10,
            },
        },

        // Timeout for async tests
        testTimeout: 10000,
    },

    // Path aliases matching tsconfig
    resolve: {
        alias: {
            '@': resolve(__dirname, './'),
        },
    },
});
