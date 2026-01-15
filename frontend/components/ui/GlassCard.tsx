'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    hover?: boolean;
    glow?: boolean;
}

const variantStyles = {
    default: {
        accent: 'bg-gradient-to-r from-primary-500 to-primary-600',
        glow: 'hover:shadow-glow-primary',
    },
    success: {
        accent: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
        glow: 'hover:shadow-glow-success',
    },
    warning: {
        accent: 'bg-gradient-to-r from-amber-500 to-amber-600',
        glow: 'hover:shadow-glow-warning',
    },
    danger: {
        accent: 'bg-gradient-to-r from-rose-500 to-rose-600',
        glow: 'hover:shadow-glow-danger',
    },
    info: {
        accent: 'bg-gradient-to-r from-blue-500 to-blue-600',
        glow: 'hover:shadow-glow-primary',
    },
};

/**
 * GlassCard - Premium card component with glassmorphism effect
 */
export function GlassCard({
    children,
    className = '',
    variant = 'default',
    hover = true,
    glow = false,
}: GlassCardProps) {
    const styles = variantStyles[variant];

    return (
        <div
            className={`
                relative overflow-hidden rounded-xl
                bg-white/95 dark:bg-slate-800/95
                backdrop-blur-sm
                border border-slate-200/80 dark:border-slate-700/80
                shadow-card
                transition-all duration-300 ease-out
                ${hover ? 'hover:-translate-y-1 hover:shadow-card-hover' : ''}
                ${glow ? styles.glow : ''}
                ${className}
            `}
        >
            {/* Top accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${styles.accent}`} />

            {/* Content */}
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}

/**
 * StatCard - Card for displaying statistics with animated value
 */
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    trend?: { value: number; label: string };
}

export function StatCard({
    title,
    value,
    subtitle,
    icon,
    variant = 'default',
    trend,
}: StatCardProps) {
    const isPositiveTrend = trend && trend.value >= 0;

    return (
        <GlassCard variant={variant} glow>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {title}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {subtitle}
                        </p>
                    )}
                    {trend && (
                        <div className={`mt-2 inline-flex items-center gap-1 text-sm font-medium ${isPositiveTrend ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                            <span>{isPositiveTrend ? '↑' : '↓'}</span>
                            <span>{Math.abs(trend.value)}%</span>
                            <span className="text-slate-400 dark:text-slate-500 font-normal">{trend.label}</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                        {icon}
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
