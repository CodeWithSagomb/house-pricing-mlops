'use client';

import { useModelMetadata } from '@/lib/hooks/useApi';
import { Box, Tag } from 'lucide-react';

/**
 * ModelCard Component - Refactored
 * Uses React Query for caching
 */
export function ModelCard() {
    const { data: model, isLoading } = useModelMetadata();

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
                Active Model
            </h3>

            {isLoading ? (
                <div className="space-y-2">
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 animate-pulse" />
                </div>
            ) : model ? (
                <>
                    <div className="flex items-center gap-2">
                        <Box className="w-6 h-6 text-primary-500" />
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                            v{model.version}
                        </p>
                    </div>
                    <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-slate-400" />
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                                @{model.configured_alias}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate font-mono">
                            Run: {model.run_id?.slice(0, 12)}...
                        </p>
                    </div>
                </>
            ) : (
                <p className="text-slate-400">No model loaded</p>
            )}
        </div>
    );
}
