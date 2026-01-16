'use client';

import { useModelMetadata, useReloadModel } from '@/lib/hooks/useApi';
import { useApiKey } from '@/lib/contexts/ApiKeyContext';
import { Box, Tag, RefreshCw, Key, Clock, GitBranch } from 'lucide-react';

/**
 * Models Page - Refactored with React Query
 * Displays model info and allows hot reload
 */
export default function ModelsPage() {
    const { data: model, isLoading } = useModelMetadata();
    const reloadMutation = useReloadModel();
    const { apiKey, setApiKey, isConfigured } = useApiKey();

    const handleReload = () => {
        if (!isConfigured) return;
        reloadMutation.mutate(apiKey);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Models
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Manage and monitor ML models
                </p>
            </div>

            {/* Current Model */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                    Active Model
                </h2>

                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        ))}
                    </div>
                ) : model ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                                <Box className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    {model.model_name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-sm rounded font-medium">
                                        v{model.version}
                                    </span>
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded">
                                        <Tag className="w-3 h-3" />
                                        @{model.configured_alias}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-start gap-2">
                                <GitBranch className="w-4 h-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Source</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{model.source}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Run ID</p>
                                <p className="font-medium text-slate-900 dark:text-white font-mono text-sm">
                                    {model.run_id?.slice(0, 16)}...
                                </p>
                            </div>
                            <div className="flex items-start gap-2 col-span-2">
                                <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Loaded At</p>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {model.loaded_at ? new Date(model.loaded_at).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-400">No model loaded</p>
                )}
            </div>

            {/* Reload Model */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    Hot Reload
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Reload the model from MLflow without restarting the API server.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            <Key className="w-4 h-4" />
                            API Key
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your API key"
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        {isConfigured && (
                            <p className="text-xs text-emerald-500 mt-1">✓ API key saved</p>
                        )}
                    </div>

                    <button
                        onClick={handleReload}
                        disabled={reloadMutation.isPending || !isConfigured}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${reloadMutation.isPending ? 'animate-spin' : ''}`} />
                        {reloadMutation.isPending ? 'Reloading...' : 'Reload Model'}
                    </button>
                </div>
            </div>
        </div>
    );
}
