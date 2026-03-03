/**
 * Компонент: сводка (summary) результата теста.
 * Показывает извлечённые данные из ответа VK API для конкретного типа токена.
 */

import React from 'react';
import { TOKEN_TYPE_LABELS } from './constants';

// ─── Компонент: сводка (summary) результата ─────────────

export const SummaryCard: React.FC<{ summary: Record<string, any> | null; tokenType: string }> = ({ summary, tokenType }) => {
    if (!summary) return null;
    const tokenInfo = TOKEN_TYPE_LABELS[tokenType] || TOKEN_TYPE_LABELS.user;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${tokenInfo.bg} ${tokenInfo.color}`}>
                    {tokenInfo.emoji} {tokenInfo.label}
                </span>
                <span className="text-xs text-gray-400">Извлечённые данные</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {Object.entries(summary).map(([key, value]) => (
                    <div key={key} className="text-xs">
                        <span className="text-gray-500">{key}:</span>{' '}
                        <span className="font-mono text-gray-900">
                            {value === null || value === undefined
                                ? '—'
                                : typeof value === 'object'
                                    ? JSON.stringify(value).slice(0, 60)
                                    : String(value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
