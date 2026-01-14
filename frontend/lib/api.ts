/**
 * API Client Module - Single Responsibility Principle
 * ====================================================
 * Handles all API communication with the MLOps backend.
 * Each function has one responsibility: making a specific API call.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types for API responses (Interface Segregation)
export interface HealthStatus {
    status: string;
    model_version: string;
}

export interface ModelMetadata {
    model_name: string;
    configured_alias: string;
    version: string;
    name: string;
    source: string;
    run_id: string;
    loaded_at: string;
}

export interface DriftStatus {
    drift_detected: boolean;
    status: string;
    timestamp: string | null;
    drifted_columns: string[];
    samples_analyzed: number;
    enabled: boolean;
    buffer_size: number;
    buffer_threshold: number;
}

export interface ABStatus {
    enabled: boolean;
    config_enabled: boolean;
    traffic_split: number;
    champion: {
        version: string;
        loaded: boolean;
    };
    challenger: {
        alias: string;
        version: string | null;
        loaded: boolean;
    };
}

export interface PredictionInput {
    MedInc: number;
    HouseAge: number;
    AveRooms: number;
    AveBedrms: number;
    Population: number;
    AveOccup: number;
    Latitude: number;
    Longitude: number;
}

export interface PredictionResult {
    predicted_price: number;
    model_version: string;
    processing_time_ms: number;
}

// API Error class (Open/Closed - extensible for different error types)
export class APIError extends Error {
    constructor(
        public status: number,
        message: string
    ) {
        super(message);
        this.name = 'APIError';
    }
}

// Generic fetch wrapper with error handling
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new APIError(response.status, error.detail || 'Request failed');
    }

    return response.json();
}

// Health endpoint
export async function getHealth(): Promise<HealthStatus> {
    return fetchAPI<HealthStatus>('/health');
}

// Model metadata endpoint
export async function getModelMetadata(): Promise<ModelMetadata> {
    return fetchAPI<ModelMetadata>('/model/metadata');
}

// Drift status endpoint
export async function getDriftStatus(): Promise<DriftStatus> {
    return fetchAPI<DriftStatus>('/monitoring/drift-status');
}

// AB testing status endpoint
export async function getABStatus(): Promise<ABStatus> {
    return fetchAPI<ABStatus>('/ab/status');
}

// Prediction endpoint
export async function predict(
    input: PredictionInput,
    apiKey: string
): Promise<PredictionResult> {
    return fetchAPI<PredictionResult>('/predict', {
        method: 'POST',
        headers: {
            'X-API-KEY': apiKey,
        },
        body: JSON.stringify(input),
    });
}

// Batch prediction endpoint
export async function predictBatch(
    inputs: PredictionInput[],
    apiKey: string
): Promise<{ results: { index: number; predicted_price: number }[]; total: number }> {
    return fetchAPI('/predict/batch', {
        method: 'POST',
        headers: {
            'X-API-KEY': apiKey,
        },
        body: JSON.stringify({ predictions: inputs }),
    });
}

// Model reload endpoint
export async function reloadModel(apiKey: string): Promise<{ status: string }> {
    return fetchAPI('/model/reload', {
        method: 'POST',
        headers: {
            'X-API-KEY': apiKey,
        },
    });
}
