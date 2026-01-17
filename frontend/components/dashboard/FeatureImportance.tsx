'use client';

import { useFeatureImportance } from '@/lib/hooks/useApi';
import { BarChart3, TrendingUp, Info } from 'lucide-react';

/**
 * FeatureImportance Component
 * Displays a horizontal bar chart showing feature importance from the ML model.
 * Supports tree-based models (RandomForest, GradientBoosting) and linear models.
 */
export function FeatureImportance() {
    const { data, isLoading, error } = useFeatureImportance();

    if (isLoading) {
        return (
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-teal-400" />
                    <h3 className="font-semibold text-white">Feature Importance</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data?.supported) {
        return (
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-slate-500" />
                    <h3 className="font-semibold text-white">Feature Importance</h3>
                </div>
                <div className="text-center py-8">
                    <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                        {data?.message || 'Unable to load feature importance'}
                    </p>
                </div>
            </div>
        );
    }

    // Convert importances to sorted array
    const importanceEntries = Object.entries(data.importances || {});
    const maxImportance = Math.max(...importanceEntries.map(([, v]) => v));

    // Feature descriptions for tooltips
    const featureDescriptions: Record<string, string> = {
        MedInc: 'Median income (×$10k)',
        HouseAge: 'Median house age (years)',
        AveRooms: 'Avg rooms per household',
        AveBedrms: 'Avg bedrooms per household',
        Population: 'Block group population',
        AveOccup: 'Avg household occupancy',
        Latitude: 'Geographic latitude',
        Longitude: 'Geographic longitude',
    };

    return (
        <div className="glass-card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-teal-400" />
                    <h3 className="font-semibold text-white">Feature Importance</h3>
                </div>
                <span className="text-xs text-slate-500 font-mono-data">
                    v{data.model_version}
                </span>
            </div>

            {/* Bar Chart */}
            <div className="space-y-3">
                {importanceEntries.map(([feature, importance], index) => {
                    const percentage = (importance / maxImportance) * 100;
                    const isTop = index < 3;

                    return (
                        <div key={feature} className="group">
                            <div className="flex items-center justify-between text-sm mb-1">
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium ${isTop ? 'text-white' : 'text-slate-400'}`}>
                                        {feature}
                                    </span>
                                    <span className="text-xs text-slate-600 hidden group-hover:inline">
                                        {featureDescriptions[feature]}
                                    </span>
                                </div>
                                <span className={`font-mono-data text-xs ${isTop ? 'text-teal-400' : 'text-slate-500'}`}>
                                    {(importance * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${isTop
                                            ? 'bg-gradient-to-r from-teal-500 to-cyan-400'
                                            : 'bg-gradient-to-r from-slate-600 to-slate-500'
                                        }`}
                                    style={{
                                        width: `${percentage}%`,
                                        animationDelay: `${index * 100}ms`,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-teal-400" />
                        <span>Higher = More impact on prediction</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
