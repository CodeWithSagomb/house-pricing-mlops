'use client';

import { useApiKey } from '@/lib/contexts/ApiKeyContext';
import { Key, Trash2, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Settings Page - API Key and Configuration
 */
export default function SettingsPage() {
    const { apiKey, setApiKey, isConfigured } = useApiKey();

    const handleSave = () => {
        if (apiKey) {
            toast.success('API key saved', {
                description: 'Your API key has been stored locally',
            });
        }
    };

    const handleClear = () => {
        setApiKey('');
        toast.info('API key cleared', {
            description: 'Your API key has been removed',
        });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Settings
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Configure your dashboard preferences
                </p>
            </div>

            {/* API Key Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-primary-500" />
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        API Authentication
                    </h2>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Your API key is stored locally in your browser and used for all API requests.
                    It is never sent to any external server except your MLOps API.
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
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={!apiKey}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </button>
                        <button
                            onClick={handleClear}
                            disabled={!isConfigured}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear
                        </button>
                    </div>

                    {isConfigured && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                API key is configured and stored securely
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    About Storage
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Your API key is stored in localStorage. This means it persists across browser sessions
                    but is cleared if you clear your browser data. For production use, consider implementing
                    proper authentication.
                </p>
            </div>
        </div>
    );
}
