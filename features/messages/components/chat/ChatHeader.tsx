import React, { useState, useRef, useEffect } from 'react';
import { ConversationUser, MessageSearchFilter, ChatDisplayFilters } from '../../types';

interface ChatHeaderProps {
    user: ConversationUser;
    /** Текущий поисковый запрос */
    searchQuery: string;
    /** Текущий фильтр поиска */
    searchFilter: MessageSearchFilter;
    /** Колбэк изменения поиска */
    onSearchChange: (query: string) => void;
    /** Колбэк изменения фильтра */
    onFilterChange: (filter: MessageSearchFilter) => void;
    /** Фильтры отображения (скрытие элементов для компактности) */
    displayFilters: ChatDisplayFilters;
    /** Колбэк изменения фильтров отображения */
    onDisplayFiltersChange: (filters: ChatDisplayFilters) => void;
    /** Ссылка на диалог в VK (gim .../convo/...) — если есть, показываем кнопку */
    vkDialogUrl?: string | null;
    /** Колбэк принудительного обновления истории (загрузка последних 200 сообщений из VK API) */
    onRefresh?: () => void;
    /** Идёт ли сейчас загрузка сообщений */
    isLoading?: boolean;
    /** Колбэк: пометить диалог как непрочитанный */
    onMarkAsUnread?: () => void;
    /** Статус: можно ли отправлять сообщения пользователю */
    canWrite?: boolean;
    /** Диалог помечен как «Важный» */
    isImportant?: boolean;
    /** Колбэк переключения пометки «Важное» */
    onToggleImportant?: () => void;
}

/**
 * Шапка чата — аватар пользователя, имя, статус онлайн.
 */
export const ChatHeader: React.FC<ChatHeaderProps> = ({ user, searchQuery, searchFilter, onSearchChange, onFilterChange, displayFilters, onDisplayFiltersChange, vkDialogUrl, onRefresh, isLoading, onMarkAsUnread, canWrite, isImportant, onToggleImportant }) => {
    // Инициалы для аватара-заглушки
    const initials = `${user.firstName[0]}${user.lastName[0]}`;
    const [avatarLoaded, setAvatarLoaded] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Есть ли активные фильтры отображения
    const hasActiveDisplayFilters = displayFilters.hideAttachments || displayFilters.hideKeyboard || displayFilters.hideBotMessages || searchFilter !== 'all';

    // Закрытие dropdown при клике вне
    useEffect(() => {
        if (!isMenuOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    // Текст статуса
    const getStatusText = () => {
        if (user.onlineStatus === 'online') return 'в сети';
        if (user.onlineStatus === 'recently') return 'был(а) недавно';
        if (user.lastSeen) {
            const date = new Date(user.lastSeen);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            
            if (diffHours < 1) return 'был(а) недавно';
            if (diffHours < 24) return `был(а) ${diffHours} ч. назад`;
            
            return `был(а) ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`;
        }
        return 'не в сети';
    };

    return (
    <>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 bg-white">
            {/* Аватар */}
            <div className="relative flex-shrink-0">
                {user.avatarUrl ? (
                    <div className="w-10 h-10 rounded-full relative">
                        {/* Skeleton пока фото грузится */}
                        {!avatarLoaded && (
                            <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full" />
                        )}
                        <img
                            src={user.avatarUrl}
                            alt={`${user.firstName} ${user.lastName}`}
                            className={`w-10 h-10 rounded-full object-cover transition-opacity duration-300 ${avatarLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setAvatarLoaded(true)}
                        />
                    </div>
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                        {initials}
                    </div>
                )}
                {/* Индикатор онлайн */}
                {user.onlineStatus === 'online' && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                )}
            </div>

            {/* Имя и статус */}
            <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                    {user.firstName} {user.lastName}
                </p>
                <p className={`text-xs ${user.onlineStatus === 'online' ? 'text-green-500' : 'text-gray-400'}`}>
                    {getStatusText()}
                </p>
            </div>

            {/* Статус отправки сообщений — badge */}
            {canWrite !== undefined && (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    canWrite
                        ? 'bg-green-50 text-green-600'
                        : 'bg-red-50 text-red-500'
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${canWrite ? 'bg-green-400' : 'bg-red-400'}`} />
                    {canWrite ? 'Можно писать' : 'Нельзя писать'}
                </div>
            )}

            {/* Действия справа — звёздочка «Важное», кнопка поиска и меню */}
            <div className="ml-auto flex items-center gap-2">
                {/* Кнопка «Важное» — звёздочка */}
                {onToggleImportant && (
                    <button
                        onClick={onToggleImportant}
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                            isImportant
                                ? 'text-amber-500 bg-amber-50'
                                : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                        }`}
                        title={isImportant ? 'Снять пометку «Важное»' : 'Пометить как «Важное»'}
                    >
                        {isImportant ? (
                            /* Заполненная звезда */
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        ) : (
                            /* Контурная звезда */
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        )}
                    </button>
                )}
                <button 
                    onClick={() => {
                        setIsSearchOpen(!isSearchOpen);
                        if (!isSearchOpen) {
                            // Очищаем при открытии
                            setTimeout(() => searchInputRef.current?.focus(), 100);
                        } else {
                            // Очищаем при закрытии
                            onSearchChange('');
                        }
                    }}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                        isSearchOpen 
                            ? 'text-indigo-600 bg-indigo-50' 
                            : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'
                    }`} 
                    title="Поиск по диалогу"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
                {/* Кнопка: фильтры отображения */}
                <button
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className={`relative w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                        isFiltersOpen
                            ? 'text-indigo-600 bg-indigo-50'
                            : hasActiveDisplayFilters
                                ? 'text-indigo-600 bg-indigo-50/50'
                                : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'
                    }`}
                    title="Фильтры отображения"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {/* Индикатор активных фильтров */}
                    {hasActiveDisplayFilters && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white" />
                    )}
                </button>
                {/* Кнопка: обновить историю сообщений */}
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                            isLoading
                                ? 'text-indigo-400 bg-indigo-50 cursor-not-allowed'
                                : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'
                        }`}
                        title="Обновить историю (загрузить последние 200 сообщений из VK)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                )}
                {/* Кнопка: открыть диалог в VK */}
                {vkDialogUrl && (
                    <a
                        href={vkDialogUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-indigo-600 hover:bg-gray-100 transition-colors"
                        title="Открыть диалог в VK"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                )}
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                            isMenuOpen
                                ? 'text-indigo-600 bg-indigo-50'
                                : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'
                        }`}
                        title="Ещё"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>

                    {/* Dropdown-меню */}
                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-fade-in">
                            {onMarkAsUnread && (
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        onMarkAsUnread();
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    {/* Иконка: конверт с точкой (непрочитанное) */}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    Отметить непрочитанным
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Панель фильтров отображения — раскрывается под хедером */}
        {isFiltersOpen && (
            <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 animate-expand-down">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Фильтры отображения</span>
                    {hasActiveDisplayFilters && (
                        <button
                            onClick={() => {
                                onFilterChange('all');
                                onDisplayFiltersChange({ hideAttachments: false, hideKeyboard: false, hideBotMessages: false });
                            }}
                            className="text-xs text-indigo-500 hover:text-indigo-600 font-medium"
                        >
                            Сбросить
                        </button>
                    )}
                </div>

                {/* Фильтр направления: Все / Наши / Пользователя — underline табы */}
                <div className="flex items-center gap-4 mb-2.5">
                    <span className="text-xs text-gray-400 mr-1.5 flex-shrink-0">Сообщения:</span>
                    {([
                        { key: 'all' as const, label: 'Все' },
                        { key: 'outgoing' as const, label: 'Наши' },
                        { key: 'incoming' as const, label: 'Пользователя' },
                    ]).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => onFilterChange(tab.key)}
                            className={`py-2 px-2 text-sm font-medium border-b-2 transition-colors ${
                                searchFilter === tab.key
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Toggle: скрыть вложения */}
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                        <button
                            onClick={() => onDisplayFiltersChange({ ...displayFilters, hideAttachments: !displayFilters.hideAttachments })}
                            className={`relative inline-flex items-center h-6 w-11 shrink-0 p-0 border-0 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
                                displayFilters.hideAttachments ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}
                        >
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-sm ${
                                displayFilters.hideAttachments ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                        <span className="text-xs text-gray-600 group-hover:text-gray-800">Скрыть вложения</span>
                    </label>

                    {/* Toggle: скрыть кнопки бота */}
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                        <button
                            onClick={() => onDisplayFiltersChange({ ...displayFilters, hideKeyboard: !displayFilters.hideKeyboard })}
                            className={`relative inline-flex items-center h-6 w-11 shrink-0 p-0 border-0 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
                                displayFilters.hideKeyboard ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}
                        >
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-sm ${
                                displayFilters.hideKeyboard ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                        <span className="text-xs text-gray-600 group-hover:text-gray-800">Скрыть кнопки</span>
                    </label>

                    {/* Toggle: скрыть сообщения бота/рассылки */}
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                        <button
                            onClick={() => onDisplayFiltersChange({ ...displayFilters, hideBotMessages: !displayFilters.hideBotMessages })}
                            className={`relative inline-flex items-center h-6 w-11 shrink-0 p-0 border-0 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
                                displayFilters.hideBotMessages ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}
                        >
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-sm ${
                                displayFilters.hideBotMessages ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                        </button>
                        <span className="text-xs text-gray-600 group-hover:text-gray-800">Скрыть бот/рассылку</span>
                    </label>
                </div>
            </div>
        )}

        {/* Панель поиска — раскрывается под хедером */}
        {isSearchOpen && (
            <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 animate-expand-down">
                {/* Поле ввода поиска — эталонный стиль без иконки лупы */}
                <div className="relative">
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="Поиск по сообщениям..."
                        className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {/* Кнопка очистки */}
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            title="Сбросить поиск"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Табы фильтров — underline стиль */}
                <div className="flex items-center gap-4 mt-2">
                    {([
                        { key: 'all' as const, label: 'Все' },
                        { key: 'outgoing' as const, label: 'Наши' },
                        { key: 'incoming' as const, label: 'Пользователя' },
                    ]).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => onFilterChange(tab.key)}
                            className={`py-2 px-2 text-sm font-medium border-b-2 transition-colors ${
                                searchFilter === tab.key
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        )}
    </>
    );
};
