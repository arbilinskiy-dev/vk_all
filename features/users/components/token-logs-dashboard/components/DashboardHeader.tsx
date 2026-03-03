import React from 'react';

interface DashboardHeaderProps {
    activeTab: 'vk' | 'ai';
    currentLogsCount: number;
    totalCount: number;
    isLoading: boolean;
    isRefreshing: boolean;
    isDeleting: boolean;
    onDeleteAll: () => void;
    onRefresh: () => void;
}

/**
 * Заголовок дашборда с кнопками действий
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    activeTab,
    currentLogsCount,
    totalCount,
    isLoading,
    isRefreshing,
    isDeleting,
    onDeleteAll,
    onRefresh
}) => {
    return (
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-800">
                    {activeTab === 'vk' ? 'VK Логи' : 'AI Логи'}
                </h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    Загружено: {currentLogsCount} из {totalCount}
                </span>
            </div>
            <div className="flex gap-2">
                <button 
                    type="button"
                    onClick={onDeleteAll}
                    disabled={currentLogsCount === 0 || isDeleting}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                    title="Удалить все логи"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Удалить все
                </button>
                <button 
                    type="button"
                    onClick={onRefresh}
                    disabled={isLoading || isRefreshing || isDeleting}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    title="Обновить данные"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Обновить
                </button>
            </div>
        </div>
    );
};
