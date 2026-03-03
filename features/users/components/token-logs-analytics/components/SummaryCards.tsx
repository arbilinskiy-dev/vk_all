import React from 'react';

interface SummaryCardsProps {
    totalCalls: number;
    uniqueMethods: number;
    accountsCount: number;
}

/**
 * Карточки с ключевыми метриками (саммари)
 */
export const SummaryCards: React.FC<SummaryCardsProps> = ({ 
    totalCalls, 
    uniqueMethods, 
    accountsCount 
}) => {
    return (
        <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-indigo-600">
                    {totalCalls.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-1">Всего вызовов</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-teal-600">
                    {uniqueMethods}
                </div>
                <div className="text-sm text-gray-500 mt-1">Уникальных методов</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-amber-600">
                    {accountsCount}
                </div>
                <div className="text-sm text-gray-500 mt-1">Аккаунтов</div>
            </div>
        </div>
    );
};
