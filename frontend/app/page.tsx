'use client';

import { useState } from 'react';
import { useHealth, useModelMetadata, useDriftStatus, usePredict } from '@/lib/hooks/useApi';
import { useApiKey } from '@/lib/contexts/ApiKeyContext';
import {
    Wifi, WifiOff, Layers, Activity, Send, DollarSign,
    TrendingUp, Clock, Zap, Home, Users, Hash, AlertTriangle
} from 'lucide-react';

/**
 * Premium Cyberpunk Dashboard
 * Deep dark theme with neon accents and glassmorphism
 */
export default function DashboardPage() {
    const { data: health, isLoading: healthLoading } = useHealth();
    const { data: model, isLoading: modelLoading } = useModelMetadata();
    const { data: drift, isLoading: driftLoading } = useDriftStatus();
    const { apiKey, isConfigured } = useApiKey();
    const predictMutation = usePredict();

    const [input] = useState({
        MedInc: 8.3,
        HouseAge: 41.0,
        AveRooms: 6.9,
        AveBedrms: 1.0,
        Population: 322,
        AveOccup: 2.5,
        Latitude: 37.88,
        Longitude: -122.23,
    });

    const handlePredict = () => {
        if (!isConfigured) return;
        predictMutation.mutate({ input, apiKey });
    };

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(Math.round(price * 100000));
    };

    const isHealthy = health?.status === 'ok';
    const bufferProgress = drift?.buffer_threshold
        ? Math.round((drift.buffer_size / drift.buffer_threshold) * 100)
        : 0;

    return (
        <div className="space-y-8">
            {/* ========== HEADER ========== */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gradient-cyber mb-2">
                    Dashboard
                </h1>
                <p className="text-slate-400">
                    Real-time overview of ML system
                </p>
            </div>

            {/* ========== KPI GRID ========== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Card 1: System Health */}
                <div className="glass-card p-6 glow-green">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            System Health
                        </span>
                        <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-400 animate-pulse-glow' : 'bg-red-400'}`} />
                    </div>

                    {healthLoading ? (
                        <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
                    ) : (
                        <>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-xl bg-green-500/10 glow-green">
                                    {isHealthy ? (
                                        <Wifi className="w-7 h-7 text-neon-green" />
                                    ) : (
                                        <WifiOff className="w-7 h-7 text-red-400" />
                                    )}
                                </div>
                                <span className={`text-2xl font-bold ${isHealthy ? 'text-neon-green' : 'text-red-400'}`}>
                                    {isHealthy ? 'Operational' : 'Offline'}
                                </span>
                            </div>

                            {/* Wave decoration */}
                            <div className="relative h-12 overflow-hidden rounded-lg">
                                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 50" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="waveGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="rgba(74, 222, 128, 0.3)" />
                                            <stop offset="100%" stopColor="rgba(74, 222, 128, 0)" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M0,30 Q30,15 60,28 T120,22 T180,30 T200,25 L200,50 L0,50 Z" fill="url(#waveGreen)" />
                                    <path d="M0,30 Q30,15 60,28 T120,22 T180,30 T200,25" fill="none" stroke="rgba(74, 222, 128, 0.6)" strokeWidth="1.5" />
                                </svg>
                            </div>

                            {health?.model_version && (
                                <div className="mt-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                        <TrendingUp className="w-3 h-3" />
                                        Model v{health.model_version}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Card 2: Active Model */}
                <div className="glass-card p-6 glow-cyan">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            Active Model
                        </span>
                        {model?.configured_alias && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                @{model.configured_alias}
                            </span>
                        )}
                    </div>

                    {modelLoading ? (
                        <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
                    ) : model ? (
                        <>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-xl bg-cyan-500/10 glow-cyan">
                                    <Layers className="w-7 h-7 text-neon-cyan" />
                                </div>
                                <div>
                                    <span className="text-4xl font-bold font-mono-data text-neon-cyan">
                                        v{model.version}
                                    </span>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {model.model_name}
                                    </p>
                                </div>
                            </div>

                            {model.run_id && (
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono-data">
                                    <Hash className="w-3 h-3" />
                                    Run: {model.run_id.substring(0, 12)}...
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-slate-500">No model loaded</p>
                    )}
                </div>

                {/* Card 3: Drift Monitor */}
                <div className={`glass-card p-6 ${drift?.drift_detected ? 'glow-orange' : 'glow-yellow'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            Drift Monitor
                        </span>
                        {drift?.enabled && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${drift.drift_detected
                                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}>
                                {drift.drift_detected ? (
                                    <><AlertTriangle className="w-3 h-3" /> DRIFT</>
                                ) : (
                                    'STABLE'
                                )}
                            </span>
                        )}
                    </div>

                    {driftLoading ? (
                        <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
                    ) : drift?.enabled ? (
                        <div className="flex items-center gap-4">
                            {/* Circular Progress */}
                            <div className="relative w-16 h-16">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                    <circle
                                        cx="18" cy="18" r="15" fill="none"
                                        stroke={drift.drift_detected ? '#f59e0b' : '#22d3ee'}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeDasharray={`${bufferProgress} 100`}
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold font-mono-data text-white">
                                    {bufferProgress}%
                                </span>
                            </div>

                            <div>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-3xl font-bold font-mono-data ${drift.drift_detected ? 'text-neon-orange' : 'text-neon-cyan'}`}>
                                        {drift.buffer_size}
                                    </span>
                                    <span className="text-slate-500">/ {drift.buffer_threshold}</span>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">
                                    samples until analysis
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Activity className="w-6 h-6 text-slate-500" />
                            <p className="text-slate-500">Monitoring disabled</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ========== PREDICTION SECTION ========== */}
            <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 rounded-lg bg-teal-500/10">
                        <Zap className="w-5 h-5 text-teal-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Quick Prediction</h2>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Input Grid */}
                    <div className="flex-1 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { key: 'MedInc', label: 'MedInc', value: input.MedInc, icon: DollarSign, unit: '×$10k' },
                                { key: 'HouseAge', label: 'HouseAge', value: input.HouseAge, icon: Home, unit: 'years' },
                                { key: 'AveRooms', label: 'AveRooms', value: input.AveRooms, icon: Layers, unit: 'rooms' },
                                { key: 'AveBedrms', label: 'AveBedrms', value: input.AveBedrms, icon: Users, unit: 'beds' },
                            ].map((field) => {
                                const Icon = field.icon;
                                return (
                                    <div key={field.key} className="relative">
                                        <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wider">
                                            {field.label}
                                        </label>
                                        <div className="glass-input flex items-center justify-between">
                                            <span className="text-xl font-bold font-mono-data text-white">
                                                {field.value.toFixed(1)}
                                            </span>
                                            <Icon className="w-5 h-5 text-slate-500" />
                                        </div>
                                        <span className="absolute -bottom-5 right-2 text-xs text-slate-600">
                                            {field.unit}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Predict Button */}
                        <button
                            onClick={handlePredict}
                            disabled={predictMutation.isPending || !isConfigured}
                            className="btn-neon w-full flex items-center justify-center gap-3 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                            {predictMutation.isPending ? 'Predicting...' : 'Get Price Estimate'}
                        </button>

                        {!isConfigured && (
                            <p className="text-xs text-amber-400 text-center mt-2">
                                Configure API key in Settings first
                            </p>
                        )}
                    </div>

                    {/* Result Panel */}
                    <div className="lg:w-64">
                        {predictMutation.isSuccess && predictMutation.data ? (
                            <div className="glass-card h-full flex flex-col items-center justify-center p-8 glow-green">
                                <DollarSign className="w-12 h-12 text-neon-orange mb-4" />
                                <p className="text-4xl font-bold font-mono-data text-neon-green">
                                    {formatPrice(predictMutation.data.predicted_price)}
                                </p>
                                <p className="text-xs text-slate-500 mt-2">Estimated Value</p>
                                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                                    <span className="px-2 py-1 rounded bg-white/5">
                                        v{predictMutation.data.model_version}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {predictMutation.data.processing_time_ms.toFixed(0)}ms
                                    </span>
                                </div>
                            </div>
                        ) : predictMutation.isPending ? (
                            <div className="glass-card h-full flex items-center justify-center p-8">
                                <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="glass-card h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10">
                                <DollarSign className="w-12 h-12 text-neon-orange/30 mb-4" />
                                <p className="text-sm text-slate-500 text-center">
                                    Click predict to see result
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
