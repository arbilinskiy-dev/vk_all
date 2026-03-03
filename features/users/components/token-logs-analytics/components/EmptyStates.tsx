import React from 'react';

/**
 * Состояние "Выберите аккаунты"
 */
export const SelectAccountsEmpty: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg font-medium">Выберите аккаунты для сравнения</p>
            <p className="text-sm mt-1">Выберите один или несколько токенов в селекторе выше</p>
        </div>
    );
};

/**
 * Индикатор загрузки
 */
export const LoadingState: React.FC = () => {
    return (
        <div className="flex justify-center items-center h-64">
            <div className="loader border-t-indigo-500 w-10 h-10"></div>
        </div>
    );
};

/**
 * Состояние "Нет данных"
 */
export const NoDataEmpty: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg font-medium">Нет данных</p>
            <p className="text-sm mt-1">У выбранных аккаунтов пока нет записей в логах</p>
        </div>
    );
};
