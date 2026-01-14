'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { useState } from 'react';
import { ApiKeyProvider } from '@/lib/contexts/ApiKeyContext';
import { ThemeProvider } from '@/components/ThemeProvider';

/**
 * Providers Component - Dependency Inversion Principle
 * =====================================================
 * Wraps the app with all necessary providers.
 * Easy to add/remove providers without modifying layout.
 */
export function Providers({ children }: { children: React.ReactNode }) {
    // Create QueryClient inside component to avoid SSR issues
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30 * 1000, // 30 seconds
                        refetchOnWindowFocus: true,
                        retry: 2,
                    },
                },
            })
    );

    return (
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <ApiKeyProvider>
                    {children}
                    <Toaster
                        position="top-right"
                        richColors
                        closeButton
                        theme="system"
                    />
                </ApiKeyProvider>
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </ThemeProvider>
    );
}
