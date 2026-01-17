'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getAuthHeader } from '@/lib/contexts/AuthContext';
import { History, DollarSign, Clock, Layers, RefreshCw, LogIn } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PredictionHistory {
    id: number;
    predicted_price: number;
    model_version: string;
    features: Record<string, number>;
    created_at: string;
}

/**
 * Prediction History Page - Shows user's past predictions
 */
export default function HistoryPage() {
    const router = useRouter();
    const { isAuthenticated, token, isLoading: authLoading } = useAuth();
    const [predictions, setPredictions] = useState<PredictionHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            // Don't redirect, show login prompt
            setLoading(false);
            return;
        }

        if (isAuthenticated && token) {
            fetchHistory();
        }
    }, [isAuthenticated, token, authLoading]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/auth/history?limit=50`, {
                headers: getAuthHeader(token),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch history');
            }

            const data = await response.json();
            setPredictions(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading history');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(Math.round(price * 100000));
    };

    const formatDate = (dateStr: string): string => {
        return new Date(dateStr).toLocaleString();
    };

    // Not authenticated
    if (!authLoading && !isAuthenticated) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gradient-cyber mb-2">
                        Prediction History
                    </h1>
                    <p className="text-slate-400">Track your prediction activity</p>
                </div>

                <div className="glass-card p-12 text-center">
                    <History className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">
                        Login Required
                    </h2>
                    <p className="text-slate-400 mb-6">
                        Sign in to view your prediction history
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="btn-neon inline-flex items-center gap-2"
                    >
                        <LogIn className="w-5 h-5" />
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gradient-cyber mb-2">
                        Prediction History
                    </h1>
                    <p className="text-slate-400">
                        {predictions.length} predictions recorded
                    </p>
                </div>
                <button
                    onClick={fetchHistory}
                    disabled={loading}
                    className="btn-neon flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="glass-card p-4 border-l-4 border-rose-500 text-rose-400">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="glass-card p-12 text-center">
                    <RefreshCw className="w-12 h-12 text-teal-400 mx-auto animate-spin mb-4" />
                    <p className="text-slate-400">Loading history...</p>
                </div>
            ) : predictions.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <History className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-white mb-2">
                        No Predictions Yet
                    </h2>
                    <p className="text-slate-400">
                        Make your first prediction on the dashboard
                    </p>
                </div>
            ) : (
                /* Predictions List */
                <div className="space-y-4">
                    {predictions.map((prediction) => (
                        <div
                            key={prediction.id}
                            className="glass-card p-6 flex flex-col md:flex-row md:items-center gap-4"
                        >
                            {/* Price */}
                            <div className="flex items-center gap-3 md:w-48">
                                <DollarSign className="w-8 h-8 text-neon-green" />
                                <div>
                                    <p className="text-2xl font-bold font-mono-data text-neon-green">
                                        {formatPrice(prediction.predicted_price)}
                                    </p>
                                    <p className="text-xs text-slate-500">Estimated Value</p>
                                </div>
                            </div>

                            {/* Features Preview */}
                            <div className="flex-1 flex flex-wrap gap-2">
                                {Object.entries(prediction.features).slice(0, 4).map(([key, value]) => (
                                    <span
                                        key={key}
                                        className="px-3 py-1 rounded-full text-xs bg-white/5 text-slate-300 border border-white/10"
                                    >
                                        {key}: {typeof value === 'number' ? value.toFixed(1) : value}
                                    </span>
                                ))}
                            </div>

                            {/* Metadata */}
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Layers className="w-3 h-3" />
                                    v{prediction.model_version}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(prediction.created_at)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
