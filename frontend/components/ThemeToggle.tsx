'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

/**
 * ThemeToggle Component
 * Button to toggle between dark/light/system themes
 */
export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 animate-pulse" />
        );
    }

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
    const label = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System';

    return (
        <button
            onClick={cycleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-300"
            title={`Theme: ${label}`}
        >
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
}
