'use client';

import { useState } from 'react';
import { predict, PredictionInput, PredictionResult } from '@/lib/api';

/**
 * QuickPredict Component - Single Responsibility
 * Handles quick prediction form with minimal fields
 */
export function QuickPredict() {
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Default values for California housing features
    const [input, setInput] = useState<PredictionInput>({
        MedInc: 8.3,
        HouseAge: 41,
        AveRooms: 6.9,
        AveBedrms: 1.0,
        Population: 322,
        AveOccup: 2.5,
        Latitude: 37.88,
        Longitude: -122.23,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey) {
            setError('API Key is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await predict(input, apiKey);
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Prediction failed');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof PredictionInput, value: string) => {
        setInput((prev) => ({
            ...prev,
            [field]: parseFloat(value) || 0,
        }));
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* API Key */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        API Key
                    </label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                {/* Feature inputs grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(input).map(([key, value]) => (
                        <div key={key}>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                {key}
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={value}
                                onChange={(e) => handleInputChange(key as keyof PredictionInput, e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                    ))}
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors"
                >
                    {loading ? 'Predicting...' : 'Predict Price'}
                </button>

                {/* Error message */}
                {error && (
                    <p className="text-rose-500 text-sm">{error}</p>
                )}

                {/* Result */}
                {result && (
                    <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">Prediction Result</p>
                        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                            ${(result.predicted_price * 100000).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Model v{result.model_version} | {result.processing_time_ms.toFixed(1)}ms
                        </p>
                    </div>
                )}
            </form>
        </div>
    );
}
