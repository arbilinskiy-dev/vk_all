import React from 'react';

interface LoadMoreFooterProps {
    hasMore: boolean;
    isLoadingMore: boolean;
    currentLogsCount: number;
    onLoadMore: () => void;
}

/**
 * Футер таблицы с кнопкой "Загрузить ещё" и индикатором
 */
export const LoadMoreFooter: React.FC<LoadMoreFooterProps> = ({
    hasMore,
    isLoadingMore,
    currentLogsCount,
    onLoadMore
}) => {
    if (hasMore) {
        return (
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-center">
                {isLoadingMore ? (
                    <div className="flex items-center gap-2 text-gray-500">
                        <div className="loader border-t-indigo-500 w-5 h-5"></div>
                        <span className="text-sm">Загрузка...</span>
                    </div>
                ) : (
                    <button
                        onClick={onLoadMore}
                        className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-md hover:bg-indigo-50 transition-colors"
                    >
                        Загрузить ещё
                    </button>
                )}
            </div>
        );
    }

    if (currentLogsCount > 0) {
        return (
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center text-xs text-gray-400">
                Все записи загружены - {currentLogsCount}
            </div>
        );
    }

    return null;
};
