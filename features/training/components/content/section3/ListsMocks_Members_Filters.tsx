import React, { useState } from 'react';
import { mockMembers } from './ListsMocks_Members_Data';
import { MemberRow } from './ListsMocks_Members_Row';

// =====================================================================
// MOCK КОМПОНЕНТ: ИНТЕРАКТИВНЫЕ ФИЛЬТРЫ УЧАСТНИКОВ (раздел 3.2.3)
// =====================================================================

export const FiltersDemo: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sexFilter, setSexFilter] = useState('all');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showSexDropdown, setShowSexDropdown] = useState(false);

    const statusOptions = [
        { value: 'all', label: 'Все' },
        { value: 'active', label: 'Активные' },
        { value: 'banned', label: 'Забанены' },
        { value: 'deleted', label: 'Удалены' }
    ];

    const sexOptions = [
        { value: 'all', label: 'Любой' },
        { value: '1', label: 'Женский' },
        { value: '2', label: 'Мужской' },
        { value: '0', label: 'Не указан' }
    ];

    const filteredMembers = mockMembers.filter(member => {
        // Фильтр по поиску
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || 
            member.first_name.toLowerCase().includes(searchLower) ||
            member.last_name.toLowerCase().includes(searchLower) ||
            member.vk_user_id.toString().includes(searchQuery);

        // Фильтр по статусу
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && !member.deactivated && !member.is_closed) ||
            (statusFilter === 'banned' && member.deactivated === 'banned') ||
            (statusFilter === 'deleted' && member.deactivated === 'deleted');

        // Фильтр по полу
        const matchesSex = sexFilter === 'all' ||
            (sexFilter === '0' && !member.sex) ||
            (member.sex?.toString() === sexFilter);

        return matchesSearch && matchesStatus && matchesSex;
    });

    return (
        <div className="space-y-4">
            {/* Панель фильтров */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Поиск */}
                    <div className="relative flex-grow min-w-[200px]">
                        <input 
                            type="text" 
                            placeholder="ФИО, ID, ссылка..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Фильтр: Статус */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowStatusDropdown(!showStatusDropdown);
                                setShowSexDropdown(false);
                            }}
                            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1"
                        >
                            Статус: {statusOptions.find(o => o.value === statusFilter)?.label}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showStatusDropdown && (
                            <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                                {statusOptions.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            setStatusFilter(option.value);
                                            setShowStatusDropdown(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                                            statusFilter === option.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Фильтр: Пол */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowSexDropdown(!showSexDropdown);
                                setShowStatusDropdown(false);
                            }}
                            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1"
                        >
                            Пол: {sexOptions.find(o => o.value === sexFilter)?.label}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showSexDropdown && (
                            <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                                {sexOptions.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            setSexFilter(option.value);
                                            setShowSexDropdown(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                                            sexFilter === option.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Кнопка сброса */}
                    {(searchQuery || statusFilter !== 'all' || sexFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                                setSexFilter('all');
                            }}
                            className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors flex items-center gap-1 px-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Сбросить
                        </button>
                    )}
                </div>

                {/* Счётчик результатов */}
                <div className="mt-3 text-sm text-gray-600">
                    Найдено участников: <strong>{filteredMembers.length}</strong> из {mockMembers.length}
                </div>
            </div>

            {/* Таблица с отфильтрованными данными */}
            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200 custom-scrollbar max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm relative">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 bg-gray-50"></th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Пользователь</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Пол</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">ДР</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Город</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Онлайн</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Статус</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Дата</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Источник</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredMembers.length > 0 ? (
                            filteredMembers.map(member => (
                                <MemberRow key={member.id} member={member} />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                                    Участников с такими фильтрами не найдено
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
