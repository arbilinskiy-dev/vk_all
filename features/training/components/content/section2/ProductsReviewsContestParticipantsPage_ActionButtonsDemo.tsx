// =====================================================================
// Демонстрация кнопок действий конкурса (интерактивный компонент)
// =====================================================================
import React, { useState } from 'react';

export const ActionButtonsDemo: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = (action: string) => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            alert(`Действие "${action}" выполнено!`);
        }, 1500);
    };

    return (
        <div className="flex flex-wrap gap-2">
            {/* Кнопка "Обновить" */}
            <button 
                onClick={() => handleAction('Обновить')}
                className="p-2 text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                title="Обновить список"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" />
                </svg>
            </button>

            {/* Кнопка "Очистить" (только для админа) */}
            <button 
                onClick={() => handleAction('Очистить базу')}
                className="p-2 text-red-500 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                title="Полностью очистить список участников (для тестов)"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>

            {/* Кнопка "Прокомментировать" */}
            <button 
                onClick={() => handleAction('Прокомментировать новых участников')}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium rounded-md bg-white border border-green-600 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:border-gray-300 disabled:text-gray-400 flex items-center gap-2 transition-colors"
            >
                {isLoading ? (
                    <div className="loader h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                )}
                Прокомментировать (1)
            </button>

            {/* Кнопка "Подвести итоги" */}
            <button 
                onClick={() => handleAction('Выбрать победителя')}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium rounded-md bg-white border border-amber-500 text-amber-600 hover:bg-amber-50 disabled:opacity-50 disabled:border-gray-300 disabled:text-gray-400 flex items-center gap-2 transition-colors"
            >
                {isLoading ? (
                    <div className="loader h-4 w-4 border-2 border-amber-600 border-t-transparent"></div>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                )}
                Подвести итоги (3)
            </button>

            {/* Кнопка "Собрать посты" */}
            <button 
                onClick={() => handleAction('Собрать новые посты')}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2"
            >
                {isLoading ? (
                    <div className="loader h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                )}
                Собрать посты
            </button>
        </div>
    );
};
