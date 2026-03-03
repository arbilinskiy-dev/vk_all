import React from 'react';
import { BulkSetupStats } from './types';

// ─── Типы ─────────────────────────────────────────────────────────

interface BulkSetupProgressProps {
    currentIndex: number;
    totalCount: number;
    progressPercent: number;
    currentProjectName: string;
    stats: BulkSetupStats;
    hasResults: boolean;
}

// ─── Компонент ────────────────────────────────────────────────────

export const BulkSetupProgress: React.FC<BulkSetupProgressProps> = ({
    currentIndex,
    totalCount,
    progressPercent,
    currentProjectName,
    stats,
    hasResults,
}) => {
    return (
        <div className="space-y-4">
            {/* Прогресс-бар */}
            <div>
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-gray-700">
                        Настройка: {currentIndex} / {totalCount}
                    </span>
                    <span className="text-sm font-medium text-indigo-600">
                        {progressPercent}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Текущий проект */}
            <div className="bg-indigo-50 rounded-lg p-3 flex items-center gap-3">
                <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <div className="min-w-0">
                    <p className="text-sm font-medium text-indigo-800 truncate">
                        {currentProjectName}
                    </p>
                    <p className="text-xs text-indigo-500">
                        Настройка Callback-сервера...
                    </p>
                </div>
            </div>

            {/* Промежуточная статистика */}
            {hasResults && (
                <div className="flex gap-3 text-sm">
                    <span className="text-green-600">✓ Успешно: {stats.success}</span>
                    {stats.errors > 0 && (
                        <span className="text-red-600">✗ Ошибки: {stats.errors}</span>
                    )}
                </div>
            )}
        </div>
    );
};
