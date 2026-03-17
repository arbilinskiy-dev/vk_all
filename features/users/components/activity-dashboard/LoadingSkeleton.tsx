import React from 'react';

// ==========================================
// Скелетоны загрузки дашборда активности
// ==========================================
export const LoadingSkeleton: React.FC = () => (
    <div className="space-y-6">
        {/* KPI-скелетоны */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-3 opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-12" />
                    </div>
                </div>
            ))}
        </div>
        {/* Графики-скелетоны */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-40 mb-3" />
                <div className="h-48 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '520ms' }}>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-36 mb-3" />
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j}>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mb-1" />
                            <div className="h-2 bg-gray-100 rounded-full animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
        {/* Heatmap-скелетон */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-52 mb-3" />
            <div className="grid grid-cols-12 gap-1">
                {Array.from({ length: 24 }).map((_, k) => (
                    <div key={k} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
            </div>
        </div>
        {/* Таблица-скелетон */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '680ms' }}>
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
            </div>
            <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, r) => (
                    <div key={r} className="flex gap-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-28" />
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-16" />
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-12" />
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-12" />
                        <div className="h-4 bg-gray-100 rounded animate-pulse flex-1" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);
