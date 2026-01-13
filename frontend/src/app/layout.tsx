import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
    title: 'MLOps Dashboard',
    description: 'House Pricing MLOps System Dashboard',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="antialiased">
                <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
                    <Sidebar />
                    <main className="flex-1 overflow-auto p-6">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
