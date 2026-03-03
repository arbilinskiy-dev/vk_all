/**
 * Компонент: результаты полного теста.
 * Матрица совместимости + раскрываемые детальные результаты по каждому методу.
 */

import React, { useState } from 'react';
import type { FullTestResult } from './useStoriesDataTest';
import { ResultMatrix } from './ResultMatrix';
import { SingleMethodResults } from './SingleMethodResults';

// ─── Компонент: результаты полного теста ────────────────

export const FullTestResults: React.FC<{ result: FullTestResult }> = ({ result }) => {
    const [expandedMethod, setExpandedMethod] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            {/* Матрица */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Матрица совместимости: Метод × Токен
                </h3>
                <ResultMatrix matrix={result.matrix} />
            </div>

            {/* Детальные результаты по каждому методу */}
            <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Детальные результаты
                </h3>
                <div className="space-y-3">
                    {result.overall_results.map((methodResult) => (
                        <div key={methodResult.method} className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setExpandedMethod(
                                    expandedMethod === methodResult.method ? null : methodResult.method
                                )}
                                className="w-full px-4 py-3 bg-white flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-mono font-semibold text-gray-900">{methodResult.method}</span>
                                    <span className="text-xs text-gray-500">
                                        {methodResult.tokens_success}/{methodResult.tokens_tested} OK
                                    </span>
                                </div>
                                <svg
                                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedMethod === methodResult.method ? 'rotate-180' : ''}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {expandedMethod === methodResult.method && (
                                <div className="border-t border-gray-200 p-4 bg-gray-50">
                                    <SingleMethodResults result={methodResult} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
