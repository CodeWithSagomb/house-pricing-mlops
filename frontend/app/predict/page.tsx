'use client';

import { useState } from 'react';
import { usePredict } from '@/lib/hooks/useApi';
import { useApiKey } from '@/lib/contexts/ApiKeyContext';
import { useHistory } from '@/lib/contexts/HistoryContext';
import { PredictionInput } from '@/lib/api';
import { Send, Key, DollarSign, Info, FileSpreadsheet, Clock, Zap } from 'lucide-react';
import { BatchUpload } from '@/components/predict/BatchUpload';
import { PredictionHistory } from '@/components/predict/PredictionHistory';

type Tab = 'single' | 'batch' | 'history';

/**
 * Prediction Page - Enhanced with tabs
 * Single prediction, Batch upload, and History
 */
export default function PredictPage() {
    const [activeTab, setActiveTab] = useState<Tab>('single');
    const { apiKey, setApiKey, isConfigured } = useApiKey();
    const { addEntry } = useHistory();
    const predictMutation = usePredict();

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
        if (!isConfigured) return;
        predictMutation.mutate(
            { input, apiKey },
            {
                onSuccess: (data) => {
                    addEntry({
                        input,
                        price: data.predicted_price,
                        modelVersion: data.model_version,
                        processingTime: data.processing_time_ms,
                    });
                },
            }
        );
    };

    const handleInputChange = (field: keyof PredictionInput, value: string) => {
        setInput((prev) => ({
            ...prev,
            [field]: parseFloat(value) || 0,
        }));
    };

    const tabs = [
        { id: 'single' as Tab, label: 'Single', icon: Zap },
        { id: 'batch' as Tab, label: 'Batch', icon: FileSpreadsheet },
        { id: 'history' as Tab, label: 'History', icon: Clock },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Price Prediction
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Predict house prices using ML model
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab content */}
            {activeTab === 'single' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                            {/* API Key */}
                            <div className="mb-6">
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Key className="w-4 h-4" />
                                    API Key
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your API key (saved locally)"
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                                {isConfigured && (
                                    <p className="text-xs text-emerald-500 mt-1">✓ API key saved</p>
                                )}
                            </div>

                            {/* Features grid */}
                            <div className="space-y-4">
                                {(Object.keys(input) as Array<keyof PredictionInput>).map((key) => (
                                    <div key={key} className="grid grid-cols-3 gap-4 items-center">
                                        <div>
                                            <label className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {key}
                                                <Info className="w-3 h-3 text-slate-400" />
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
                                disabled={predictMutation.isPending || !isConfigured}
                                className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors"
                            >
                                <Send className="w-4 h-4" />
                                {predictMutation.isPending ? 'Predicting...' : 'Get Prediction'}
                            </button>
                        </form>
                    </div>

                    {/* Result panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 sticky top-6">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                                Prediction Result
                            </h2>

                            {predictMutation.isSuccess && predictMutation.data ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                                            <DollarSign className="w-4 h-4" />
                                            <span className="text-sm">Estimated Price</span>
                                        </div>
                                        <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-300">
                                            ${(predictMutation.data.predicted_price * 100000).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 dark:text-slate-400">Model Version</span>
                                            <span className="text-slate-900 dark:text-white font-medium">v{predictMutation.data.model_version}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 dark:text-slate-400">Processing Time</span>
                                            <span className="text-slate-900 dark:text-white font-medium">{predictMutation.data.processing_time_ms.toFixed(1)}ms</span>
                                        </div>
                                    </div>
                                </div>
                            ) : predictMutation.isPending ? (
                                <div className="space-y-3">
                                    <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                </div>
                            ) : (
                                <p className="text-slate-400 dark:text-slate-500 text-sm">
                                    Enter features and click "Get Prediction" to see results
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'batch' && <BatchUpload />}

            {activeTab === 'history' && <PredictionHistory />}
        </div>
    );
}
