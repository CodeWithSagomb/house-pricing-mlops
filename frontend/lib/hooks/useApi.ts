/**
 * React Query Hooks - Custom Hooks Pattern
 * =========================================
 * Encapsulates data fetching logic with caching.
 * Each hook follows Single Responsibility Principle.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getHealth,
    getModelMetadata,
    getDriftStatus,
    getABStatus,
    predict,
    predictBatch,
    reloadModel,
    PredictionInput,
} from '@/lib/api';

// Query Keys - centralized for cache invalidation
export const queryKeys = {
    health: ['health'] as const,
    modelMetadata: ['model', 'metadata'] as const,
    driftStatus: ['monitoring', 'drift'] as const,
    abStatus: ['ab', 'status'] as const,
};

/**
 * Hook: useHealth
 * Auto-refreshes every 30 seconds
 */
export function useHealth() {
    return useQuery({
        queryKey: queryKeys.health,
        queryFn: getHealth,
        refetchInterval: 30 * 1000,
    });
}

/**
 * Hook: useModelMetadata
 * Fetches current model information
 */
export function useModelMetadata() {
    return useQuery({
        queryKey: queryKeys.modelMetadata,
        queryFn: getModelMetadata,
    });
}

/**
 * Hook: useDriftStatus
 * Auto-refreshes every 10 seconds for real-time monitoring
 */
export function useDriftStatus() {
    return useQuery({
        queryKey: queryKeys.driftStatus,
        queryFn: getDriftStatus,
        refetchInterval: 10 * 1000,
    });
}

/**
 * Hook: useABStatus
 * Fetches A/B testing configuration
 */
export function useABStatus() {
    return useQuery({
        queryKey: queryKeys.abStatus,
        queryFn: getABStatus,
    });
}

/**
 * Hook: usePredict
 * Mutation for making predictions with toast notifications
 */
export function usePredict() {
    return useMutation({
        mutationFn: ({ input, apiKey }: { input: PredictionInput; apiKey: string }) =>
            predict(input, apiKey),
        onSuccess: (data) => {
            toast.success('Prediction successful', {
                description: `Price: $${(data.predicted_price * 100000).toLocaleString()}`,
            });
        },
        onError: (error: Error) => {
            toast.error('Prediction failed', {
                description: error.message,
            });
        },
    });
}

/**
 * Hook: usePredictBatch
 * Mutation for batch predictions
 */
export function usePredictBatch() {
    return useMutation({
        mutationFn: ({ inputs, apiKey }: { inputs: PredictionInput[]; apiKey: string }) =>
            predictBatch(inputs, apiKey),
        onSuccess: (data) => {
            toast.success('Batch prediction complete', {
                description: `Processed ${data.total} predictions`,
            });
        },
        onError: (error: Error) => {
            toast.error('Batch prediction failed', {
                description: error.message,
            });
        },
    });
}

/**
 * Hook: useReloadModel
 * Mutation for hot-reloading model with cache invalidation
 */
export function useReloadModel() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (apiKey: string) => reloadModel(apiKey),
        onSuccess: () => {
            // Invalidate model-related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.modelMetadata });
            queryClient.invalidateQueries({ queryKey: queryKeys.health });
            toast.success('Model reloaded', {
                description: 'New model version loaded successfully',
            });
        },
        onError: (error: Error) => {
            toast.error('Reload failed', {
                description: error.message,
            });
        },
    });
}
