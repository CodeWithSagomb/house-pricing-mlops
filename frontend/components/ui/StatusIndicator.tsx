'use client';

interface StatusIndicatorProps {
    status: 'healthy' | 'warning' | 'error' | 'loading';
    size?: 'sm' | 'md' | 'lg';
    pulse?: boolean;
    label?: string;
}

const statusColors = {
    healthy: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-rose-500',
    loading: 'bg-slate-400',
};

const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
};

/**
 * StatusIndicator - Animated status dot with optional pulse
 */
export function StatusIndicator({
    status,
    size = 'md',
    pulse = true,
    label,
}: StatusIndicatorProps) {
    const color = statusColors[status];
    const sizeClass = sizeClasses[size];

    return (
        <div className="inline-flex items-center gap-2">
            <span className="relative flex">
                <span className={`${sizeClass} rounded-full ${color}`} />
                {pulse && status !== 'loading' && (
                    <span
                        className={`absolute inset-0 rounded-full ${color} animate-ping opacity-75`}
                    />
                )}
            </span>
            {label && (
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {label}
                </span>
            )}
        </div>
    );
}

/**
 * ProgressRing - Circular progress indicator
 */
interface ProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    variant?: 'primary' | 'success' | 'warning' | 'danger';
    showValue?: boolean;
}

const ringColors = {
    primary: 'stroke-primary-500',
    success: 'stroke-emerald-500',
    warning: 'stroke-amber-500',
    danger: 'stroke-rose-500',
};

export function ProgressRing({
    progress,
    size = 60,
    strokeWidth = 6,
    variant = 'primary',
    showValue = true,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="-rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-slate-200 dark:text-slate-700"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={`${ringColors[variant]} transition-all duration-500 ease-out`}
                />
            </svg>
            {showValue && (
                <span className="absolute text-sm font-bold text-slate-700 dark:text-slate-200">
                    {Math.round(progress)}%
                </span>
            )}
        </div>
    );
}

/**
 * Badge - Status badge with variants
 */
interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    size?: 'sm' | 'md';
    icon?: React.ReactNode;
}

const badgeColors = {
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    danger: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

export function Badge({ children, variant = 'neutral', size = 'md', icon }: BadgeProps) {
    return (
        <span
            className={`
                inline-flex items-center gap-1 font-medium border rounded-full
                ${badgeColors[variant]}
                ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
            `}
        >
            {icon}
            {children}
        </span>
    );
}
