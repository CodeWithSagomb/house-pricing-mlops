'use client';

import { useState } from 'react';
import { usePredict } from '@/lib/hooks/useApi';
import { useApiKey } from '@/lib/contexts/ApiKeyContext';
import { Send, DollarSign, Zap, Clock } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

/**
 * QuickPredict Component - Premium redesign
 * Compact prediction widget with animated result
 */
export function QuickPredict() {
    const { apiKey, isConfigured } = useApiKey();
    const predictMutation = usePredict();

    const [input] = useState({
        MedInc: 8.3,
        HouseAge: 41,
        AveRooms: 6.9,
        AveBedrms: 1.0,
        Population: 322,
        AveOccup: 2.5,
        Latitude: 37.88,
        Longitude: -122.23,
    });

    const handlePredict = () => {
        if (!isConfigured) return;
        predictMutation.mutate({ input, apiKey });
    };

    return (
        <GlassCard className="animate-fade-in animate-stagger-3">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Input Preview */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-primary-500" />
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                            Quick Prediction
                        </h3>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-4">
                        {Object.entries(input).slice(0, 4).map(([key, value]) => (
                            <div
                                key={key}
                                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-center"
                            >
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                    {key}
                                </p>
                                <p className="font-semibold text-slate-800 dark:text-white">
                                    {typeof value === 'number' ? value.toFixed(1) : value}
                                </p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handlePredict}
                        disabled={predictMutation.isPending || !isConfigured}
                        className="btn-primary w-full"
                    >
                        <Send className="w-4 h-4" />
                        {predictMutation.isPending ? 'Predicting...' : 'Get Price Estimate'}
                    </button>

                    {!isConfigured && (
                        <p className="text-xs text-amber-500 mt-2 text-center">
                            Configure API key in Settings first
                        </p>
                    )}
                </div>

                {/* Result */}
                <div className="lg:w-64 flex flex-col justify-center">
                    {predictMutation.isSuccess && predictMutation.data ? (
                        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                                <DollarSign className="w-5 h-5" />
                                <span className="text-sm font-medium">Estimated Price</span>
                            </div>
                            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 animate-fade-in">
                                ${(predictMutation.data.predicted_price * 100000).toLocaleString()}
                            </p>
                            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-emerald-600/70 dark:text-emerald-400/70">
                                <span>v{predictMutation.data.model_version}</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {predictMutation.data.processing_time_ms.toFixed(0)}ms
                                </span>
                            </div>
                        </div>
                    ) : predictMutation.isPending ? (
                        <div className="text-center p-6 rounded-xl bg-slate-50 dark:bg-slate-700/30 animate-pulse">
                            <div className="h-6 bg-slate-200 dark:bg-slate-600 rounded mb-2 mx-auto w-24" />
                            <div className="h-8 bg-slate-200 dark:bg-slate-600 rounded mx-auto w-32" />
                        </div>
                    ) : (
                        <div className="text-center p-6 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <DollarSign className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="text-sm text-slate-400 dark:text-slate-500">
                                Click predict to see result
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}
