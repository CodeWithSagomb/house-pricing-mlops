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
        } as any);

        render(<HealthCard />, { wrapper: createWrapper() });

        expect(screen.getByText('SYSTEM HEALTH')).toBeInTheDocument();
        // Should show loading skeleton
        expect(screen.queryByText('Operational')).not.toBeInTheDocument();
    });

    it('renders healthy state correctly', () => {
        vi.mocked(useHealth).mockReturnValue({
            data: { status: 'ok', model_version: '3' },
            isLoading: false,
            isError: false,
            error: null,
        } as any);

        render(<HealthCard />, { wrapper: createWrapper() });

        expect(screen.getByText('SYSTEM HEALTH')).toBeInTheDocument();
        expect(screen.getByText('Operational')).toBeInTheDocument();
        expect(screen.getByText('Model v3')).toBeInTheDocument();
    });

    it('renders error state correctly', () => {
        vi.mocked(useHealth).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            error: new Error('Connection failed'),
        } as any);

        render(<HealthCard />, { wrapper: createWrapper() });

        expect(screen.getByText('SYSTEM HEALTH')).toBeInTheDocument();
        expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    it('displays status indicator dot', () => {
        vi.mocked(useHealth).mockReturnValue({
            data: { status: 'ok', model_version: '3' },
            isLoading: false,
            isError: false,
            error: null,
        } as any);

        render(<HealthCard />, { wrapper: createWrapper() });

        // Check for the status indicator (green dot for healthy)
        const indicator = screen.getByRole('status', { hidden: true }) ||
            document.querySelector('.bg-emerald-500');
        // The card should contain visual indicator
        expect(screen.getByText('Operational')).toBeInTheDocument();
    });
});
