import React, { useState } from 'react';
import { MockFilterDropdown } from './ListsFilters_MockDropdown';

// =====================================================================
// Mock-компонент: FilterPanel — панель фильтров с поиском
// =====================================================================
export const MockFilterPanel: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterQuality, setFilterQuality] = useState('all');
    const [filterSex, setFilterSex] = useState('all');
    const [filterAge, setFilterAge] = useState('any');
    const [filterOnline, setFilterOnline] = useState('any');
    const [filterPlatform, setFilterPlatform] = useState('any');

    const hasActiveFilters = 
        searchQuery !== '' ||
        filterQuality !== 'all' ||
        filterSex !== 'all' ||
        filterAge !== 'any' ||
        filterOnline !== 'any' ||
        filterPlatform !== 'any';

    const resultCount = hasActiveFilters ? 342 : 12458;

    const resetFilters = () => {
        setSearchQuery('');
        setFilterQuality('all');
        setFilterSex('all');
        setFilterAge('any');
        setFilterOnline('any');
        setFilterPlatform('any');
    };

    return (
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 p-4 space-y-3">
            {/* Строка 1: Поиск */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Поиск по имени, ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <span className="text-sm text-gray-600 whitespace-nowrap">
                    Найдено: <strong className="text-indigo-600">{resultCount}</strong>
                </span>
            </div>

            {/* Строка 2: Фильтры */}
            <div className="flex items-center gap-2 flex-wrap">
                <MockFilterDropdown
                    label="Статус"
                    options={[
                        { value: 'all', label: 'Все' },
                        { value: 'active', label: 'Активен' },
                        { value: 'banned', label: 'Забанен' },
                        { value: 'deleted', label: 'Удалён' }
                    ]}
                    activeValue={filterQuality}
                    onSelect={setFilterQuality}
                />
                <MockFilterDropdown
                    label="Пол"
                    options={[
                        { value: 'all', label: 'Все' },
                        { value: 'male', label: 'Мужской' },
                        { value: 'female', label: 'Женский' },
                        { value: 'unknown', label: 'Не указан' }
                    ]}
                    activeValue={filterSex}
                    onSelect={setFilterSex}
                />
                <MockFilterDropdown
                    label="Возраст"
                    options={[
                        { value: 'any', label: 'Любой' },
                        { value: 'u16', label: 'До 16' },
                        { value: '16-20', label: '16-20' },
                        { value: '20-25', label: '20-25' },
                        { value: '25-30', label: '25-30' },
                        { value: '30-35', label: '30-35' },
                        { value: '35-40', label: '35-40' },
                        { value: '40-45', label: '40-45' },
                        { value: '45p', label: '45+' },
                        { value: 'unknown', label: 'Не указан' }
                    ]}
                    activeValue={filterAge}
                    onSelect={setFilterAge}
                />
                <MockFilterDropdown
                    label="Онлайн"
                    options={[
                        { value: 'any', label: 'Неважно' },
                        { value: 'today', label: 'Сегодня' },
                        { value: '3_days', label: '3 дня' },
                        { value: 'week', label: 'Неделя' },
                        { value: 'month', label: 'Месяц' }
                    ]}
                    activeValue={filterOnline}
                    onSelect={setFilterOnline}
                />
                <MockFilterDropdown
                    label="Платформа"
                    options={[
                        { value: 'any', label: 'Любая' },
                        { value: '1', label: 'Mobile' },
                        { value: '2', label: 'iPhone' },
                        { value: '4', label: 'Android' },
                        { value: '7', label: 'Web' },
                        { value: 'unknown', label: 'Неизвестно' }
                    ]}
                    activeValue={filterPlatform}
                    onSelect={setFilterPlatform}
                />

                {hasActiveFilters && (
                    <button
                        onClick={resetFilters}
                        className="ml-auto px-3 py-2 text-sm bg-red-50 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                    >
                        Сбросить
                    </button>
                )}
            </div>

            {/* Строка 3: Кнопки действий */}
            <div className="flex items-center gap-2">
                <button className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Обновить детали
                </button>
                <button className="px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Анализ
                </button>
            </div>
        </div>
    );
};
