import React from 'react';

// =====================================================================
// Вспомогательные (общие) компоненты для mock-статистики списков
// =====================================================================

// Обёртка для карточки статистики
export const MockStatCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex-1">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 border-b pb-2">
            {title}
        </h4>
        {children}
    </div>
);

// Значение с процентом
export const MockValueWithPercent: React.FC<{ value: number; percent: number }> = ({ value, percent }) => (
    <span className="font-bold">
        {value.toLocaleString()} <span className="text-xs font-normal opacity-70">({percent}%)</span>
    </span>
);

// Прогресс-бар
export const MockProgressBar: React.FC<{ 
    label: string; 
    value: number; 
    percent: number; 
    color: string;
}> = ({ label, value, percent, color }) => (
    <div className="space-y-1">
        <div className="flex justify-between text-xs">
            <span className="text-gray-600">{label}</span>
            <span className="font-semibold text-gray-900">{value.toLocaleString()} ({percent}%)</span>
        </div>
        <div className="bg-gray-200 rounded-full h-1.5">
            <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${percent}%` }}></div>
        </div>
    </div>
);
