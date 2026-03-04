import React from 'react';

// =====================================================================
// MockProductsHeader — шапка с кнопками и поиском
// =====================================================================
interface MockProductsHeaderProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    onCreateClick?: () => void;
    onColumnsClick?: () => void;
    onRefreshClick?: () => void;
    selectedCount?: number;
    onBulkEditClick?: () => void;
    onBulkDeleteClick?: () => void;
}

export const MockProductsHeader: React.FC<MockProductsHeaderProps> = ({
    searchValue,
    onSearchChange,
    onCreateClick,
    onColumnsClick,
    onRefreshClick,
    selectedCount = 0,
    onBulkEditClick,
    onBulkDeleteClick
}) => {
    return (
        <div className="p-4 border-b border-gray-200 bg-white">
            {/* Первая строка: основные кнопки и поиск */}
            <div className="flex items-center gap-3 mb-3">
                {/* Кнопка "Колонки" */}
                <button
                    onClick={onColumnsClick}
                    className="inline-flex items-center justify-center px-4 h-10 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm whitespace-nowrap"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Колонки
                </button>

                {/* Кнопка "Обновить категории" */}
                <button
                    onClick={onRefreshClick}
                    className="inline-flex items-center justify-center px-4 h-10 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm whitespace-nowrap"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>

                {/* Кнопка "Создать товар" */}
                <button
                    onClick={onCreateClick}
                    className="inline-flex items-center justify-center px-4 h-10 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 shadow-sm whitespace-nowrap"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Создать товар
                </button>

                {/* Поле поиска */}
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Поиск по всем полям..."
                        className="w-full px-3 h-10 pl-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Панель массовых действий (показывается при selectedCount > 0) */}
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden flex items-center ${
                    selectedCount > 0 ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <span className="text-sm text-gray-600 mr-3">
                    Выбрано товаров: <span className="font-semibold">{selectedCount}</span>
                </span>
                <div className="flex items-center gap-1 p-1 bg-white border border-gray-300 rounded-md shadow-sm whitespace-nowrap">
                    <button
                        onClick={onBulkEditClick}
                        className="px-3 py-1 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap"
                    >
                        Изменить
                    </button>
                    <button
                        onClick={onBulkDeleteClick}
                        className="px-3 py-1 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 whitespace-nowrap"
                    >
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    );
};
