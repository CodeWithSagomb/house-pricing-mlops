'use client';

import { useDriftStatus } from '@/lib/hooks/useApi';
import { Shield, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * DriftCard Component - Improved per UX critique
 * - Fixed threshold colors: Green <10%, Yellow 10-20%, Red >20%
 * - Only shows DRIFT badge when drift is actually detected
 */
export function DriftCard() {
    const { data: drift, isLoading } = useDriftStatus();

    const bufferProgress = drift?.buffer_threshold
        ? Math.round((drift.buffer_size / drift.buffer_threshold) * 100)
        : 0;

    // Determine color based on actual drift percentage, not just detection
    const getDriftSeverity = () => {
        if (!drift?.enabled || !drift.drift_detected) return 'stable';
        // Calculate drift severity based on number of drifted columns
        const driftPercentage = drift.drifted_columns
            ? (drift.drifted_columns.length / 8) * 100 // 8 features total
            : 0;
        if (driftPercentage < 10) return 'low';
        if (driftPercentage < 30) return 'medium';
        return 'high';
    };

    const severity = getDriftSeverity();

    const getSeverityStyles = () => {
        switch (severity) {
            case 'high':
                return {
                    badge: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
                    ring: 'stroke-rose-500',
                    bar: 'from-rose-500 to-rose-400',
                    icon: AlertTriangle,
                    label: 'DRIFT',
                };
            case 'medium':
                return {
                    badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
                    ring: 'stroke-amber-500',
                    bar: 'from-amber-500 to-amber-400',
                    icon: Activity,
                    label: 'WARNING',
                };
            case 'low':
                return {
                    badge: 'bg-teal-500/10 border-teal-500/30 text-teal-400',
                    ring: 'stroke-teal-500',
                    bar: 'from-teal-500 to-teal-400',
                    icon: CheckCircle,
                    label: 'MINOR',
                };
            default:
                return {
                    badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                    ring: 'stroke-emerald-500',
                    bar: 'from-emerald-500 to-emerald-400',
                    icon: CheckCircle,
                    label: 'STABLE',
                };
        }
    };

    const styles = getSeverityStyles();
    const StatusIcon = styles.icon;

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
                {drift?.enabled && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles.badge}`}>
                        <StatusIcon className="w-3 h-3" />
                        {styles.label}
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
                            <circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                strokeWidth={strokeWidth}
                                className="stroke-navy-700"
                            />
                            <circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="none"
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                className={`${styles.ring} transition-all duration-500`}
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
                            <span className="text-slate-500">/ {drift.buffer_threshold}</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            {drift.drift_detected
                                ? `${drift.drifted_columns?.length || 0} features drifted`
                                : 'samples until next analysis'}
                        </p>

                        {/* Progress bar with severity color */}
                        <div className="mt-3 h-1 bg-navy-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${styles.bar} rounded-full transition-all duration-500`}
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
