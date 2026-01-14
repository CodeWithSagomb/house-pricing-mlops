'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * API Key Context - Single Responsibility Principle
 * ==================================================
 * Manages API key state across the application.
 * Persists to localStorage for convenience.
 */

interface ApiKeyContextType {
    apiKey: string;
    setApiKey: (key: string) => void;
    isConfigured: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

const STORAGE_KEY = 'mlops_api_key';

export function ApiKeyProvider({ children }: { children: ReactNode }) {
    const [apiKey, setApiKeyState] = useState<string>('');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setApiKeyState(stored);
        }
        setIsLoaded(true);
    }, []);

    // Persist to localStorage
    const setApiKey = (key: string) => {
        setApiKeyState(key);
        if (key) {
            localStorage.setItem(STORAGE_KEY, key);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    // Don't render children until loaded to prevent hydration mismatch
    if (!isLoaded) {
        return null;
    }

    return (
        <ApiKeyContext.Provider
            value={{
                apiKey,
                setApiKey,
                isConfigured: apiKey.length > 0,
            }}
        >
            {children}
        </ApiKeyContext.Provider>
    );
}

export function useApiKey() {
    const context = useContext(ApiKeyContext);
    if (context === undefined) {
        throw new Error('useApiKey must be used within an ApiKeyProvider');
    }
    return context;
}
