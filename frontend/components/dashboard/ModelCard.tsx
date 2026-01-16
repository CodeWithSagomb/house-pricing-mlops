'use client';

import { useModelMetadata } from '@/lib/hooks/useApi';
import { Box, GitBranch } from 'lucide-react';

/**
 * ModelCard Component - Dark Teal Theme
 * 3D gradient cube icon with champion badge
 */
export function ModelCard() {
    const { data: model, isLoading, isError } = useModelMetadata();

    return (
        <div className="glass-card p-6 animate-fade-in animate-stagger-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <span className="card-header">Active Model</span>
                {model?.configured_alias && (
                    <span className="status-badge-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        @{model.configured_alias}
                    </span>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-3">
                    <div className="h-12 bg-navy-700/50 rounded animate-pulse" />
                    <div className="h-4 bg-navy-700/30 rounded w-3/4 animate-pulse" />
                </div>
            ) : isError || !model ? (
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-navy-700/50">
                        <Box className="w-6 h-6 text-slate-500" />
                    </div>
                    <span className="text-slate-500">No model loaded</span>
                </div>
            ) : (
                <>
                    {/* Model Display */}
                    <div className="flex items-center gap-4 mb-4">
                        {/* 3D Gradient Cube Icon */}
                        <div className="relative">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-glow-teal flex items-center justify-center">
                                <Box className="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <div>
                            <p className="text-4xl font-bold text-white">
                                v{model.version}
                            </p>
                            <p className="text-sm text-slate-400">
                                {model.model_name || 'HousePricing_random_forest'}
                            </p>
                        </div>
                    </div>

                    {/* Run ID */}
                    {model.run_id && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <GitBranch className="w-4 h-4" />
                            <span className="font-mono text-xs">
                                Run: {model.run_id.substring(0, 12)}...
                            </span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
