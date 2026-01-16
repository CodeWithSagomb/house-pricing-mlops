'use client';

import { useHealth } from '@/lib/hooks/useApi';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusIndicator, Badge } from '@/components/ui/StatusIndicator';

/**
 * HealthCard Component - Premium redesign
 * Uses GlassCard with animated status indicator
 */
export function HealthCard() {
    const { data: health, isLoading, isError } = useHealth();

    const isHealthy = health?.status === 'ok';

    const getStatus = () => {
        if (isLoading) return 'loading';
        if (isError || !isHealthy) return 'error';
        return 'healthy';
    };

    const getStatusLabel = () => {
        if (isLoading) return 'Checking...';
        if (isError) return 'Connection Failed';
        return isHealthy ? 'Operational' : 'Degraded';
    };

    return (
        <GlassCard
            variant={isHealthy ? 'success' : isError ? 'danger' : 'default'}
            glow
            className="animate-fade-in"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    System Health
                </h3>
                <StatusIndicator status={getStatus()} size="md" />
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-3">
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 animate-pulse" />
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${isHealthy
                                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                : 'bg-rose-100 dark:bg-rose-900/30'
                            }`}>
                            {isHealthy ? (
                                <Wifi className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <WifiOff className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                            )}
                        </div>
                        <div>
                            <p className={`text-2xl font-bold ${isHealthy
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}>
                                {getStatusLabel()}
                            </p>
                        </div>
                    </div>

                    {/* Model version badge */}
                    {health?.model_version && (
                        <Badge variant={isHealthy ? 'success' : 'danger'} size="sm">
                            <Activity className="w-3 h-3" />
                            Model v{health.model_version}
                        </Badge>
                    )}

                    {isError && (
                        <p className="text-sm text-rose-500 dark:text-rose-400 mt-2">
                            Unable to connect to API
                        </p>
                    )}
                </>
            )}
        </GlassCard>
    );
}
