'use client';

import { useDriftStatus } from '@/lib/hooks/useApi';
import { TrendingUp, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressRing, Badge, StatusIndicator } from '@/components/ui/StatusIndicator';

/**
 * DriftCard Component - Premium redesign
 * Uses circular progress ring for buffer visualization
 */
export function DriftCard() {
    const { data: drift, isLoading } = useDriftStatus();

    const bufferProgress = drift
        ? Math.round((drift.buffer_size / drift.buffer_threshold) * 100)
        : 0;

    const getVariant = () => {
        if (!drift?.enabled) return 'default';
        if (drift.drift_detected) return 'danger';
        return 'success';
    };

    return (
        <GlassCard
            variant={getVariant()}
            glow
            className="animate-fade-in animate-stagger-2"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Drift Monitor
                </h3>
                {drift?.enabled && (
                    <Badge
                        variant={drift.drift_detected ? 'danger' : 'success'}
                        size="sm"
                    >
                        {drift.drift_detected ? (
                            <>
                                <AlertTriangle className="w-3 h-3" />
                                DRIFT
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-3 h-3" />
                                STABLE
                            </>
                        )}
                    </Badge>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-3">
                    <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                </div>
            ) : drift?.enabled ? (
                <div className="flex items-center gap-4">
                    {/* Progress Ring */}
                    <ProgressRing
                        progress={bufferProgress}
                        size={70}
                        strokeWidth={6}
                        variant={bufferProgress >= 100 ? 'success' : 'primary'}
                    />

                    {/* Stats */}
                    <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                {drift.buffer_size}
                            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                / {drift.buffer_threshold}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            samples until next analysis
                        </p>

                        {/* Mini progress bar */}
                        <div className="mt-3 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ease-out rounded-full ${bufferProgress >= 100
                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                        : 'bg-gradient-to-r from-primary-500 to-primary-400'
                                    }`}
                                style={{ width: `${Math.min(bufferProgress, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                        <Shield className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Monitoring disabled
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Make predictions to enable drift detection
                        </p>
                    </div>
                </div>
            )}
        </GlassCard>
    );
}
