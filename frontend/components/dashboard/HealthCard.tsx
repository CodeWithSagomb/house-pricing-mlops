'use client';

import { useHealth } from '@/lib/hooks/useApi';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * HealthCard Component - Dark Teal Theme
 * Matches reference design with wave chart and status badge
 */
export function HealthCard() {
    const { data: health, isLoading, isError } = useHealth();

    const isHealthy = health?.status === 'ok';

    return (
        <div className="glass-card p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <span className="card-header">System Health</span>
                <div className={`w-2.5 h-2.5 rounded-full ${isLoading ? 'bg-slate-400 animate-pulse' :
                        isHealthy ? 'bg-emerald-500 shadow-glow-green' : 'bg-rose-500'
                    }`} />
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-3">
                    <div className="h-8 bg-navy-700/50 rounded animate-pulse" />
                    <div className="h-12 bg-navy-700/30 rounded animate-pulse" />
                </div>
            ) : (
                <>
                    {/* Status Display */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${isHealthy
                                ? 'bg-emerald-500/10'
                                : 'bg-rose-500/10'
                            }`}>
                            {isHealthy ? (
                                <Wifi className="w-6 h-6 text-emerald-400" />
                            ) : (
                                <WifiOff className="w-6 h-6 text-rose-400" />
                            )}
                        </div>
                        <span className={`text-2xl font-bold ${isHealthy
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}>
                            {isHealthy ? 'Operational' : 'Connection Failed'}
                        </span>
                    </div>

                    {/* Wave Chart Visualization */}
                    <div className="h-12 relative overflow-hidden rounded-lg bg-navy-700/30">
                        <svg
                            className="absolute inset-0 w-full h-full"
                            viewBox="0 0 200 50"
                            preserveAspectRatio="none"
                        >
                            <defs>
                                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="rgba(20, 184, 166, 0.4)" />
                                    <stop offset="100%" stopColor="rgba(20, 184, 166, 0)" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M0,35 Q25,20 50,30 T100,25 T150,32 T200,28 L200,50 L0,50 Z"
                                fill="url(#waveGradient)"
                            />
                            <path
                                d="M0,35 Q25,20 50,30 T100,25 T150,32 T200,28"
                                fill="none"
                                stroke="rgba(20, 184, 166, 0.8)"
                                strokeWidth="2"
                            />
                        </svg>
                    </div>

                    {/* Model Version Badge */}
                    {health?.model_version && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="status-badge-success">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Model v{health.model_version}
                            </span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
