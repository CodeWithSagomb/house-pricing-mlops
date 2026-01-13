import { HealthCard } from '@/components/dashboard/HealthCard';
import { ModelCard } from '@/components/dashboard/ModelCard';
import { DriftCard } from '@/components/dashboard/DriftCard';
import { QuickPredict } from '@/components/dashboard/QuickPredict';

/**
 * Dashboard Page - Composition over Inheritance
 * Composes multiple independent widget components
 */
export default function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Dashboard
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Real-time overview of your ML system
                </p>
            </div>

            {/* Grid of widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <HealthCard />
                <ModelCard />
                <DriftCard />
            </div>

            {/* Quick Predict section */}
            <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                    Quick Prediction
                </h2>
                <QuickPredict />
            </div>
        </div>
    );
}
