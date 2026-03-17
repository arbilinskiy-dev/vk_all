/**
 * KPI-карточка для страницы «АМ Анализ».
 */

import React from 'react';

interface KpiCardProps {
    title: string;
    value: React.ReactNode;
    subtitle?: string;
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
    delay?: number;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, icon, bgColor, textColor, delay = 0 }) => (
    <div
        className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-start gap-3 hover:shadow-md transition-shadow"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
            <span className={textColor}>{icon}</span>
        </div>
        <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
    </div>
);
