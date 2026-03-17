import React from 'react';

// ==========================================
// KPI-карточка
// ==========================================
export const KpiCard: React.FC<{
    title: string;
    value: React.ReactNode;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    delay?: number;
}> = ({ title, value, subtitle, icon, color, bgColor, delay = 0 }) => (
    <div
        className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-start gap-3 hover:shadow-md transition-shadow opacity-0 animate-fade-in-up"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
            <span className={color}>{icon}</span>
        </div>
        <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
    </div>
);
