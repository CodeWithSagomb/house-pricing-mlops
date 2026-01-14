'use client';

import { useDriftStatus } from '@/lib/hooks/useApi';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * DriftCard Component - Refactored
 * Uses React Query for auto-refresh every 10s
 */
export function DriftCard() {
    const { data: drift, isLoading } = useDriftStatus();

    const bufferProgress = drift
        ? Math.round((drift.buffer_size / drift.buffer_threshold) * 100)
        : 0;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Drift Monitor
                </h3>
                {drift?.enabled && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${drift.drift_detected
                            ? 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300'
                            : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                        }`}>
                        {drift.drift_detected ? (
                            <><AlertTriangle className="w-3 h-3" /> DRIFT</>
                        ) : (
                            <><CheckCircle className="w-3 h-3" /> STABLE</>
                        )}
                    </span>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
            ) : drift?.enabled ? (
                <>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary-500" />
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                {drift.buffer_size}
                            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                / {drift.buffer_threshold}
                            </span>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${bufferProgress >= 100 ? 'bg-emerald-500' : 'bg-primary-500'
                                }`}
                            style={{ width: `${Math.min(bufferProgress, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                        {bufferProgress}% to next analysis
                    </p>
                </>
            ) : (
                <p className="text-slate-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Monitoring disabled
                </p>
            )}
        </div>
    );
}
