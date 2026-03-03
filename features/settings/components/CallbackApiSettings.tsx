import React, { useState, useRef, useEffect } from 'react';
import { useCallbackApiLogs } from '../hooks/useCallbackApiLogs';
import { ConfirmationModal } from '../../../shared/components/modals/ConfirmationModal';

// Вспомогательный компонент для мультиселекта с поиском и анимацией
const MultiSelectDropdown: React.FC<{
    options: { id: string | number; label: string }[];
    selectedIds: Set<string | number>;
    onToggle: (id: string | number) => void;
    label: string;
}> = ({ options, selectedIds, onToggle, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Сброс поиска и автофокус при открытии
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            // Автофокус на поле поиска
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [isOpen]);
    
    const selectedCount = selectedIds.size;
    const displayLabel = selectedCount === 0 ? 'Все' : `Выбрано: ${selectedCount}`;

    // Показывать поиск если > 7 элементов
    const showSearch = options.length > 7;

    // Фильтрация опций по поисковому запросу
    const filteredOptions = searchQuery
        ? options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-48 px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    selectedCount > 0 ? 'border-indigo-300 text-indigo-700 bg-indigo-50' : 'border-gray-300 text-gray-700'
                }`}
            >
                <span className="truncate mr-2">{label}: {displayLabel}</span>
                {/* Стрелка с поворотом при открытии */}
                <svg 
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="absolute z-[100] w-56 mt-1 bg-white border border-gray-200 rounded-md shadow-lg animate-fade-in-up">
                    {/* Поиск внутри dropdown (если > 7 элементов) */}
                    {showSearch && (
                        <div className="p-2 border-b border-gray-100">
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Поиск..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    )}
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredOptions.length === 0 ? (
                            <div className="text-xs text-gray-400 text-center py-4">Ничего не найдено</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <label key={String(opt.id)} className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-900 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(opt.id)}
                                        onChange={() => onToggle(opt.id)}
                                        className="w-4 h-4 flex-shrink-0 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2"
                                    />
                                    <span className="truncate" title={opt.label}>{opt.label}</span>
                                </label>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Компонент настроек логов Callback API.
 * Отображает таблицу логов с возможностью выбора, копирования, удаления и фильтрации.
 */
export const CallbackApiSettings: React.FC = () => {
    const { state, actions, helpers, scrollContainerRef } = useCallbackApiLogs();
    const { 
        filteredLogs, 
        totalCount,
        isLoading, 
        isLoadingMore,
        hasMore,
        isDeleting, 
        error, 
        selectedIds, 
        confirmAction,
        searchQuery,
        selectedEventTypes,
        selectedGroupIds,
    } = state;

    const { 
        availableEventTypes, 
        availableGroups, 
        allFilteredSelected,
    } = helpers;

    // Состояние для раскрытых payload-панелей (анимированное раскрытие)
    const [expandedPayloads, setExpandedPayloads] = useState<Set<number>>(new Set());

    const togglePayload = (id: number) => {
        setExpandedPayloads(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Подсчет активных фильтров
    const activeFiltersCount = (searchQuery ? 1 : 0) + 
        (selectedEventTypes.size > 0 ? 1 : 0) + 
        (selectedGroupIds.size > 0 ? 1 : 0);

    return (
        <div className="flex flex-col h-full">
            {/* Заголовок секции */}
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-800">Логи Callback API</h2>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        Загружено: {filteredLogs.length} из {totalCount}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button 
                        type="button"
                        onClick={actions.handleDeleteAll}
                        disabled={filteredLogs.length === 0 || isDeleting}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                        title="Удалить все логи"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Удалить все
                    </button>
                    <button 
                        type="button"
                        onClick={actions.fetchLogs}
                        disabled={isLoading || isDeleting}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        title="Обновить список логов"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" /></svg>
                        {isLoading ? 'Загрузка...' : 'Обновить'}
                    </button>
                </div>
            </div>

            {/* Панель выбора и фильтров */}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-3 flex-wrap">
                {/* Выбор */}
                <span className="text-sm text-gray-600">
                    Выбрано: <span className="font-medium">{selectedIds.size}</span> из {filteredLogs.length}
                </span>
                <button 
                    onClick={actions.handleDeleteSelected}
                    disabled={selectedIds.size === 0 || isDeleting}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Удалить выбранные
                </button>

                {/* Разделитель */}
                <div className="h-6 w-px bg-gray-300" />

                {/* Поиск */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Поиск..."
                        value={searchQuery}
                        onChange={(e) => actions.setSearchQuery(e.target.value)}
                        className="pl-8 pr-8 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-48"
                    />
                    {/* Иконка лупы */}
                    <svg 
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {/* Крестик сброса (виден только при наличии текста) */}
                    {searchQuery && (
                        <button
                            onClick={() => actions.setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Очистить поиск"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Фильтр по типу события */}
                <MultiSelectDropdown
                    label="Тип события"
                    options={availableEventTypes.map(type => ({ id: type, label: type }))}
                    selectedIds={selectedEventTypes}
                    onToggle={actions.toggleEventType}
                />

                {/* Фильтр по группам */}
                <MultiSelectDropdown
                    label="Сообщества"
                    options={availableGroups.map(g => ({ id: g.id, label: g.name }))}
                    selectedIds={selectedGroupIds}
                    onToggle={(id) => actions.toggleGroup(id as number)}
                />

                {/* Кнопка сброса фильтров */}
                {activeFiltersCount > 0 && (
                    <button
                        onClick={actions.clearFilters}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Сбросить - {activeFiltersCount}
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4 animate-fade-in-up">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Таблица логов */}
            <div ref={scrollContainerRef} className="flex-grow overflow-auto custom-scrollbar bg-white p-4">

            {isLoading && filteredLogs.length === 0 ? (
                /* Скелетон таблицы при загрузке — pixel-perfect с реальными строками */
                <div className="overflow-x-auto custom-scrollbar border border-gray-200 rounded-lg">
                    <table className="min-w-[1200px] w-full table-fixed divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="w-12 px-4 py-3"><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></th>
                                <th className="w-36 px-6 py-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></th>
                                <th className="w-80 px-6 py-3"><div className="h-3 w-16 bg-gray-200 rounded animate-pulse" /></th>
                                <th className="w-56 px-6 py-3"><div className="h-3 w-24 bg-gray-200 rounded animate-pulse" /></th>
                                <th className="w-56 px-6 py-3"><div className="h-3 w-16 bg-gray-200 rounded animate-pulse" /></th>
                                <th className="w-12 px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <tr key={i} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                                    <td className="w-12 px-4 py-4"><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></td>
                                    <td className="w-36 px-6 py-4">
                                        <div className="h-4 w-10 bg-gray-200 rounded animate-pulse mb-1" />
                                        <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                                    </td>
                                    <td className="w-80 px-6 py-4">
                                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-1" />
                                        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                                    </td>
                                    <td className="w-56 px-6 py-4"><div className="h-4 w-28 bg-gray-200 rounded animate-pulse" /></td>
                                    <td className="w-56 px-6 py-4"><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></td>
                                    <td className="w-12 px-4 py-4"><div className="h-5 w-5 bg-gray-200 rounded animate-pulse" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="text-center text-gray-500 py-10 border border-dashed border-gray-300 rounded-lg animate-fade-in-up">
                    {activeFiltersCount > 0 ? 'Нет логов, соответствующих фильтрам.' : 'Нет логов Callback API.'}
                </div>
            ) : (
            <div className="overflow-x-auto custom-scrollbar border border-gray-200 rounded-lg">
                <table className="min-w-[1200px] w-full table-fixed divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="w-12 px-4 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={allFilteredSelected}
                                    onChange={actions.toggleSelectAll}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                />
                            </th>
                            <th scope="col" className="w-36 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Время</th>
                            <th scope="col" className="w-80 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Группа</th>
                            <th scope="col" className="w-56 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={helpers.copyAllTypes}
                                        className="text-gray-400 hover:text-indigo-600"
                                        title="Копировать все типы событий"
                                        aria-label="Копировать все типы событий"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                    <span>Тип события</span>
                                </div>
                            </th>
                            <th scope="col" className="w-56 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={helpers.copyAllPayloads}
                                        className="text-gray-400 hover:text-indigo-600"
                                        title="Копировать все payload"
                                        aria-label="Копировать все payload"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>
                                    <span>Payload</span>
                                </div>
                            </th>
                            <th scope="col" className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredLogs.length === 0 && !isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                    Логов пока нет. Отправьте тестовый запрос или дождитесь события от VK.
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map((log, index) => (
                                <tr 
                                    key={log.id} 
                                    className={`hover:bg-gray-50 opacity-0 animate-fade-in-up ${selectedIds.has(log.id) ? 'bg-indigo-50' : ''}`}
                                    style={{ animationDelay: `${index * 20}ms` }}
                                >
                                    <td className="w-12 px-4 py-4 whitespace-nowrap align-top">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(log.id)}
                                            onChange={() => actions.toggleSelect(log.id)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                        />
                                    </td>
                                    <td className="w-36 px-6 py-4 whitespace-nowrap text-sm text-gray-900 align-top">
                                        <div className="font-bold">#{log.id}</div>
                                        <div className="text-gray-500 text-xs">{helpers.formatDate(log.timestamp)}</div>
                                    </td>
                                    <td className="w-80 px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top overflow-hidden">
                                        <div className="flex flex-col gap-1">
                                            <a 
                                                href={`https://vk.com/club${log.group_id}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline truncate block"
                                                title={log.group_name || `Группа ${log.group_id}`}
                                            >
                                                {log.group_name || `Группа ${log.group_id}`}
                                            </a>
                                            <span className="text-xs text-gray-400 font-mono">ID: {log.group_id}</span>
                                        </div>
                                    </td>
                                    <td className="w-56 px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 align-top">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => helpers.copyToClipboard(log.type)}
                                                className="text-gray-400 hover:text-indigo-600"
                                                title="Копировать тип события"
                                                aria-label="Копировать тип события"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                            <span className="truncate">{log.type}</span>
                                        </div>
                                    </td>
                                    <td className="w-56 px-6 py-4 text-sm text-gray-500 font-mono text-xs align-top">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                <button
                                                    onClick={() => helpers.copyToClipboard(helpers.formatPayload(log.payload))}
                                                    className="text-gray-400 hover:text-indigo-600 flex-shrink-0"
                                                    title="Копировать JSON"
                                                    aria-label="Копировать JSON"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => togglePayload(log.id)}
                                                    className="text-indigo-500 hover:text-indigo-700 select-none text-sm"
                                                >
                                                    {expandedPayloads.has(log.id) ? 'Скрыть содержимое' : 'Показать содержимое'}
                                                </button>
                                            </div>
                                            {expandedPayloads.has(log.id) && (
                                                <div className="mt-2 bg-gray-50 p-2 rounded-md border border-gray-200 whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar break-all animate-expand-down">
                                                    {helpers.formatPayload(log.payload)}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="w-12 px-4 py-4 whitespace-nowrap text-right text-sm align-top">
                                        <button
                                            onClick={() => actions.handleDeleteOne(log.id)}
                                            disabled={isDeleting}
                                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                            title="Удалить"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            )}

            {/* Индикатор подгрузки (infinite scroll) */}
            {isLoadingMore && (
                <div className="flex items-center justify-center py-4 gap-2 animate-fade-in-up">
                    <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm text-gray-500">Загрузка...</span>
                </div>
            )}

            {/* Уведомление, что все данные загружены */}
            {!hasMore && filteredLogs.length > 0 && !isLoading && (
                <div className="text-center text-xs text-gray-400 py-3">
                    Все записи загружены — {filteredLogs.length} из {totalCount}
                </div>
            )}
            </div>

            {/* Модальное окно подтверждения удаления */}
            {confirmAction && (
                <ConfirmationModal
                    title="Подтверждение удаления"
                    message={helpers.getConfirmMessage()}
                    onConfirm={actions.executeDelete}
                    onCancel={actions.cancelDelete}
                    confirmText="Удалить"
                    cancelText="Отмена"
                    isConfirming={isDeleting}
                    confirmButtonVariant="danger"
                />
            )}
        </div>
    );
};
