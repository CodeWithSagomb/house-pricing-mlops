'use client';

import { useState } from 'react';
import { predict, PredictionInput, PredictionResult } from '@/lib/api';

/**
 * Prediction Page - Full prediction interface
 * Allows detailed feature input and displays comprehensive results
 */
export default function PredictPage() {
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    const featureDescriptions: Record<keyof PredictionInput, string> = {
        MedInc: 'Median income in block (tens of thousands)',
        HouseAge: 'Median house age in block',
        AveRooms: 'Average number of rooms',
        AveBedrms: 'Average number of bedrooms',
        Population: 'Block population',
        AveOccup: 'Average household size',
        Latitude: 'Latitude coordinate',
        Longitude: 'Longitude coordinate',
    };

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
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Price Prediction
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Enter house features to get a price prediction
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        {/* API Key */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                API Key
                            </label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter your API key"
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>

                        {/* Features grid */}
                        <div className="space-y-4">
                            {(Object.keys(input) as Array<keyof PredictionInput>).map((key) => (
                                <div key={key} className="grid grid-cols-3 gap-4 items-center">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {key}
                                        </label>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">
                                            {featureDescriptions[key]}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={input[key]}
                                            onChange={(e) => handleInputChange(key, e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-6 w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors"
                        >
                            {loading ? 'Predicting...' : 'Get Prediction'}
                        </button>

                        {error && (
                            <p className="mt-4 text-rose-500 text-sm">{error}</p>
                        )}
                    </form>
                </div>

                {/* Result panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 sticky top-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                            Prediction Result
                        </h2>

                        {result ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400">Estimated Price</p>
                                    <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                                        ${(result.predicted_price * 100000).toLocaleString()}
                                    </p>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Model Version</span>
                                        <span className="text-slate-900 dark:text-white font-medium">v{result.model_version}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">Processing Time</span>
                                        <span className="text-slate-900 dark:text-white font-medium">{result.processing_time_ms.toFixed(1)}ms</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-400 dark:text-slate-500 text-sm">
                                Enter features and click "Get Prediction" to see results
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
