'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PredictionInput } from '@/lib/api';

/**
 * Prediction History Context
 * Stores prediction history in localStorage
 */

export interface HistoryEntry {
    id: string;
    timestamp: string;
    input: PredictionInput;
    price: number;
    modelVersion: string;
    processingTime: number;
}

interface HistoryContextType {
    history: HistoryEntry[];
    addEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
    clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

const STORAGE_KEY = 'mlops_prediction_history';
const MAX_HISTORY = 50;

export function HistoryProvider({ children }: { children: ReactNode }) {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch {
                // Invalid JSON, ignore
            }
        }
        setIsLoaded(true);
    }, []);

    // Persist to localStorage
    const saveHistory = (entries: HistoryEntry[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    };

    const addEntry = (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
        const newEntry: HistoryEntry = {
            ...entry,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
        };

        setHistory((prev) => {
            const updated = [newEntry, ...prev].slice(0, MAX_HISTORY);
            saveHistory(updated);
            return updated;
        });
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    if (!isLoaded) {
        return null;
    }

    return (
        <HistoryContext.Provider value={{ history, addEntry, clearHistory }}>
            {children}
        </HistoryContext.Provider>
    );
}

export function useHistory() {
    const context = useContext(HistoryContext);
    if (context === undefined) {
        throw new Error('useHistory must be used within a HistoryProvider');
    }
    return context;
}
