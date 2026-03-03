import React from 'react';
import { UpdateMode } from './StoriesTable';

interface StoriesTableToolbarProps {
    storiesCount: number;
    totalStories?: number;
    isLoading: boolean;
    updatingStatsId: string | null;
    onBatchUpdate: (mode: 'last_n' | 'period', params: any, updateType?: UpdateMode) => void;
    onLoadStories: () => void;
}

/** Тулбар таблицы историй: заголовок, счётчик, кнопки «Обновить всё» и «Обновить список» */
export const StoriesTableToolbar: React.FC<StoriesTableToolbarProps> = ({
    storiesCount, totalStories, isLoading, updatingStatsId, onBatchUpdate, onLoadStories
}) => {
    return (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h3 className="text-base font-semibold text-gray-900">
                    История публикаций
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    Отображаются {storiesCount}{totalStories ? ` из ${totalStories}` : ''} историй.
                </p>
            </div>
            
            <div className="flex items-center gap-3">
                {/* Одна кнопка — обновить всю статистику + зрителей за всё время */}
                <button 
                    onClick={() => onBatchUpdate('period', { days: 3650 }, 'all')}
                    disabled={updatingStatsId !== null} 
                    className="inline-flex items-center justify-center px-3 py-2 border border-emerald-300 text-emerald-700 text-xs font-medium rounded-md bg-white hover:bg-emerald-50 focus:outline-none transition-colors shadow-sm disabled:opacity-50 disabled:cursor-wait whitespace-nowrap"
                >
                    <svg className={`w-3.5 h-3.5 mr-2 ${updatingStatsId !== null ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Обновить всё
                </button>

                <button 
                    onClick={onLoadStories}
                    disabled={isLoading}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    )}
                    Обновить список
                </button>
            </div>
        </div>
    );
};
