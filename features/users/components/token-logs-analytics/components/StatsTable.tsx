import React, { useState, useMemo } from 'react';
import { SystemAccount, CompareStats } from '../../../../../shared/types';
import { getAccountName, getAccountColor } from '../utils';

interface StatsTableProps {
    data: CompareStats;
    accounts: SystemAccount[];
    selectedAccountIds: string[];
}

/**
 * Иконка сортировки для заголовков таблицы
 */
const SortIcon: React.FC<{ column: string; sortBy: string; sortDesc: boolean }> = ({ 
    column, 
    sortBy, 
    sortDesc 
}) => {
    if (sortBy !== column) return null;
    return (
        <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sortDesc 
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            }
        </svg>
    );
};

/**
 * Таблица со статистикой использования методов API
 */
export const StatsTable: React.FC<StatsTableProps> = ({ 
    data, 
    accounts, 
    selectedAccountIds 
}) => {
    const [sortBy, setSortBy] = useState<'total' | string>('total');
    const [sortDesc, setSortDesc] = useState(true);

    // Сортировка методов
    const sortedMethods = useMemo(() => {
        return [...data.methods].sort((a, b) => {
            let valA = 0;
            let valB = 0;

            if (sortBy === 'total') {
                valA = selectedAccountIds.reduce((sum, acc) => sum + (data.stats_data[acc]?.[a] || 0), 0);
                valB = selectedAccountIds.reduce((sum, acc) => sum + (data.stats_data[acc]?.[b] || 0), 0);
            } else {
                valA = data.stats_data[sortBy]?.[a] || 0;
                valB = data.stats_data[sortBy]?.[b] || 0;
            }

            return sortDesc ? valB - valA : valA - valB;
        });
    }, [data, sortBy, sortDesc, selectedAccountIds]);

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortDesc(!sortDesc);
        } else {
            setSortBy(column);
            setSortDesc(true);
        }
    };

    return (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th 
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('total')}
                        >
                            Метод <SortIcon column="total" sortBy={sortBy} sortDesc={sortDesc} />
                        </th>
                        {selectedAccountIds.map(accId => (
                            <th 
                                key={accId}
                                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 whitespace-nowrap"
                                onClick={() => handleSort(accId)}
                            >
                                <div className="flex items-center justify-end gap-2">
                                    <span 
                                        className="w-2.5 h-2.5 rounded-full" 
                                        style={{ backgroundColor: getAccountColor(accId, selectedAccountIds) }}
                                    />
                                    <span className="truncate max-w-[120px]" title={getAccountName(accId, accounts)}>
                                        {getAccountName(accId, accounts)}
                                    </span>
                                    <SortIcon column={accId} sortBy={sortBy} sortDesc={sortDesc} />
                                </div>
                            </th>
                        ))}
                        <th 
                            className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('total')}
                        >
                            Всего <SortIcon column="total" sortBy={sortBy} sortDesc={sortDesc} />
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {sortedMethods.map((method, idx) => {
                        const total = selectedAccountIds.reduce((sum, acc) => sum + (data.stats_data[acc]?.[method] || 0), 0);
                        
                        return (
                            <tr key={method} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-2.5 font-mono text-indigo-600 font-medium whitespace-nowrap">
                                    {method}
                                </td>
                                {selectedAccountIds.map(accId => {
                                    const val = data.stats_data[accId]?.[method] || 0;
                                    return (
                                        <td key={accId} className="px-4 py-2.5 text-right text-gray-700">
                                            {val > 0 ? val.toLocaleString() : <span className="text-gray-300">—</span>}
                                        </td>
                                    );
                                })}
                                <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                                    {total.toLocaleString()}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
