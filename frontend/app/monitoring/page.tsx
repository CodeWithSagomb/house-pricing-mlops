'use client';

import { useState } from 'react';
import { useDriftStatus, useModelMetadata } from '@/lib/hooks/useApi';
import {
    TrendingUp, AlertTriangle, CheckCircle, BarChart3, Box, Clock,
    Activity, LineChart, ExternalLink, RefreshCw
} from 'lucide-react';

// Grafana base URL - can be configured via env
const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://localhost:3000';

/**
 * GrafanaPanel Component
 * Embeds a Grafana dashboard panel via iframe
 */
function GrafanaPanel({
    dashboardUid,
    panelId,
    title,
    height = 300,
    theme = 'dark',
}: {
    dashboardUid: string;
    panelId: number;
    title: string;
    height?: number;
    theme?: 'dark' | 'light';
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Grafana embed URL with panel solo view
    const embedUrl = `${GRAFANA_URL}/d-solo/${dashboardUid}?orgId=1&panelId=${panelId}&theme=${theme}&refresh=10s`;

    return (
        <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-teal-400" />
                    <span className="text-sm font-medium text-white">{title}</span>
                </div>
                <a
                    href={`${GRAFANA_URL}/d/${dashboardUid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-teal-400 transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>

            <div className="relative" style={{ height }}>
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-navy-900/50">
                        <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
                    </div>
                )}

                {error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-900/50">
                        <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                        <p className="text-sm text-slate-400">Unable to load Grafana panel</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Ensure Grafana is running at {GRAFANA_URL}
                        </p>
                    </div>
                ) : (
                    <iframe
                        src={embedUrl}
                        width="100%"
                        height={height}
                        frameBorder="0"
                        onLoad={() => setLoading(false)}
                        onError={() => setError(true)}
                        className={loading ? 'opacity-0' : 'opacity-100 transition-opacity'}
                        style={{ background: 'transparent' }}
                    />
                )}
            </div>
        </div>
    );
}

/**
 * Monitoring Page - Enhanced with Grafana Embed
 */
export default function MonitoringPage() {
    const { data: drift, isLoading: driftLoading } = useDriftStatus();
    const { data: model, isLoading: modelLoading } = useModelMetadata();
    const [activeTab, setActiveTab] = useState<'overview' | 'grafana'>('overview');

    const loading = driftLoading || modelLoading;

    const bufferProgress = drift
        ? Math.round((drift.buffer_size / drift.buffer_threshold) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gradient-cyber">Monitoring</h1>
                    <p className="text-slate-500 mt-1">Real-time system health and metrics</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-white/5 rounded-xl p-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview'
                                ? 'bg-teal-500 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Activity className="w-4 h-4 inline mr-2" />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('grafana')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'grafana'
                                ? 'bg-teal-500 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <LineChart className="w-4 h-4 inline mr-2" />
                        Grafana
                    </button>
                </div>
            </div>

            {activeTab === 'overview' ? (
                <>
                    {/* Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            label="Drift Status"
                            value={drift?.drift_detected ? 'DETECTED' : 'STABLE'}
                            icon={drift?.drift_detected ? AlertTriangle : CheckCircle}
                            color={drift?.drift_detected ? 'danger' : 'success'}
                        />
                        <StatCard
                            label="Buffer Size"
                            value={`${drift?.buffer_size || 0} / ${drift?.buffer_threshold || 100}`}
                            icon={BarChart3}
                            color="primary"
                        />
                        <StatCard
                            label="Samples Analyzed"
                            value={String(drift?.samples_analyzed || 0)}
                            icon={TrendingUp}
                            color="default"
                        />
                        <StatCard
                            label="Model Version"
                            value={`v${model?.version || 'N/A'}`}
                            icon={Box}
                            color="primary"
                        />
                    </div>

                    {/* Drift Buffer Progress */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            Drift Analysis Buffer
                        </h2>

                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Progress to next analysis</span>
                                <span className="text-white font-mono-data">{bufferProgress}%</span>
                            </div>

                            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 rounded-full ${bufferProgress >= 100
                                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                            : 'bg-gradient-to-r from-teal-500 to-cyan-400'
                                        }`}
                                    style={{ width: `${Math.min(bufferProgress, 100)}%` }}
                                />
                            </div>

                            <p className="text-sm text-slate-500">
                                {drift?.buffer_size || 0} predictions collected.
                                Analysis triggers at {drift?.buffer_threshold || 100} samples.
                            </p>
                        </div>
                    </div>

                    {/* Drifted Columns Alert */}
                    {drift?.drifted_columns && drift.drifted_columns.length > 0 && (
                        <div className="glass-card p-6 border-l-4 border-orange-500 glow-orange">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5 text-orange-400" />
                                <h2 className="text-lg font-semibold text-orange-300">
                                    Drifted Features ({drift.drifted_columns.length})
                                </h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {drift.drifted_columns.map((col) => (
                                    <span
                                        key={col}
                                        className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm border border-orange-500/30"
                                    >
                                        {col}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Model Info */}
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Model Information</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500">Model Name</p>
                                <p className="font-medium text-white font-mono-data">
                                    {model?.model_name || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500">Alias</p>
                                <p className="font-medium text-teal-400">@{model?.configured_alias || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Source</p>
                                <p className="font-medium text-white">{model?.source || 'N/A'}</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <Clock className="w-4 h-4 text-slate-500 mt-0.5" />
                                <div>
                                    <p className="text-slate-500">Loaded At</p>
                                    <p className="font-medium text-white">
                                        {model?.loaded_at ? new Date(model.loaded_at).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* Grafana Tab */
                <div className="space-y-6">
                    <div className="glass-card p-4">
                        <p className="text-sm text-slate-400">
                            <strong className="text-teal-400">Note:</strong> Grafana panels require Grafana
                            to be running at <code className="text-cyan-400">{GRAFANA_URL}</code> with
                            anonymous access enabled.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GrafanaPanel
                            dashboardUid="api-latency"
                            panelId={1}
                            title="API Latency (p50/p95/p99)"
                            height={350}
                        />
                        <GrafanaPanel
                            dashboardUid="api-latency"
                            panelId={2}
                            title="Current p50 Latency"
                            height={350}
                        />
                    </div>

                    <GrafanaPanel
                        dashboardUid="api-latency"
                        panelId={4}
                        title="Prediction Requests by Status Code"
                        height={300}
                    />

                    {/* Direct Link to Full Grafana */}
                    <div className="glass-card p-6 text-center">
                        <p className="text-slate-400 mb-4">
                            View all dashboards in the full Grafana interface
                        </p>
                        <a
                            href={GRAFANA_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-neon inline-flex items-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open Grafana
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

// Stat Card Component
function StatCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    color: 'success' | 'danger' | 'primary' | 'default';
}) {
    const colorStyles = {
        success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        danger: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
        primary: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
        default: 'bg-white/5 border-white/10 text-slate-300',
    };

    return (
        <div className={`glass-card p-4 border ${colorStyles[color]}`}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 opacity-70" />
                <p className="text-sm opacity-75">{label}</p>
            </div>
            <p className="text-2xl font-bold font-mono-data">{value}</p>
        </div>
    );
}
