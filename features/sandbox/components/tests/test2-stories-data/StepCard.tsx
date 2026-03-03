/**
 * Компонент: карточка шага VK API.
 * Отображает один шаг теста с возможностью раскрытия деталей (запрос, ответ, ошибка).
 */

import React, { useState } from 'react';
import type { StepLog } from './useStoriesDataTest';
import { TOKEN_TYPE_LABELS } from './constants';

// ─── Компонент: карточка шага VK API ────────────────────

export const StepCard: React.FC<{ step: StepLog; tokenType: string }> = ({ step, tokenType }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const tokenInfo = TOKEN_TYPE_LABELS[tokenType] || TOKEN_TYPE_LABELS.user;

    return (
        <div className={`border rounded-lg overflow-hidden ${
            step.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
        }`}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-opacity-80 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className={`flex-shrink-0 px-2 py-1 rounded text-xs font-bold ${tokenInfo.bg} ${tokenInfo.color}`}>
                        {tokenInfo.emoji} {tokenInfo.label}
                    </span>
                    <div>
                        <p className="font-semibold text-gray-900 text-sm">{step.name}</p>
                        <p className="text-xs text-gray-600">{step.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{step.elapsed_ms}ms</span>
                    {step.success ? (
                        <span className="text-green-600 text-sm font-medium">✓ OK</span>
                    ) : (
                        <span className="text-red-600 text-sm font-medium">✗ Ошибка</span>
                    )}
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {isExpanded && (
                <div className="border-t border-gray-200 px-4 py-3 space-y-3">
                    {step.request && (
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">→ Запрос (Request)</p>
                            <pre className="bg-gray-900 text-green-300 p-3 rounded-md text-xs overflow-x-auto max-h-60 overflow-y-auto">
                                {JSON.stringify(step.request, null, 2)}
                            </pre>
                        </div>
                    )}
                    {step.response !== undefined && (
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">← Ответ (Response)</p>
                            <pre className={`p-3 rounded-md text-xs overflow-x-auto max-h-80 overflow-y-auto ${
                                step.success ? 'bg-gray-900 text-blue-300' : 'bg-gray-900 text-red-300'
                            }`}>
                                {step.response ? JSON.stringify(step.response, null, 2) : 'null (нет ответа)'}
                            </pre>
                        </div>
                    )}
                    {step.error && (
                        <div>
                            <p className="text-xs font-bold text-red-500 uppercase mb-1">⚠ Ошибка</p>
                            <pre className="bg-red-900 text-red-200 p-3 rounded-md text-xs overflow-x-auto">
                                {JSON.stringify(step.error, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
