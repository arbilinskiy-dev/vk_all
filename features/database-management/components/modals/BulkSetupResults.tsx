import React from 'react';
import { ProjectSetupResult, BulkSetupStats } from './types';

// ─── Типы ─────────────────────────────────────────────────────────

interface BulkSetupResultsProps {
    stats: BulkSetupStats;
    errorResults: ProjectSetupResult[];
    wasAborted: boolean;
    retryingProjectId: string | null;
    onRetry: (projectId: string) => void;
}

// ─── Компонент ────────────────────────────────────────────────────

export const BulkSetupResults: React.FC<BulkSetupResultsProps> = ({
    stats,
    errorResults,
    wasAborted,
    retryingProjectId,
    onRetry,
}) => {
    return (
        <div className="space-y-4">
            {/* Сводка */}
            <div className={`rounded-lg p-4 ${stats.errors === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <h3 className={`text-sm font-bold mb-2 ${stats.errors === 0 ? 'text-green-800' : 'text-yellow-800'}`}>
                    {wasAborted ? 'Настройка прервана' : 'Настройка завершена'}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-gray-700">Успешно: <strong>{stats.success}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-gray-700">Ошибок: <strong>{stats.errors}</strong></span>
                    </div>
                    {stats.created > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            <span className="text-gray-700">Создано: <strong>{stats.created}</strong></span>
                        </div>
                    )}
                    {stats.updated > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-orange-500" />
                            <span className="text-gray-700">Обновлено: <strong>{stats.updated}</strong></span>
                        </div>
                    )}
                    {stats.eventsUpdated > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-purple-500" />
                            <span className="text-gray-700">Подписка обновлена: <strong>{stats.eventsUpdated}</strong></span>
                        </div>
                    )}
                </div>
            </div>

            {/* Список ошибок (если есть) */}
            {errorResults.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-bold text-red-700">
                        Ошибки ({errorResults.length}):
                    </h4>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5">
                        {errorResults.map((r, idx) => (
                            <div key={idx} className="bg-red-50 rounded-lg px-3 py-2 text-sm border border-red-100">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="font-medium text-red-800 truncate">{r.projectName}</span>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {r.errorCode && (
                                            <span className="text-xs text-red-500 bg-red-100 px-1.5 py-0.5 rounded">
                                                Код: {r.errorCode}
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => onRetry(r.projectId)}
                                            disabled={retryingProjectId !== null}
                                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                            {retryingProjectId === r.projectId ? (
                                                <>
                                                    <span className="h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                    ...
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                    Повторить
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-red-600 text-xs mt-0.5">{r.message}</p>
                                {r.errorCode === 2000 && (
                                    <p className="text-xs text-red-500 mt-1 italic">
                                        Лимит 10 серверов — удалите ненужные серверы в{' '}
                                        {r.vkProjectId ? (
                                            <a
                                                href={`https://vk.com/club${r.vkProjectId}?act=api`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:text-indigo-800 underline font-medium not-italic"
                                            >
                                                настройках группы VK
                                            </a>
                                        ) : (
                                            <span>настройках группы VK</span>
                                        )}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
