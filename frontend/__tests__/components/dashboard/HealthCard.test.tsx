import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HealthCard } from '@/components/dashboard/HealthCard';
import React from 'react';

// Mock the useHealth hook
vi.mock('@/lib/hooks/useApi', () => ({
    useHealth: vi.fn(),
}));

import { useHealth } from '@/lib/hooks/useApi';

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('HealthCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state', () => {
        vi.mocked(useHealth).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            error: null,
        } as ReturnType<typeof useHealth>);

        render(<HealthCard />, { wrapper: createWrapper() });

        expect(screen.getByText('System Health')).toBeInTheDocument();
    });

    it('renders healthy state correctly', () => {
        vi.mocked(useHealth).mockReturnValue({
            data: { status: 'ok', model_version: '3' },
            isLoading: false,
            isError: false,
            error: null,
        } as ReturnType<typeof useHealth>);

        render(<HealthCard />, { wrapper: createWrapper() });

        expect(screen.getByText('System Health')).toBeInTheDocument();
        expect(screen.getByText('Operational')).toBeInTheDocument();
    });

    it('renders error state correctly', () => {
        vi.mocked(useHealth).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: new Error('Connection failed'),
        } as ReturnType<typeof useHealth>);

        render(<HealthCard />, { wrapper: createWrapper() });

        expect(screen.getByText('System Health')).toBeInTheDocument();
        expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });

    it('displays model version when healthy', () => {
        vi.mocked(useHealth).mockReturnValue({
            data: { status: 'ok', model_version: '3' },
            isLoading: false,
            isError: false,
            error: null,
        } as ReturnType<typeof useHealth>);

        render(<HealthCard />, { wrapper: createWrapper() });

        expect(screen.getByText('Model v3')).toBeInTheDocument();
    });
});
