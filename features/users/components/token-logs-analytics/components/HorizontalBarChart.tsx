import React, { useMemo } from 'react';
import { SystemAccount, CompareStats } from '../../../../../shared/types';
import { getAccountName, getAccountColor } from '../utils';

interface HorizontalBarChartProps {
    data: CompareStats;
    accounts: SystemAccount[];
    selectedAccountIds: string[];
    maxMethods?: number;
}

/**
 * Простой горизонтальный барчарт для отображения статистики методов
 */
export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({ 
    data, 
    accounts, 
    selectedAccountIds, 
    maxMethods = 15 
}) => {
    // Берём топ N методов
    const methodsToShow = data.methods.slice(0, maxMethods);
    
    // Находим максимальное значение для масштабирования
    const maxValue = useMemo(() => {
        let max = 0;
        for (const method of methodsToShow) {
            for (const accId of selectedAccountIds) {
                const val = data.stats_data[accId]?.[method] || 0;
                if (val > max) max = val;
            }
        }
        return max || 1;
    }, [data, methodsToShow, selectedAccountIds]);

    if (methodsToShow.length === 0) {
        return (
            <div className="text-center text-gray-500 py-10">
                Нет данных для отображения
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Легенда */}
            <div className="flex flex-wrap gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                {selectedAccountIds.map(accId => (
                    <div key={accId} className="flex items-center gap-2">
                        <span 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: getAccountColor(accId, selectedAccountIds) }}
                        />
                        <span className="text-sm text-gray-700">
                            {getAccountName(accId, accounts)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Барчарт */}
            <div className="space-y-3">
                {methodsToShow.map(method => {
                    // Сумма по всем аккаунтам для этого метода
                    const totalForMethod = selectedAccountIds.reduce((sum, accId) => {
                        return sum + (data.stats_data[accId]?.[method] || 0);
                    }, 0);

                    return (
                        <div key={method} className="group">
                            {/* Название метода и общее количество */}
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-mono text-indigo-600 font-medium">
                                    {method}
                                </span>
                                <span className="text-xs text-gray-500">
                                    Всего: {totalForMethod.toLocaleString()}
                                </span>
                            </div>
                            
                            {/* Бары для каждого аккаунта */}
                            <div className="space-y-1">
                                {selectedAccountIds.map(accId => {
                                    const value = data.stats_data[accId]?.[method] || 0;
                                    const percentage = (value / maxValue) * 100;
                                    
                                    return (
                                        <div key={accId} className="flex items-center gap-2">
                                            <div className="w-40 text-xs text-gray-500 flex-shrink-0" title={getAccountName(accId, accounts)}>
                                                {getAccountName(accId, accounts)}
                                            </div>
                                            <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                                                <div 
                                                    className="h-full rounded transition-all duration-300 flex items-center justify-end px-2"
                                                    style={{ 
                                                        width: `${Math.max(percentage, value > 0 ? 2 : 0)}%`,
                                                        backgroundColor: getAccountColor(accId, selectedAccountIds)
                                                    }}
                                                >
                                                    {value > 0 && percentage > 15 && (
                                                        <span className="text-xs text-white font-medium">
                                                            {value.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {(value === 0 || percentage <= 15) && (
                                                <span className="text-xs text-gray-600 w-12 text-right">
                                                    {value.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {data.methods.length > maxMethods && (
                <div className="text-center text-sm text-gray-400 pt-2">
                    Показано {maxMethods} из {data.methods.length} методов
                </div>
            )}
        </div>
    );
};
