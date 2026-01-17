'use client';

import { useState } from 'react';
import { usePredict } from '@/lib/hooks/useApi';
import { useApiKey } from '@/lib/contexts/ApiKeyContext';
import { Send, DollarSign, Zap, Clock, Info } from 'lucide-react';

/**
 * Feature definitions with tooltips explaining each input
 * Based on California Housing dataset
 */
const featureDefinitions = {
    MedInc: {
        label: 'MedInc',
        tooltip: 'Median income in block group (in $10,000s)',
        unit: '×$10k',
        icon: '💰',
    },
    HouseAge: {
        label: 'HouseAge',
        tooltip: 'Median house age in block group (years)',
        unit: 'years',
        icon: '🏠',
    },
    AveRooms: {
        label: 'AveRooms',
        tooltip: 'Average number of rooms per household',
        unit: 'rooms',
        icon: '🛋️',
    },
    AveBedrms: {
        label: 'AveBedrms',
        tooltip: 'Average number of bedrooms per household',
        unit: 'beds',
        icon: '🛏️',
    },
};

/**
 * QuickPredict Component - Improved per UX critique
 * - Price rounded to integer (no decimals)
 * - Feature tooltips with units
 */
export function QuickPredict() {
    const { apiKey, isConfigured } = useApiKey();
    const predictMutation = usePredict();
    const [hoveredField, setHoveredField] = useState<string | null>(null);

    const [input] = useState({
        MedInc: 8.3,
        HouseAge: 41.0,
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

    const fields = Object.entries(featureDefinitions).map(([key, def]) => ({
        key,
        ...def,
        value: input[key as keyof typeof input],
    }));

    // Format price: round to integer, no decimals
    const formatPrice = (price: number): string => {
        const priceInDollars = Math.round(price * 100000);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(priceInDollars);
    };

    return (
        <div className="glass-card p-6 animate-fade-in animate-stagger-3">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-teal-400" />
                <span className="font-semibold text-white">Quick Prediction</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Input Fields Grid with Tooltips */}
                <div className="flex-1">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {fields.map((field) => (
                            <div
                                key={field.key}
                                className="relative p-4 rounded-xl bg-navy-700/50 border border-teal-600/20 cursor-help"
                                onMouseEnter={() => setHoveredField(field.key)}
                                onMouseLeave={() => setHoveredField(null)}
                            >
                                {/* Tooltip */}
                                {hoveredField === field.key && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-navy-800 border border-teal-500/30 rounded-lg shadow-lg z-10 w-48">
                                        <p className="text-xs text-slate-300">{field.tooltip}</p>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy-800" />
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <span>{field.icon}</span>
                                        {field.label}
                                    </span>
                                    <Info className="w-3 h-3 text-slate-600" />
                                </div>
                                <p className="text-xl font-bold text-white">
                                    {typeof field.value === 'number' ? field.value.toFixed(1) : field.value}
                                </p>
                                <p className="text-xs text-slate-600 mt-1">{field.unit}</p>
                            </div>
                        ))}
                    </div>

                    {/* Predict Button */}
                    <button
                        onClick={handlePredict}
                        disabled={predictMutation.isPending || !isConfigured}
                        className="btn-primary w-full disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                        {predictMutation.isPending ? 'Predicting...' : 'Get Price Estimate'}
                    </button>

                    {!isConfigured && (
                        <p className="text-xs text-amber-400 mt-2 text-center">
                            Configure API key in Settings first
                        </p>
                    )}
                </div>

                {/* Result Panel - Rounded price, no decimals */}
                <div className="lg:w-56">
                    {predictMutation.isSuccess && predictMutation.data ? (
                        <div className="h-full flex flex-col justify-center items-center p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                            <DollarSign className="w-10 h-10 text-amber-500 mb-2" />
                            <p className="text-3xl font-bold text-white animate-fade-in">
                                {formatPrice(predictMutation.data.predicted_price)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Estimated value</p>
                            <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                                <span className="px-2 py-0.5 bg-navy-700 rounded">
                                    v{predictMutation.data.model_version}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {predictMutation.data.processing_time_ms.toFixed(0)}ms
                                </span>
                            </div>
                        </div>
                    ) : predictMutation.isPending ? (
                        <div className="h-full flex items-center justify-center p-6 rounded-xl bg-navy-700/30 animate-pulse">
                            <div className="text-center">
                                <div className="h-8 w-24 bg-navy-600 rounded mb-2 mx-auto" />
                                <div className="h-4 w-16 bg-navy-600 rounded mx-auto" />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-teal-600/20">
                            <DollarSign className="w-10 h-10 text-amber-500/50 mb-2" />
                            <p className="text-sm text-slate-500 text-center">
                                Click predict to see result
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
