'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useTheme } from 'next-themes';

interface DriftChartProps {
    bufferSize: number;
    threshold: number;
}

/**
 * DriftChart Component
 * Visualizes the drift buffer progress with an area chart
 */
export function DriftChart({ bufferSize, threshold }: DriftChartProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    // Generate sample data for visualization
    const data = [
        { name: 'Start', value: 0 },
        { name: 'Progress', value: bufferSize },
        { name: 'Threshold', value: threshold },
    ];

    const gradientColor = isDark ? '#818cf8' : '#6366f1';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    return (
        <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={gradientColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 12 }} />
                    <YAxis tick={{ fill: textColor, fontSize: 12 }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                            borderRadius: '8px',
                            color: isDark ? '#f1f5f9' : '#0f172a',
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={gradientColor}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
