'use client';

import { useHistory } from '@/lib/contexts/HistoryContext';
import { Clock, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

/**
 * PredictionHistory Component
 * Displays recent prediction history from localStorage
 */
export function PredictionHistory() {
    const { history, clearHistory } = useHistory();

    const handleClear = () => {
        clearHistory();
        toast.info('History cleared');
    };

    if (history.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5" />
                    Recent Predictions
                </h2>
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                    No predictions yet. Make a prediction to see history.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Predictions
                </h2>
                <button
                    onClick={handleClear}
                    className="text-sm text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear
                </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-auto">
                {history.slice(0, 10).map((entry) => (
                    <div
                        key={entry.id}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <DollarSign className="w-4 h-4" />
                                <span className="font-bold">
                                    ${(entry.price * 100000).toLocaleString()}
                                </span>
                            </div>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                v{entry.modelVersion}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-slate-600 dark:text-slate-300">
                                MedInc: {entry.input.MedInc}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-slate-600 dark:text-slate-300">
                                Age: {entry.input.HouseAge}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-slate-600 dark:text-slate-300">
                                {entry.processingTime.toFixed(1)}ms
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                            {new Date(entry.timestamp).toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
