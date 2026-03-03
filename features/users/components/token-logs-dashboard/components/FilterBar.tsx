import React from 'react';
import { MultiSelectDropdown } from './MultiSelectDropdown';
import { SelectOption, StatusFilter } from '../types';

interface FilterBarProps {
    // Выбранные записи
    selectedLogIds: Set<string>;
    currentLogsCount: number;
    isDeleting: boolean;
    onDeleteSelected: () => void;
    
    // Фильтры
    activeTab: 'vk' | 'ai';
    vkOptions: SelectOption[];
    aiOptions: SelectOption[];
    vkSelectedAccountIds: Set<string>;
    aiSelectedTokenIds: Set<string>;
    onVkAccountsChange: (ids: Set<string>) => void;
    onAiTokensChange: (ids: Set<string>) => void;
    
    // Поиск
    searchQuery: string;
    onSearchChange: (query: string) => void;
    
    // Статус
    statusFilter: StatusFilter;
    onStatusChange: (status: StatusFilter) => void;
}

/**
 * Панель фильтров и выбора записей
 */
export const FilterBar: React.FC<FilterBarProps> = ({
    selectedLogIds,
    currentLogsCount,
    isDeleting,
    onDeleteSelected,
    activeTab,
    vkOptions,
    aiOptions,
    vkSelectedAccountIds,
    aiSelectedTokenIds,
    onVkAccountsChange,
    onAiTokensChange,
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange
}) => {
    return (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center gap-4">
            {/* Выбранные записи */}
            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                    Выбрано: <span className="font-medium">{selectedLogIds.size}</span> из {currentLogsCount}
                </span>
                <button 
                    onClick={onDeleteSelected}
                    disabled={selectedLogIds.size === 0 || isDeleting}
                    className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Удалить выбранные
                </button>
            </div>

            {/* Разделитель */}
            <div className="w-px h-6 bg-gray-300"></div>

            {/* Фильтры */}
            <div className="flex flex-wrap items-center gap-3">
                {activeTab === 'vk' ? (
                    <MultiSelectDropdown 
                        label="Аккаунты" 
                        options={vkOptions} 
                        selectedIds={vkSelectedAccountIds} 
                        onChange={onVkAccountsChange} 
                    />
                ) : (
                    <MultiSelectDropdown 
                        label="Токены" 
                        options={aiOptions} 
                        selectedIds={aiSelectedTokenIds} 
                        onChange={onAiTokensChange} 
                    />
                )}
                
                <div className="relative w-56">
                    <input
                        type="text"
                        placeholder={activeTab === 'vk' ? "Поиск по методу, ошибке..." : "Поиск по модели, ошибке..."}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            title="Сбросить поиск"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="flex rounded-md shadow-sm">
                    <button
                        onClick={() => onStatusChange('all')}
                        className={`px-3 py-1.5 text-sm font-medium border rounded-l-md ${
                            statusFilter === 'all' 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-300' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        Все
                    </button>
                    <button
                        onClick={() => onStatusChange('success')}
                        className={`px-3 py-1.5 text-sm font-medium border-t border-b border-r ${
                            statusFilter === 'success' 
                                ? 'bg-green-50 text-green-700 border-green-300' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        Успех
                    </button>
                    <button
                        onClick={() => onStatusChange('error')}
                        className={`px-3 py-1.5 text-sm font-medium border-t border-b border-r rounded-r-md ${
                            statusFilter === 'error' 
                                ? 'bg-red-50 text-red-700 border-red-300' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        Ошибки
                    </button>
                </div>
            </div>
        </div>
    );
};
