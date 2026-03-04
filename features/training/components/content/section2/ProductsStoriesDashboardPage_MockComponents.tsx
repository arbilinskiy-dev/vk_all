import React from 'react';

// =====================================================================
// Mock-компоненты для демонстрации дашборда сторис
// =====================================================================

/** Упрощённый компонент Sparkline для демонстрации */
export const MockSparkline: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data);
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (val / max) * 100;
        return `${x},${y}`;
    }).join(' ');
    
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            <polyline points={points} fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={color} stroke="currentColor" />
        </svg>
    );
};

/** Компонент метрической карточки */
export const MockMetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    bgColor: string;
    iconColor: string;
    textColor?: string;
    children?: React.ReactNode;
    colSpan?: string;
}> = ({ title, value, icon, bgColor, iconColor, textColor = 'text-gray-900', children, colSpan = 'col-span-1' }) => (
    <div className={`${colSpan} bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:border-indigo-300 transition-colors`}>
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <p className="text-gray-500 text-sm font-semibold">{title}</p>
                <h3 className={`text-3xl font-bold ${textColor} mt-2`}>{value}</h3>
            </div>
            <div className={`p-2 ${bgColor} rounded-xl`}>
                {icon}
            </div>
        </div>
        {children}
    </div>
);

/** Компонент фильтра */
export const MockFilterButton: React.FC<{ label: string; active: boolean; onClick: () => void; variant?: 'period' | 'type' }> = ({ label, active, onClick, variant = 'period' }) => {
    const activeClass = variant === 'period' 
        ? 'bg-indigo-100 text-indigo-700' 
        : 'bg-indigo-600 text-white shadow-md';
    const inactiveClass = 'text-gray-600 hover:text-gray-900 hover:bg-gray-50';
    
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${active ? activeClass : inactiveClass}`}
        >
            {label}
        </button>
    );
};
