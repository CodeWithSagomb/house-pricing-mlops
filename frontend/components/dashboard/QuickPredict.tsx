'use client';

import { useState } from 'react';
import { usePredict } from '@/lib/hooks/useApi';
import { useApiKey } from '@/lib/contexts/ApiKeyContext';
import { Send, Key, DollarSign } from 'lucide-react';
import { PredictionInput } from '@/lib/api';

/**
 * QuickPredict Component - Refactored
 * Uses API Key context and React Query mutation
 */
export function QuickPredict() {
    const { apiKey, setApiKey, isConfigured } = useApiKey();
    const predictMutation = usePredict();

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
        if (!isConfigured) return;
        predictMutation.mutate({ input, apiKey });
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
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        <Key className="w-4 h-4" />
                        API Key
                    </label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your API key (saved locally)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {isConfigured && (
                        <p className="text-xs text-emerald-500 mt-1">✓ API key saved</p>
                    )}
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
                    disabled={predictMutation.isPending || !isConfigured}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors"
                >
                    <Send className="w-4 h-4" />
                    {predictMutation.isPending ? 'Predicting...' : 'Predict Price'}
                </button>

                {/* Result */}
                {predictMutation.isSuccess && predictMutation.data && (
                    <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm">Prediction Result</span>
                        </div>
                        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                            ${(predictMutation.data.predicted_price * 100000).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Model v{predictMutation.data.model_version} | {predictMutation.data.processing_time_ms.toFixed(1)}ms
                        </p>
                    </div>
                )}
            </form>
        </div>
    );
}
