'use client';

import { useEffect, useState } from 'react';
import { getHealth, HealthStatus } from '@/lib/api';

/**
 * HealthCard Component - Single Responsibility
 * Displays system health status with auto-refresh
 */
export function HealthCard() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchHealth() {
            try {
                const data = await getHealth();
                setHealth(data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch health status');
            } finally {
                setLoading(false);
            }
        }

        fetchHealth();
        const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const isHealthy = health?.status === 'ok';

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    System Health
                </h3>
                {loading ? (
                    <div className="w-3 h-3 rounded-full bg-slate-300 animate-pulse" />
                ) : (
                    <div
                        className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                    />
                )}
            </div>

            {error ? (
                <p className="text-rose-500 text-sm">{error}</p>
            ) : loading ? (
                <div className="space-y-2">
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 animate-pulse" />
                </div>
            ) : (
                <>
                    <p className={`text-2xl font-bold ${isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isHealthy ? 'Operational' : 'Degraded'}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Model v{health?.model_version || 'N/A'}
                    </p>
                </>
            )}
        </div>
    );
}
