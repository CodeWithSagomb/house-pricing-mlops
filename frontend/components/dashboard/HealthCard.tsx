'use client';

import { useHealth } from '@/lib/hooks/useApi';
import { Activity, AlertCircle } from 'lucide-react';

/**
 * HealthCard Component - Refactored
 * Uses React Query for automatic caching and refresh
 */
export function HealthCard() {
    const { data: health, isLoading, isError, error } = useHealth();

    const isHealthy = health?.status === 'ok';

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    System Health
                </h3>
                {isLoading ? (
                    <div className="w-3 h-3 rounded-full bg-slate-300 animate-pulse" />
                ) : (
                    <div
                        className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                    />
                )}
            </div>

            {isError ? (
                <div className="flex items-center gap-2 text-rose-500">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{(error as Error)?.message || 'Connection failed'}</span>
                </div>
            ) : isLoading ? (
                <div className="space-y-2">
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 animate-pulse" />
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-2">
                        <Activity className={`w-6 h-6 ${isHealthy ? 'text-emerald-500' : 'text-rose-500'}`} />
                        <p className={`text-2xl font-bold ${isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {isHealthy ? 'Operational' : 'Degraded'}
                        </p>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Model v{health?.model_version || 'N/A'}
                    </p>
                </>
            )}
        </div>
    );
}
