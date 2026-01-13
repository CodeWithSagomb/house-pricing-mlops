'use client';

import { useEffect, useState } from 'react';
import { getModelMetadata, ModelMetadata, reloadModel } from '@/lib/api';

/**
 * Models Page - Model management interface
 * Displays model info and allows hot reload
 */
export default function ModelsPage() {
    const [model, setModel] = useState<ModelMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [reloading, setReloading] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchModel();
    }, []);

    async function fetchModel() {
        try {
            const data = await getModelMetadata();
            setModel(data);
        } catch (err) {
            console.error('Failed to fetch model');
        } finally {
            setLoading(false);
        }
    }

    async function handleReload() {
        if (!apiKey) {
            setMessage({ type: 'error', text: 'API Key is required' });
            return;
        }

        setReloading(true);
        setMessage(null);

        try {
            await reloadModel(apiKey);
            setMessage({ type: 'success', text: 'Model reloaded successfully' });
            await fetchModel();
        } catch (err) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Reload failed' });
        } finally {
            setReloading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Models
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Manage and monitor your ML models
                </p>
            </div>

            {/* Current Model */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                    Active Model
                </h2>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        ))}
                    </div>
                ) : model ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">🤖</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    {model.model_name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm rounded">
                                        v{model.version}
                                    </span>
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded">
                                        @{model.configured_alias}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Source</p>
                                <p className="font-medium text-slate-900 dark:text-white">{model.source}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Run ID</p>
                                <p className="font-medium text-slate-900 dark:text-white font-mono text-sm">
                                    {model.run_id?.slice(0, 16)}...
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Loaded At</p>
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {model.loaded_at ? new Date(model.loaded_at).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-400">No model loaded</p>
                )}
            </div>

            {/* Reload Model */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                    Hot Reload
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Reload the model from MLflow without restarting the API server.
                </p>

                <div className="flex gap-4">
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="API Key"
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleReload}
                        disabled={reloading}
                        className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors"
                    >
                        {reloading ? 'Reloading...' : 'Reload Model'}
                    </button>
                </div>

                {message && (
                    <p className={`mt-4 text-sm ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {message.text}
                    </p>
                )}
            </div>
        </div>
    );
}
