'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Target, BarChart3, Box, Settings, History, LogIn, LogOut, User } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/lib/contexts/AuthContext';

/**
 * Navigation items - Open/Closed Principle
 * Easy to extend without modifying component code
 */
const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/predict', label: 'Prediction', icon: Target },
    { href: '/monitoring', label: 'Monitoring', icon: BarChart3 },
    { href: '/models', label: 'Models', icon: Box },
    { href: '/history', label: 'History', icon: History },
];

/**
 * Sidebar Component - With user authentication
 */
export function Sidebar() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuth();

    return (
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
                    SAGOMBAYE
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Real Estate Platform
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

            {/* User Section */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                {isAuthenticated && user ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 px-4 py-2 bg-teal-500/10 rounded-lg">
                            <User className="w-5 h-5 text-teal-400" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 px-4 py-2 w-full text-left text-slate-500 dark:text-slate-400 hover:text-rose-400 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Logout</span>
                        </button>
                    </div>
                ) : (
                    <Link
                        href="/login"
                        className="flex items-center gap-3 px-4 py-2 text-teal-400 hover:text-teal-300 transition-colors"
                    >
                        <LogIn className="w-5 h-5" />
                        <span className="text-sm font-medium">Sign In</span>
                    </Link>
                )}

                <ThemeToggle />
                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                </Link>
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                    v1.0.0 | MLOps Platform
                </p>
            </div>
        </aside>
    );
}
