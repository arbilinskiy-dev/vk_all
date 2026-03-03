/**
 * Компонент: цепочка шагов (для viewers_details).
 * Отображает последовательность API-вызовов: stories.getViewers → users.get.
 */

import React, { useState } from 'react';
import { TOKEN_TYPE_LABELS } from './constants';
import type { ChainStep } from './types';

// ─── Компонент: цепочка шагов (для viewers_details) ─────

export const ChainStepsCard: React.FC<{ chainSteps: ChainStep[]; tokenType: string }> = ({ chainSteps, tokenType }) => {
    const [expandedStep, setExpandedStep] = useState<number | null>(null);
    const tokenInfo = TOKEN_TYPE_LABELS[tokenType] || TOKEN_TYPE_LABELS.user;

    if (!chainSteps || chainSteps.length === 0) return null;

    return (
        <div className="border border-indigo-200 rounded-lg overflow-hidden bg-indigo-50/30">
            <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-200">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${tokenInfo.bg} ${tokenInfo.color}`}>
                        {tokenInfo.emoji} {tokenInfo.label}
                    </span>
                    <span className="text-xs font-semibold text-indigo-700">
                        🔗 Цепочка: {chainSteps.length} шагов
                    </span>
                    <span className="text-xs text-gray-500">
                        ({chainSteps.reduce((sum, s) => sum + s.elapsed_ms, 0)}ms суммарно)
                    </span>
                </div>
            </div>
            <div className="divide-y divide-indigo-100">
                {chainSteps.map((cs) => (
                    <div key={cs.step}>
                        <button
                            onClick={() => setExpandedStep(expandedStep === cs.step ? null : cs.step)}
                            className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-indigo-50/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    cs.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {cs.step}
                                </span>
                                <div>
                                    <p className="font-mono text-sm font-semibold text-gray-900">{cs.name}</p>
                                    <p className="text-xs text-gray-500">{cs.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">{cs.elapsed_ms}ms</span>
                                {cs.success ? (
                                    <span className="text-green-500 text-sm">✓</span>
                                ) : (
                                    <span className="text-red-500 text-sm">✗</span>
                                )}
                                <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedStep === cs.step ? 'rotate-180' : ''}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>
                        {expandedStep === cs.step && (
                            <div className="px-4 py-3 bg-white border-t border-indigo-100 space-y-3">
                                {cs.request && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">→ Запрос</p>
                                        <pre className="bg-gray-900 text-green-300 p-3 rounded-md text-xs overflow-x-auto max-h-48 overflow-y-auto">
                                            {JSON.stringify(cs.request, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                {cs.response && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">← Ответ</p>
                                        <pre className={`p-3 rounded-md text-xs overflow-x-auto max-h-64 overflow-y-auto ${
                                            cs.success ? 'bg-gray-900 text-blue-300' : 'bg-gray-900 text-red-300'
                                        }`}>
                                            {JSON.stringify(cs.response, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                {cs.error && (
                                    <div>
                                        <p className="text-xs font-bold text-red-500 uppercase mb-1">⚠ Ошибка</p>
                                        <pre className="bg-red-900 text-red-200 p-3 rounded-md text-xs overflow-x-auto">
                                            {JSON.stringify(cs.error, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
