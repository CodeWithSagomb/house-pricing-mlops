'use client';

import { useEffect, useState } from 'react';
import { getDriftStatus, DriftStatus, getModelMetadata, ModelMetadata } from '@/lib/api';

/**
 * Monitoring Page - Real-time system monitoring
 * Displays drift status, buffer progress, and alerts
 */
export default function MonitoringPage() {
    const [drift, setDrift] = useState<DriftStatus | null>(null);
    const [model, setModel] = useState<ModelMetadata | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [driftData, modelData] = await Promise.all([
                    getDriftStatus(),
                    getModelMetadata(),
                ]);
                setDrift(driftData);
                setModel(modelData);
            } catch (err) {
                console.error('Failed to fetch monitoring data');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
        const interval = setInterval(fetchData, 5000); // Refresh every 5s
        return () => clearInterval(interval);
    }, []);

    const bufferProgress = drift
        ? Math.round((drift.buffer_size / drift.buffer_threshold) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Monitoring
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Real-time system health and drift detection
                </p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                    {/* Status Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            label="Drift Status"
                            value={drift?.drift_detected ? 'DETECTED' : 'STABLE'}
                            color={drift?.drift_detected ? 'rose' : 'emerald'}
                        />
                        <StatCard
                            label="Buffer Size"
                            value={`${drift?.buffer_size || 0} / ${drift?.buffer_threshold || 100}`}
                            color="primary"
                        />
                        <StatCard
                            label="Samples Analyzed"
                            value={String(drift?.samples_analyzed || 0)}
                            color="slate"
                        />
                        <StatCard
                            label="Model Version"
                            value={`v${model?.version || 'N/A'}`}
                            color="primary"
                        />
                    </div>

                    {/* Drift Buffer Progress */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                            Drift Analysis Buffer
                        </h2>

                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Progress to next analysis</span>
                                <span className="text-slate-900 dark:text-white font-medium">{bufferProgress}%</span>
                            </div>

                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${bufferProgress >= 100
                                            ? 'bg-emerald-500'
                                            : bufferProgress >= 75
                                                ? 'bg-amber-500'
                                                : 'bg-primary-500'
                                        }`}
                                    style={{ width: `${Math.min(bufferProgress, 100)}%` }}
                                />
                            </div>

                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {drift?.buffer_size || 0} predictions collected. Analysis triggers at {drift?.buffer_threshold || 100} samples.
                            </p>
                        </div>
                    </div>

                    {/* Drifted Columns */}
                    {drift?.drifted_columns && drift.drifted_columns.length > 0 && (
                        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-6 border border-rose-200 dark:border-rose-800">
                            <h2 className="text-lg font-semibold text-rose-800 dark:text-rose-200 mb-4">
                                Drifted Columns
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {drift.drifted_columns.map((col) => (
                                    <span
                                        key={col}
                                        className="px-3 py-1 bg-rose-100 dark:bg-rose-800 text-rose-700 dark:text-rose-200 rounded-full text-sm"
                                    >
                                        {col}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* System Info */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                            Model Information
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Model Name</p>
                                <p className="font-medium text-slate-900 dark:text-white">{model?.model_name}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Alias</p>
                                <p className="font-medium text-slate-900 dark:text-white">@{model?.configured_alias}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Source</p>
                                <p className="font-medium text-slate-900 dark:text-white">{model?.source}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400">Loaded At</p>
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {model?.loaded_at ? new Date(model.loaded_at).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Stat Card Component - Reusable (DRY principle)
function StatCard({
    label,
    value,
    color,
}: {
    label: string;
    value: string;
    color: 'emerald' | 'rose' | 'primary' | 'slate' | 'amber';
}) {
    const colorClasses = {
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
        rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300',
        primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300',
        slate: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    };

    return (
        <div className={`rounded-xl p-4 ${colorClasses[color]}`}>
            <p className="text-sm opacity-75">{label}</p>
            <p className="text-xl font-bold mt-1">{value}</p>
        </div>
    );
}
