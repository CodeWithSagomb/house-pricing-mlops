'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Target, BarChart3, Box, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

/**
 * Navigation items - Open/Closed Principle
 */
const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/predict', label: 'Prediction', icon: Target },
    { href: '/monitoring', label: 'Monitoring', icon: BarChart3 },
    { href: '/models', label: 'Models', icon: Box },
];

/**
 * Sidebar Component - Dark Teal Theme
 */
export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-navy-900 border-r border-teal-600/10 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-teal-600/10">
                <h1 className="text-xl font-bold text-teal-400">
                    MLOps Dashboard
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    House Pricing System
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-teal-500/10 text-teal-400 border-l-2 border-teal-500 -ml-[2px]'
                                            : 'text-slate-400 hover:bg-navy-800 hover:text-white'
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
            <div className="p-4 border-t border-teal-600/10 space-y-3">
                <ThemeToggle />
                <Link
                    href="/settings"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${pathname === '/settings'
                            ? 'text-teal-400'
                            : 'text-slate-500 hover:text-white'
                        }`}
                >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                </Link>
                <p className="text-xs text-slate-600 text-center">
                    v1.0.0 | MLOps Platform
                </p>
            </div>
        </aside>
    );
}
