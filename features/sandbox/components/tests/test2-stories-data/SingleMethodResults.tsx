/**
 * Компонент: результат одного метода.
 * Показывает статистику, сводки и детальные шаги для одного метода VK API.
 */

import React from 'react';
import type { MethodResult } from './useStoriesDataTest';
import { SummaryCard } from './SummaryCard';
import { StepCard } from './StepCard';
import { ChainStepsCard } from './ChainStepsCard';

// ─── Компонент: результат одного метода ─────────────────

export const SingleMethodResults: React.FC<{ result: MethodResult }> = ({ result }) => {
    const hasChainSteps = result.results_by_token.some((tr: any) => tr.chain_steps);

    return (
        <div className="space-y-4">
            {/* Общая статистика */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-gray-900">{result.method}</span>
                    <span className="text-sm text-gray-500">
                        Протестировано: {result.tokens_tested} токенов | Успешно: {result.tokens_success}
                    </span>
                    {hasChainSteps && (
                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium">
                            🔗 Цепочка запросов
                        </span>
                    )}
                </div>
            </div>

            {/* Сводки по каждому токену */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Сводка данных</h4>
                {result.results_by_token.map((tr, i) => (
                    <SummaryCard key={i} summary={tr.summary} tokenType={tr.token_type} />
                ))}
            </div>

            {/* Цепочки шагов (для viewers_details) */}
            {hasChainSteps && (
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Цепочки запросов (getViewers → users.get)</h4>
                    {result.results_by_token
                        .filter((tr: any) => tr.chain_steps)
                        .map((tr: any, i: number) => (
                            <ChainStepsCard key={i} chainSteps={tr.chain_steps} tokenType={tr.token_type} />
                        ))
                    }
                </div>
            )}

            {/* Детальные шаги (обычные методы) */}
            {!hasChainSteps && (
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Детальные ответы VK API</h4>
                    {result.results_by_token.map((tr, i) => (
                        <StepCard key={i} step={tr.step} tokenType={tr.token_type} />
                    ))}
                </div>
            )}
        </div>
    );
};
