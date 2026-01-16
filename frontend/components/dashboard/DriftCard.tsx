'use client';

import { useDriftStatus } from '@/lib/hooks/useApi';
import { Shield } from 'lucide-react';

/**
 * DriftCard Component - Dark Teal Theme
 * Circular progress ring with STABLE badge
 */
export function DriftCard() {
    const { data: drift, isLoading } = useDriftStatus();

    const bufferProgress = drift
        ? Math.round((drift.buffer_size / drift.buffer_threshold) * 100)
        : 0;

    // Progress ring calculations
    const size = 60;
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (bufferProgress / 100) * circumference;

    return (
        <div className="glass-card p-6 animate-fade-in animate-stagger-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <span className="card-header">Drift Monitor</span>
                {drift?.enabled && !drift.drift_detected && (
                    <span className="status-badge-stable">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        STABLE
                    </span>
                )}
                {drift?.drift_detected && (
                    <span className="status-badge bg-rose-500/10 border-rose-500/30 text-rose-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        DRIFT
                    </span>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-3">
                    <div className="h-16 bg-navy-700/50 rounded animate-pulse" />
                </div>
            ) : drift?.enabled ? (
                <div className="flex items-center gap-4">
                    {/* Progress Ring */}
                    <div className="relative">
                        <svg width={size} height={size} className="-rotate-90">
                            {/* Background circle */}
                            <circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                strokeWidth={strokeWidth}
                                className="stroke-navy-700"
                            />
                            {/* Progress circle */}
                            <circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                className="stroke-teal-500 transition-all duration-500"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                            {bufferProgress}%
                        </span>
                    </div>

                    {/* Stats */}
                    <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">
                                {drift.buffer_size}
                            </span>
                            <span className="text-slate-500">/ Drift</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            samples until next analysis
                        </p>

                        {/* Progress bar */}
                        <div className="mt-3 h-1 bg-navy-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(bufferProgress, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-navy-700/50">
                        <Shield className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                        <p className="text-slate-400 font-medium">Monitoring disabled</p>
                        <p className="text-xs text-slate-500">Make predictions to enable</p>
                    </div>
                </div>
            )}
        </div>
    );
}
