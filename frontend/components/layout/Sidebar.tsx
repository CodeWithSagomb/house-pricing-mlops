'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Target, BarChart3, Box, Settings } from 'lucide-react';

/**
 * Navigation items - Open/Closed Principle
 * Easy to extend without modifying component code
 */
const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/predict', label: 'Prediction', icon: Target },
    { href: '/monitoring', label: 'Monitoring', icon: BarChart3 },
    { href: '/models', label: 'Models', icon: Box },
];

/**
 * Sidebar Component - Refactored with Lucide icons
 */
export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
                    MLOps Dashboard
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    House Pricing System
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                            ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                </Link>
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">
                    v1.0.0 | MLOps Platform
                </p>
            </div>
        </aside>
    );
}
