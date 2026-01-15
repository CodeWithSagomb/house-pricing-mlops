import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { HistoryProvider, useHistory } from '@/lib/contexts/HistoryContext';
import React from 'react';

describe('HistoryContext', () => {
    beforeEach(() => {
        vi.mocked(localStorage.getItem).mockReturnValue(null);
        vi.mocked(localStorage.setItem).mockClear();
        vi.mocked(localStorage.removeItem).mockClear();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <HistoryProvider>{children}</HistoryProvider>
    );

    it('initializes with empty history', () => {
        const { result } = renderHook(() => useHistory(), { wrapper });

        expect(result.current.history).toHaveLength(0);
    });

    it('loads history from localStorage on mount', () => {
        const storedHistory = [
            {
                id: '1',
                timestamp: '2024-01-01T00:00:00Z',
                input: { MedInc: 8.3, HouseAge: 41, AveRooms: 6.9, AveBedrms: 1.0, Population: 322, AveOccup: 2.5, Latitude: 37.88, Longitude: -122.23 },
                price: 4.5,
                modelVersion: '3',
                processingTime: 100,
            },
        ];
        vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(storedHistory));

        const { result } = renderHook(() => useHistory(), { wrapper });

        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0].price).toBe(4.5);
    });

    it('adds new entry to history', () => {
        const { result } = renderHook(() => useHistory(), { wrapper });

        act(() => {
            result.current.addEntry({
                input: { MedInc: 5.0, HouseAge: 30, AveRooms: 5.5, AveBedrms: 1.1, Population: 400, AveOccup: 2.8, Latitude: 34.0, Longitude: -118.0 },
                price: 3.5,
                modelVersion: '3',
                processingTime: 50,
            });
        });

        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0].price).toBe(3.5);
        expect(result.current.history[0].id).toBe('test-uuid-1234'); // mocked
        expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('adds new entries at the beginning', () => {
        const { result } = renderHook(() => useHistory(), { wrapper });

        act(() => {
            result.current.addEntry({
                input: { MedInc: 5.0, HouseAge: 30, AveRooms: 5.5, AveBedrms: 1.1, Population: 400, AveOccup: 2.8, Latitude: 34.0, Longitude: -118.0 },
                price: 3.5,
                modelVersion: '3',
                processingTime: 50,
            });
        });

        act(() => {
            result.current.addEntry({
                input: { MedInc: 8.0, HouseAge: 40, AveRooms: 7.0, AveBedrms: 1.2, Population: 500, AveOccup: 3.0, Latitude: 35.0, Longitude: -119.0 },
                price: 5.0,
                modelVersion: '3',
                processingTime: 60,
            });
        });

        expect(result.current.history).toHaveLength(2);
        expect(result.current.history[0].price).toBe(5.0); // newest first
        expect(result.current.history[1].price).toBe(3.5);
    });

    it('clears history', () => {
        const { result } = renderHook(() => useHistory(), { wrapper });

        act(() => {
            result.current.addEntry({
                input: { MedInc: 5.0, HouseAge: 30, AveRooms: 5.5, AveBedrms: 1.1, Population: 400, AveOccup: 2.8, Latitude: 34.0, Longitude: -118.0 },
                price: 3.5,
                modelVersion: '3',
                processingTime: 50,
            });
        });

        act(() => {
            result.current.clearHistory();
        });

        expect(result.current.history).toHaveLength(0);
        expect(localStorage.removeItem).toHaveBeenCalledWith('mlops_prediction_history');
    });

    it('throws error when used outside provider', () => {
        expect(() => {
            renderHook(() => useHistory());
        }).toThrow('useHistory must be used within a HistoryProvider');
    });
});
