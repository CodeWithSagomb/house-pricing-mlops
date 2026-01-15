import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ApiKeyProvider, useApiKey } from '@/lib/contexts/ApiKeyContext';
import React from 'react';

describe('ApiKeyContext', () => {
    beforeEach(() => {
        vi.mocked(localStorage.getItem).mockReturnValue(null);
        vi.mocked(localStorage.setItem).mockClear();
        vi.mocked(localStorage.removeItem).mockClear();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ApiKeyProvider>{children}</ApiKeyProvider>
    );

    it('initializes with empty API key when localStorage is empty', () => {
        const { result } = renderHook(() => useApiKey(), { wrapper });

        expect(result.current.apiKey).toBe('');
        expect(result.current.isConfigured).toBe(false);
    });

    it('loads API key from localStorage on mount', () => {
        vi.mocked(localStorage.getItem).mockReturnValue('stored-key');

        const { result } = renderHook(() => useApiKey(), { wrapper });

        expect(result.current.apiKey).toBe('stored-key');
        expect(result.current.isConfigured).toBe(true);
    });

    it('updates API key and saves to localStorage', () => {
        const { result } = renderHook(() => useApiKey(), { wrapper });

        act(() => {
            result.current.setApiKey('new-test-key');
        });

        expect(result.current.apiKey).toBe('new-test-key');
        expect(result.current.isConfigured).toBe(true);
        expect(localStorage.setItem).toHaveBeenCalledWith(
            'mlops_api_key',
            'new-test-key'
        );
    });

    it('clears API key from localStorage when set to empty', () => {
        const { result } = renderHook(() => useApiKey(), { wrapper });

        act(() => {
            result.current.setApiKey('some-key');
        });

        act(() => {
            result.current.setApiKey('');
        });

        expect(result.current.apiKey).toBe('');
        expect(result.current.isConfigured).toBe(false);
    });

    it('throws error when used outside provider', () => {
        expect(() => {
            renderHook(() => useApiKey());
        }).toThrow('useApiKey must be used within an ApiKeyProvider');
    });
});
