import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Project } from '../../../../shared/types';
import { Conversation } from '../../types';
import { ConversationItem } from './ConversationItem';
import { MailingOnboarding } from './MailingOnboarding';
import { ConversationItemSkeleton } from './ConversationItemSkeleton';
import { useMailingCollection } from '../../hooks/mailing/useMailingCollection';
import { ManagerFocusInfo } from '../../hooks/chat/useTypingState';
import { ConfirmationModal } from '../../../../shared/components/modals/ConfirmationModal';
import { msgLog } from '../../utils/messagesLogger';

/** Блокирующие состояния: токен/callback не готовы — работа с сообщениями невозможна */
const BLOCKING_STATES = new Set(['checking', 'no-token', 'no-callback', 'setting-up-callback', 'callback-error']);

interface ConversationsSidebarProps {
    /** Список диалогов */
    conversations: Conversation[];
    /** ID активного диалога */
    activeConversationId: string | null;
    /** Колбэк выбора диалога */
    onSelectConversation: (conversationId: string) => void;
    /** Имя проекта (сообщества) — для заголовка */
    projectName: string;
    /** Загружается ли список */
    isLoading?: boolean;
    /** Ошибка загрузки */
    error?: string | null;
    /** Общее количество пользователей в рассылке */
    totalCount?: number;
    /** Есть ли ещё данные для подгрузки */
    hasMore?: boolean;
    /** Колбэк подгрузки следующей страницы */
    onLoadMore?: () => void;
    /** Колбэк перезагрузки */
    onRefresh?: () => void;
    /** Set vk_user_id печатающих пользователей */
    typingUsers?: Set<number>;
    /** Map: vk_user_id → список менеджеров в диалоге */
    dialogFocuses?: Map<number, ManagerFocusInfo[]>;
    /** Активный проект (для проверки токена/callback) */
    activeProject?: Project | null;
    /** Открыть настройки проекта на секции «Интеграции» */
    onOpenIntegrations?: () => void;
    /** Текущий фильтр по непрочитанным: 'all' | 'unread' | 'important' */
    filterUnread?: 'all' | 'unread' | 'important';
    /** Колбэк смены фильтра непрочитанных */
    onFilterUnreadChange?: (value: 'all' | 'unread' | 'important') => void;
    /** Колбэк «Прочитать все» — пометить все диалоги прочитанными */
    onMarkAllRead?: () => Promise<void>;
}

/**
 * Сайдбар со списком диалогов (пользователей).
 * Появляется в App.tsx при выборе проекта в модуле «am» (сообщения).
 * Включает поиск по имени и фильтр по непрочитанным.
 */
export const ConversationsSidebar: React.FC<ConversationsSidebarProps> = ({
    conversations,
    activeConversationId,
    onSelectConversation,
    projectName,
    isLoading = false,
    error = null,
    totalCount = 0,
    hasMore = false,
    onLoadMore,
    onRefresh,
    typingUsers,
    dialogFocuses,
    activeProject,
    onOpenIntegrations,
    filterUnread = 'all',
    onFilterUnreadChange,
    onMarkAllRead,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showMarkAllReadConfirm, setShowMarkAllReadConfirm] = useState(false);
    const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
    const listRef = useRef<HTMLElement>(null);

    /** Set ID диалогов, которые уже были показаны — защита от ре-анимации при ремаунте дочерних ConversationItem.
     *  Живёт на уровне ConversationsSidebar (не сбрасывается при ремаунте отдельных элементов списка). */
    const shownConvIdsRef = useRef<Set<string>>(new Set());

    // Проверка готовности: токен → callback → сбор
    const mailingCollection = useMailingCollection({
        project: activeProject || null,
        onDataAvailable: onRefresh,
    });

    // Блокируем весь список если токен/callback не готовы
    const isBlocked = activeProject && onOpenIntegrations && BLOCKING_STATES.has(mailingCollection.readiness);

    // Подсчёт общего числа непрочитанных диалогов
    const unreadDialogsCount = useMemo(
        () => conversations.filter(c => c.unreadCount > 0).length,
        [conversations]
    );

    // Лог рендера сайдбара
    msgLog('SIDEBAR', `📝 ConversationsSidebar render: диалогов=${conversations.length}, непрочитанных=${unreadDialogsCount}, фильтр=${filterUnread}, активный=${activeConversationId || 'null'}, isLoading=${isLoading}`);

    // Обработчик подтверждения «Прочитать все»
    const handleConfirmMarkAllRead = useCallback(async () => {
        if (!onMarkAllRead) return;
        setIsMarkingAllRead(true);
        try {
            await onMarkAllRead();
        } finally {
            setIsMarkingAllRead(false);
            setShowMarkAllReadConfirm(false);
        }
    }, [onMarkAllRead]);

    // Фильтрация диалогов: поиск по имени + фильтр непрочитанных
    const filteredConversations = useMemo(() => {
        let result = conversations;

        // Фильтр по непрочитанным
        if (filterUnread === 'unread') {
            result = result.filter(c => c.unreadCount > 0);
        }

        // Поиск по имени
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(c =>
                `${c.user.firstName} ${c.user.lastName}`.toLowerCase().includes(query)
            );
        }

        return result;
    }, [conversations, searchQuery, filterUnread]);

    // После рендера помечаем все текущие диалоги как «уже показанные»
    // (useEffect выполняется после paint → ID добавляются после первого отображения,
    //  при следующем рендере ConversationItem получит skipAnimation=true → не мигнёт)
    useEffect(() => {
        filteredConversations.forEach(c => shownConvIdsRef.current.add(c.id));
    }, [filteredConversations]);

    // Обработчик скролла для подгрузки
    const handleScroll = useCallback(() => {
        if (!listRef.current || !hasMore || isLoading || !onLoadMore) return;
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        // Подгружаем когда до конца остаётся менее 200px
        if (scrollHeight - scrollTop - clientHeight < 200) {
            onLoadMore();
        }
    }, [hasMore, isLoading, onLoadMore]);

    // ─── Каскадное раскрытие: скелетоны → реальные данные последовательно ────────
    /** Количество скелетонов при загрузке — заполняет видимую область сайдбара */
    const SKELETON_VISIBLE_COUNT = 14;

    /** Сколько элементов уже «раскрыто» из скелетонов в реальные данные */
    const [revealedCount, setRevealedCount] = useState<number>(Infinity);
    /** Флаг: была первичная загрузка (показывались скелетоны) */
    const wasEmptyLoadingRef = useRef(false);
    /** Ref таймера каскадного раскрытия */
    const revealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // Фаза 1: первичная загрузка началась — показать скелетоны
        if (isLoading && conversations.length === 0) {
            wasEmptyLoadingRef.current = true;
            setRevealedCount(0);
            if (revealTimerRef.current) {
                clearInterval(revealTimerRef.current);
                revealTimerRef.current = null;
            }
            return;
        }
        // Фаза 2: данные пришли после скелетона → каскадное раскрытие
        if (wasEmptyLoadingRef.current && conversations.length > 0) {
            wasEmptyLoadingRef.current = false;
            if (revealTimerRef.current) {
                clearInterval(revealTimerRef.current);
                revealTimerRef.current = null;
            }
            let count = 0;
            const limit = Math.min(conversations.length, SKELETON_VISIBLE_COUNT);

            revealTimerRef.current = setInterval(() => {
                count++;
                if (count >= limit) {
                    // Раскрыли все видимые — показать остальные мгновенно
                    setRevealedCount(Infinity);
                    clearInterval(revealTimerRef.current!);
                    revealTimerRef.current = null;
                } else {
                    setRevealedCount(count);
                }
            }, 35);
        }
    }, [isLoading, conversations.length]);

    // Очистка таймера при размонтировании
    useEffect(() => {
        return () => {
            if (revealTimerRef.current) clearInterval(revealTimerRef.current);
        };
    }, []);

    /** Количество слотов в гибридном списке (скелетоны + данные) */
    const totalSlots = filteredConversations.length > 0
        ? filteredConversations.length
        : (isLoading && !error ? SKELETON_VISIBLE_COUNT : 0);

    return (
        <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
            {/* Заголовок */}
            <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800 truncate" title={projectName}>
                        Диалоги
                    </h3>
                    <div className="flex items-center gap-1.5">
                        {/* Счётчик пользователей */}
                        <span className="text-[11px] text-gray-400">
                            {totalCount > 0 ? totalCount : ''}
                        </span>
                        {/* Кнопка обновления */}
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                disabled={isLoading}
                                className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                                title="Обновить список"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        )}
                        {/* Кнопка «Собрать все сообщения» — аналог сбора подписчиков в рассылку */}
                        {activeProject && !isBlocked && (
                            <button
                                onClick={() => {
                                    if (mailingCollection.readiness === 'collecting') return;
                                    mailingCollection.startCollection();
                                }}
                                disabled={mailingCollection.readiness === 'collecting'}
                                className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                                    mailingCollection.readiness === 'collecting'
                                        ? 'text-indigo-500 bg-indigo-50 cursor-wait'
                                        : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                                }`}
                                title={
                                    mailingCollection.readiness === 'collecting'
                                        ? `Сбор подписчиков... ${mailingCollection.progressLabel}`
                                        : 'Собрать все сообщения (обновить список рассылки)'
                                }
                            >
                                {mailingCollection.readiness === 'collecting' ? (
                                    <div className="loader h-3.5 w-3.5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                )}
                            </button>
                        )}
                    </div>
                </div>
                {/* Прогресс сбора подписчиков — показывается при активном сборе */}
                {mailingCollection.readiness === 'collecting' && mailingCollection.progressLabel ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="loader h-2.5 w-2.5 border-[1.5px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin flex-shrink-0"></div>
                        <span className="text-xs text-indigo-600 font-medium truncate">
                            Сбор: {mailingCollection.progressLabel}
                        </span>
                    </div>
                ) : mailingCollection.readiness === 'done' ? (
                    <p className="text-xs text-green-600 truncate mt-0.5">✓ Сбор завершён</p>
                ) : mailingCollection.readiness === 'error' && mailingCollection.errorMessage ? (
                    <p className="text-xs text-red-500 truncate mt-0.5" title={mailingCollection.errorMessage}>
                        Ошибка сбора
                    </p>
                ) : (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{projectName}</p>
                )}
            </div>

            {/* Блокировка: токен/callback не готовы — показываем onboarding вместо всего списка */}
            {isBlocked && onOpenIntegrations ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <MailingOnboarding
                        onOpenIntegrations={onOpenIntegrations}
                        mailingCollection={mailingCollection}
                    />
                </div>
            ) : (
            <>
            {/* Поиск — унифицирован со стилем Sidebar проектов */}
            <div className="px-3 py-2 border-b border-gray-100">
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск по имени..."
                        className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {/* Крестик сброса поиска */}
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            title="Сбросить поиск"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Фильтр: Все / Непрочитанные / Важные / Прочитать все — компактные SVG-иконки */}
            {onFilterUnreadChange && (
                <div className="px-3 py-1 border-b border-gray-100 flex items-center gap-0.5">
                    {/* Все */}
                    <button
                        onClick={() => onFilterUnreadChange('all')}
                        className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                            filterUnread === 'all'
                                ? 'text-indigo-600 bg-indigo-50'
                                : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-50'
                        }`}
                        title="Все диалоги"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </button>
                    {/* Непрочитанные */}
                    <button
                        onClick={() => onFilterUnreadChange('unread')}
                        className={`relative w-6 h-6 flex items-center justify-center rounded transition-colors ${
                            filterUnread === 'unread'
                                ? 'text-indigo-600 bg-indigo-50'
                                : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-50'
                        }`}
                        title="Непрочитанные"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {/* Бейдж с количеством непрочитанных */}
                        {unreadDialogsCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[12px] h-[12px] px-0.5 bg-indigo-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                {unreadDialogsCount > 99 ? '99+' : unreadDialogsCount}
                            </span>
                        )}
                    </button>
                    {/* Важные */}
                    <button
                        onClick={() => onFilterUnreadChange('important')}
                        className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                            filterUnread === 'important'
                                ? 'text-amber-500 bg-amber-50'
                                : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                        }`}
                        title="Важные"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill={filterUnread === 'important' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                    {/* Прочитать все — сдвинуто вправо */}
                    {onMarkAllRead && (
                        <button
                            onClick={() => setShowMarkAllReadConfirm(true)}
                            className="ml-auto w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                            title="Пометить все диалоги как прочитанные"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                    )}
                </div>
            )}

            {/* Список диалогов */}
            <nav ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar" onScroll={handleScroll}>
                {/* Ошибка загрузки */}
                {error && (
                    <div className="px-4 py-3 bg-red-50 border-b border-red-100">
                        <p className="text-xs text-red-600">{error}</p>
                        {onRefresh && (
                            <button onClick={onRefresh} className="text-xs text-red-700 font-medium underline mt-1">
                                Повторить
                            </button>
                        )}
                    </div>
                )}

                {/* Гибридный список: скелетоны каскадно превращаются в реальные данные */}
                {totalSlots > 0 ? (
                    <>
                        {Array.from({ length: totalSlots }, (_, i) => {
                            const conv = filteredConversations[i];
                            // Элемент раскрыт — показать реальный ConversationItem
                            if (conv && i < revealedCount) {
                                return (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        isActive={conv.id === activeConversationId}
                                        onClick={() => onSelectConversation(conv.id)}
                                        animationIndex={0}
                                        isTyping={typingUsers?.has(Number(conv.user.id)) ?? false}
                                        focusedManagers={dialogFocuses?.get(Number(conv.user.id)) || []}
                                        skipAnimation={shownConvIdsRef.current.has(conv.id)}
                                    />
                                );
                            }
                            // Ещё не раскрыт — показать скелетон-заглушку
                            return <ConversationItemSkeleton key={`skel-${i}`} index={i} />;
                        })}
                        {/* Индикатор подгрузки следующей страницы */}
                        {isLoading && conversations.length > 0 && (
                            <div className="flex items-center justify-center py-3">
                                <div className="loader" style={{ width: '20px', height: '20px' }}></div>
                            </div>
                        )}
                    </>
                ) : (
                    !isLoading && !error && (
                        searchQuery ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-sm text-gray-400 text-center">Пользователи не найдены</p>
                            </div>
                        ) : filterUnread === 'unread' ? (
                            /* Нет непрочитанных диалогов */
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-gray-400 text-center">Нет непрочитанных</p>
                                <p className="text-xs text-gray-300 text-center mt-1">Все диалоги прочитаны</p>
                            </div>
                        ) : filterUnread === 'important' ? (
                            /* Нет важных диалогов */
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                <p className="text-sm text-gray-400 text-center">Нет важных диалогов</p>
                                <p className="text-xs text-gray-300 text-center mt-1">Пометьте диалог звёздочкой ★ в шапке чата</p>
                            </div>
                        ) : (
                            /* Empty state: сообщения ещё не загружены */
                            activeProject && onOpenIntegrations ? (
                                <MailingOnboarding
                                    onOpenIntegrations={onOpenIntegrations}
                                    mailingCollection={mailingCollection}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 px-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <p className="text-sm text-gray-400 text-center">Список рассылки пуст</p>
                                    <p className="text-xs text-gray-300 text-center mt-1">Обновите список рассылки в разделе «Списки»</p>
                                </div>
                            )
                        )
                    )
                )}
            </nav>
            </>
            )}

            {/* Модалка подтверждения «Прочитать все» */}
            {showMarkAllReadConfirm && (
                <ConfirmationModal
                    title="Прочитать все диалоги?"
                    message={`Все непрочитанные диалоги будут помечены как прочитанные.${unreadDialogsCount > 0 ? ` Сейчас непрочитанных: ${unreadDialogsCount}.` : ''} Это действие нельзя отменить.`}
                    onConfirm={handleConfirmMarkAllRead}
                    onCancel={() => setShowMarkAllReadConfirm(false)}
                    confirmText="Прочитать все"
                    cancelText="Отмена"
                    isConfirming={isMarkingAllRead}
                    confirmButtonVariant="primary"
                />
            )}
        </div>
    );
};
