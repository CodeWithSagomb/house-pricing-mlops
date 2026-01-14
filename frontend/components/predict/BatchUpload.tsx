'use client';

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Download, X } from 'lucide-react';
import { parseCSV, generateSampleCSV, CSVParseResult } from '@/lib/utils/csvParser';
import { usePredictBatch } from '@/lib/hooks/useApi';
import { useApiKey } from '@/lib/contexts/ApiKeyContext';
import { PredictionInput } from '@/lib/api';

interface BatchResult {
    index: number;
    predicted_price: number;
}

/**
 * BatchUpload Component
 * Handles CSV file upload and batch predictions
 */
export function BatchUpload() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
    const [results, setResults] = useState<BatchResult[] | null>(null);
    const { apiKey, isConfigured } = useApiKey();
    const batchMutation = usePredictBatch();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const result = parseCSV(content);
            setParseResult(result);
            setResults(null);
        };
        reader.readAsText(file);
    };

    const handleSubmit = async () => {
        if (!parseResult?.data.length || !isConfigured) return;

        batchMutation.mutate(
            { inputs: parseResult.data, apiKey },
            {
                onSuccess: (data) => {
                    setResults(data.results);
                },
            }
        );
    };

    const handleDownloadSample = () => {
        const csv = generateSampleCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_batch.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        setParseResult(null);
        setResults(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Batch Predictions
                </h2>
                <button
                    onClick={handleDownloadSample}
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
                >
                    <Download className="w-4 h-4" />
                    Sample CSV
                </button>
            </div>

            {/* Upload area */}
            <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Drop a CSV file or click to upload
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Required: MedInc, HouseAge, AveRooms, AveBedrms, Population, AveOccup, Latitude, Longitude
                </p>
            </div>

            {/* Parse result */}
            {parseResult && (
                <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            <span className="font-medium">{parseResult.rowCount}</span> rows parsed
                        </p>
                        <button onClick={handleClear} className="text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Errors */}
                    {parseResult.errors.length > 0 && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Warnings</span>
                            </div>
                            <ul className="text-xs text-rose-500 dark:text-rose-300 space-y-1">
                                {parseResult.errors.slice(0, 5).map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                                {parseResult.errors.length > 5 && (
                                    <li>...and {parseResult.errors.length - 5} more</li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Submit button */}
                    {parseResult.data.length > 0 && !results && (
                        <button
                            onClick={handleSubmit}
                            disabled={batchMutation.isPending || !isConfigured}
                            className="w-full py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors"
                        >
                            {batchMutation.isPending
                                ? 'Processing...'
                                : `Predict ${parseResult.data.length} rows`}
                        </button>
                    )}

                    {!isConfigured && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                            Configure API key in Settings first
                        </p>
                    )}
                </div>
            )}

            {/* Results table */}
            {results && parseResult && (
                <div className="mt-4">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Results
                    </h3>
                    <div className="max-h-64 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-slate-600 dark:text-slate-300">Row</th>
                                    <th className="px-3 py-2 text-left text-slate-600 dark:text-slate-300">MedInc</th>
                                    <th className="px-3 py-2 text-left text-slate-600 dark:text-slate-300">Location</th>
                                    <th className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {results.map((result, i) => {
                                    const input = parseResult.data[i];
                                    return (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{i + 1}</td>
                                            <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{input?.MedInc}</td>
                                            <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-xs">
                                                {input?.Latitude?.toFixed(2)}, {input?.Longitude?.toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-medium text-emerald-600 dark:text-emerald-400">
                                                ${(result.predicted_price * 100000).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
