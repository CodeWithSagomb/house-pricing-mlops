'use client';

import { useModelMetadata } from '@/lib/hooks/useApi';
import { Box, Tag, GitBranch } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/StatusIndicator';

/**
 * ModelCard Component - Premium redesign
 * Displays active model information with version badge
 */
export function ModelCard() {
    const { data: model, isLoading, isError } = useModelMetadata();

    return (
        <GlassCard
            variant="info"
            glow
            className="animate-fade-in animate-stagger-1"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Active Model
                </h3>
                {model?.configured_alias && (
                    <Badge variant="info" size="sm">
                        <Tag className="w-3 h-3" />
                        @{model.configured_alias}
                    </Badge>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-3">
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse" />
                </div>
            ) : isError || !model ? (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                        <Box className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-400 dark:text-slate-500">No model loaded</p>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg">
                            <Box className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                v{model.version}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {model.model_name || 'HousePricing Model'}
                            </p>
                        </div>
                    </div>

                    {/* Run ID */}
                    {model.run_id && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <GitBranch className="w-4 h-4" />
                            <span className="font-mono text-xs">
                                Run: {model.run_id.substring(0, 12)}...
                            </span>
                        </div>
                    )}
                </>
            )}
        </GlassCard>
    );
}
