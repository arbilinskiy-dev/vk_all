
import React from 'react';
import { PromoteToAdminsResponse, PromoteUserResult } from '../../../../services/api/management.api';
import { GroupedResults } from '../../hooks/usePromoteAdminsLogic';

// ─── Типы ─────────────────────────────────────────────────────────

interface PromoteAdminsResultsProps {
    response: PromoteToAdminsResponse;
    groupedResults: GroupedResults;
    onBack: () => void;
    onClose: () => void;
}

// ─── Компонент ────────────────────────────────────────────────────

export const PromoteAdminsResults: React.FC<PromoteAdminsResultsProps> = ({
    response,
    groupedResults,
    onBack,
    onClose,
}) => {
    const { promoted, alreadyAdmin, joinedOnly, failedJoin, failedPromote, recommendations } = groupedResults;
    const hasErrors = failedJoin.length > 0 || failedPromote.length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 h-[75vh] flex flex-col animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Заголовок */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Результаты назначения</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Обработано {response.total_pairs} пар (группа × пользователь)
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Статистика — бейджи */}
                <div className="px-6 py-3 border-b border-gray-100 flex gap-3 flex-wrap">
                    {promoted.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full">
                            ✓ Назначено: {promoted.length}
                        </span>
                    )}
                    {alreadyAdmin.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                            ✓ Уже админы: {alreadyAdmin.length}
                        </span>
                    )}
                    {joinedOnly.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
                            → Вступили (без админки): {joinedOnly.length}
                        </span>
                    )}
                    {failedPromote.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
                            ⚠ Не назначены: {failedPromote.length}
                        </span>
                    )}
                    {failedJoin.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 px-3 py-1 rounded-full">
                            ✗ Не вступили: {failedJoin.length}
                        </span>
                    )}
                </div>

                {/* Категории результатов */}
                <div className="flex-1 overflow-auto custom-scrollbar px-6 py-4 space-y-4">
                    
                    {/* --- Назначены админом --- */}
                    {promoted.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-xs">✓</span>
                                Назначены администратором
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {promoted.map((r, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-800 px-2.5 py-1.5 rounded-md border border-green-100">
                                        <span className="font-medium">{r.user_name}</span>
                                        <span className="text-green-500">→</span>
                                        <span>{r.group_name}</span>
                                        {r.joined && <span className="text-[10px] text-green-500 ml-0.5">(+ вступил)</span>}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- Уже были админами --- */}
                    {alreadyAdmin.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs">✓</span>
                                Уже были администраторами
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {alreadyAdmin.map((r, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-800 px-2.5 py-1.5 rounded-md border border-blue-100">
                                        <span className="font-medium">{r.user_name}</span>
                                        <span className="text-blue-400">→</span>
                                        <span>{r.group_name}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- Вступили, но доступ не выдан --- */}
                    {joinedOnly.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-xs">→</span>
                                Вступили в группу, но доступ не выдан
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {joinedOnly.map((r, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-purple-50 text-purple-800 px-2.5 py-1.5 rounded-md border border-purple-100">
                                        <span className="font-medium">{r.user_name}</span>
                                        <span className="text-purple-400">→</span>
                                        <span>{r.group_name}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- Не назначены (участники, но editManager не сработал) --- */}
                    {failedPromote.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-xs">⚠</span>
                                Участники группы, но доступ не выдан
                            </h3>
                            <div className="space-y-1.5">
                                {failedPromote.map((r, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs bg-amber-50 text-amber-800 px-3 py-2 rounded-md border border-amber-100">
                                        <span className="font-medium whitespace-nowrap">{r.user_name} → {r.group_name}</span>
                                        {r.joined && <span className="text-amber-500 whitespace-nowrap">(вступил)</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- Не вступили --- */}
                    {failedJoin.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-xs">✗</span>
                                Не удалось вступить в группу
                            </h3>
                            <div className="space-y-1.5">
                                {failedJoin.map((r, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs bg-red-50 text-red-800 px-3 py-2 rounded-md border border-red-100">
                                        <span className="font-medium whitespace-nowrap">{r.user_name} → {r.group_name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- Блок рекомендаций --- */}
                    {hasErrors && recommendations.length > 0 && (
                        <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Что нужно сделать
                            </h3>
                            <ul className="space-y-1.5">
                                {recommendations.map((rec, i) => (
                                    <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                                        <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Футер */}
                <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        ← Назад к выбору
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};
