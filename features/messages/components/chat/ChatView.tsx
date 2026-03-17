import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Project } from '../../../../shared/types';
import { ChatMessageData, ChatActionData, ConversationUser, MessageSearchFilter, ChatDisplayFilters } from '../../types';
import { ManagerFocusInfo } from '../../hooks/chat/useTypingState';
import { ChatHeader } from './ChatHeader';
import { DialogLabel } from '../../../../services/api/dialog_labels.api';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';

/** Таймер дебаунса для поиска (мс) */
const SEARCH_DEBOUNCE_MS = 350;

interface ChatViewProps {
    /** Собеседник */
    user: ConversationUser;
    /** Массив сообщений диалога */
    messages: ChatMessageData[];
    /** Колбэк отправки сообщения */
    onSendMessage?: (text: string, attachments?: File[], replyTo?: number, forwardMessages?: string, optimisticReply?: ChatMessageData['replyMessage'], optimisticForwarded?: ChatMessageData['forwardedMessages']) => Promise<boolean>;
    /** Текущий проект (для переменных и emoji в ChatInput) */
    project?: Project | null;
    /** ID проекта */
    projectId?: string | null;
    /** Идёт ли первичная загрузка сообщений */
    isLoading?: boolean;
    /** Идёт ли подгрузка старых сообщений */
    isLoadingMore?: boolean;
    /** Идёт ли загрузка всех сообщений */
    isLoadingAll?: boolean;
    /** Идёт ли отправка сообщения */
    isSending?: boolean;
    /** Ошибка загрузки */
    error?: string | null;
    /** Есть ли ещё старые сообщения */
    hasMore?: boolean;
    /** Загружены ли все сообщения */
    isFullyLoaded?: boolean;
    /** Загрузить предыдущую страницу */
    onLoadMore?: () => void;
    /** Загрузить ВСЕ сообщения */
    onLoadAll?: () => void;
    /** Перезагрузить историю */
    onRefresh?: () => void;
    /** Ссылка на диалог в VK */
    vkDialogUrl?: string | null;
    /** Пользователь VK сейчас печатает */
    isUserTyping?: boolean;
    /** Другие менеджеры, которые сейчас в этом диалоге */
    otherManagers?: ManagerFocusInfo[];
    /** Колбэк: пометить диалог как непрочитанный (закрывает диалог) */
    onMarkAsUnread?: () => void;
    /** Статус: можно ли отправлять сообщения пользователю */
    canWrite?: boolean;
    /** Серверный фильтр по направлению (управляется родителем) */
    serverDirection?: MessageSearchFilter;
    /** Колбэк смены серверного фильтра направления */
    onServerDirectionChange?: (direction: MessageSearchFilter) => void;
    /** Серверный текст поиска (дебаунсированный) */
    serverSearchText?: string;
    /** Колбэк смены серверного текста поиска */
    onServerSearchTextChange?: (text: string) => void;
    /** Ожидающий шаблон для вставки/замены в поле ввода */
    pendingTemplate?: { text: string; key: number; mode: 'insert' | 'replace' } | null;
    /** Колбэк: сохранить текст как шаблон */
    onSaveAsTemplate?: (text: string) => void;
    /** Диалог помечен как «Важный» */
    isImportant?: boolean;
    /** Колбэк переключения пометки «Важное» */
    onToggleImportant?: () => void;
    // --- Метки диалога ---
    /** Все метки проекта */
    dialogLabels?: DialogLabel[];
    /** ID меток, назначенных этому диалогу */
    assignedLabelIds?: string[];
    /** Назначить метку */
    onAssignLabel?: (labelId: string) => void;
    /** Снять метку */
    onUnassignLabel?: (labelId: string) => void;
    /** Колбэк: открыть модал пересылки выбранных сообщений в групповой чат */
    onForwardToChat?: (messages: ChatMessageData[]) => void;
    /** Действия менеджеров в диалоге (для хронологии) */
    chatActions?: ChatActionData[];
    /** Колбэк навигации к диалогу с пользователем в нашей системе */
    onNavigateToDialog?: (vkUserId: number) => void;
}

/**
 * Рабочая область чата — шапка + список сообщений + поле ввода.
 * Рендерится в AppContent как основной контент при выбранном диалоге.
 */
export const ChatView: React.FC<ChatViewProps> = ({
    user,
    messages,
    onSendMessage,
    project,
    projectId,
    isLoading,
    isLoadingMore,
    isLoadingAll,
    isSending,
    error,
    hasMore,
    isFullyLoaded,
    onLoadMore,
    onLoadAll,
    onRefresh,
    vkDialogUrl,
    isUserTyping = false,
    otherManagers = [],
    onMarkAsUnread,
    canWrite,
    serverDirection = 'all',
    onServerDirectionChange,
    serverSearchText = '',
    onServerSearchTextChange,
    pendingTemplate,
    onSaveAsTemplate,
    isImportant,
    onToggleImportant,
    dialogLabels = [],
    assignedLabelIds = [],
    onAssignLabel,
    onUnassignLabel,
    onForwardToChat,
    chatActions = [],
    onNavigateToDialog,
}) => {
    // Локальный текст поиска (для мгновенного отображения в input)
    const [searchQuery, setSearchQuery] = useState('');
    // Используем серверный фильтр направления от родителя
    const searchFilter = serverDirection;

    // Дебаунс поискового запроса — отправляем на сервер через 350мс после последнего ввода
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleSearchQueryChange = useCallback((value: string) => {
        setSearchQuery(value);
        // Очищаем предыдущий таймер
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        // Если пустой — отправляем сразу (сброс поиска)
        if (!value.trim()) {
            onServerSearchTextChange?.('');
            return;
        }
        debounceTimerRef.current = setTimeout(() => {
            onServerSearchTextChange?.(value.trim());
        }, SEARCH_DEBOUNCE_MS);
    }, [onServerSearchTextChange]);

    // Очистка таймера при размонтировании
    useEffect(() => {
        return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
    }, []);

    // Смена фильтра направления — мгновенная отправка на сервер (без дебаунса)
    const handleFilterChange = useCallback((filter: MessageSearchFilter) => {
        onServerDirectionChange?.(filter);
    }, [onServerDirectionChange]);

    // Фильтры отображения (скрытие вложений/кнопок для компактности)
    const [displayFilters, setDisplayFilters] = useState<ChatDisplayFilters>({
        hideAttachments: false,
        hideKeyboard: false,
        hideBotMessages: false,
    });

    // Выбранные сообщения для ответа/пересылки (мультивыбор)
    const [selectedMessages, setSelectedMessages] = useState<ChatMessageData[]>([]);

    // Переключение выбора сообщения
    const handleToggleSelect = useCallback((message: ChatMessageData) => {
        setSelectedMessages(prev => {
            const exists = prev.some(m => m.id === message.id);
            if (exists) return prev.filter(m => m.id !== message.id);
            return [...prev, message];
        });
    }, []);

    // Сброс выбора при смене диалога
    useEffect(() => {
        setSelectedMessages([]);
    }, [user.id]);

    // Фильтрованные сообщения (клиентская фильтрация только для UI-фильтров: hideBotMessages)
    // Фильтры direction и search теперь обрабатываются сервером
    const filteredMessages = useMemo(() => {
        let result = messages;
        
        // Фильтр: скрыть сообщения бота/рассылки (клиентский, UI-only)
        if (displayFilters.hideBotMessages) {
            result = result.filter(m => !m.isBotMessage && !m.keyboard);
        }
        
        return result;
    }, [messages, displayFilters.hideBotMessages]);

    // Есть ли активный поиск/фильтр
    const isSearchActive = (serverSearchText || '').trim().length > 0 || searchFilter !== 'all';

    // === DEBUG: логируем состояние рендера ChatView ===
    const renderCountRef = useRef(0);
    renderCountRef.current++;
    const branch = isLoading && messages.length === 0
        ? 'SPINNER'
        : (error && messages.length === 0)
            ? 'ERROR'
            : isLoading
                ? 'STALE+LOADING (opacity-50)'
                : 'NORMAL';
    console.log(
        `%c[CHAT-VIEW] render #${renderCountRef.current} — ветка: ${branch}`,
        branch === 'SPINNER' ? 'color:#f00;font-weight:bold'
            : branch.startsWith('STALE') ? 'color:#f90;font-weight:bold'
            : 'color:#0a0',
        {
            userId: user.id,
            userName: user.firstName,
            isLoading,
            msgCount: messages.length,
            filteredCount: filteredMessages.length,
            error: error || null,
        }
    );

    // Лог смены пользователя
    const prevUserRef = useRef(user.id);
    useEffect(() => {
        if (prevUserRef.current !== user.id) {
            console.log(
                '%c[CHAT-VIEW] 🔄 СМЕНА ПОЛЬЗОВАТЕЛЯ',
                'color:#ff0;background:#333;font-weight:bold;padding:2px 6px',
                { from: prevUserRef.current, to: user.id, isLoading, msgCount: messages.length }
            );
            prevUserRef.current = user.id;
        }
    }, [user.id, isLoading, messages.length]);

    /** Отправка сообщения через бэкенд: 1 сообщение → reply_to, 2+ → forward_messages */
    const handleSendMessage = async (text: string, attachments?: File[]) => {
        if (onSendMessage) {
            if (selectedMessages.length === 1) {
                const msg = selectedMessages[0];
                const replyToId = Number(msg.id);
                const optimisticReply: ChatMessageData['replyMessage'] = {
                    id: msg.id,
                    text: msg.text,
                    direction: msg.direction,
                };
                await onSendMessage(text, attachments, replyToId, undefined, optimisticReply);
            } else if (selectedMessages.length > 1) {
                const forwardIds = selectedMessages.map(m => m.id).join(',');
                const optimisticForwarded: ChatMessageData['forwardedMessages'] = selectedMessages.map(m => ({
                    id: m.id,
                    text: m.text,
                    direction: m.direction,
                    timestamp: m.timestamp,
                }));
                await onSendMessage(text, attachments, undefined, forwardIds, undefined, optimisticForwarded);
            } else {
                await onSendMessage(text, attachments);
            }
            setSelectedMessages([]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Шапка чата */}
            <ChatHeader 
                user={user} 
                searchQuery={searchQuery}
                searchFilter={searchFilter}
                onSearchChange={handleSearchQueryChange}
                onFilterChange={handleFilterChange}
                displayFilters={displayFilters}
                onDisplayFiltersChange={setDisplayFilters}
                vkDialogUrl={vkDialogUrl}
                onRefresh={onRefresh}
                isLoading={isLoading}
                onMarkAsUnread={onMarkAsUnread}
                canWrite={canWrite}
                isImportant={isImportant}
                onToggleImportant={onToggleImportant}
                dialogLabels={dialogLabels}
                assignedLabelIds={assignedLabelIds}
                onAssignLabel={onAssignLabel}
                onUnassignLabel={onUnassignLabel}
            />

            {/* Основной контент — загрузка / ошибка / сообщения */}
            {isLoading && messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <div className="loader mx-auto h-8 w-8 border-2 border-gray-300 border-t-indigo-600"></div>
                    <p className="text-sm text-gray-400 mt-3">Загрузка сообщений...</p>
                </div>
            ) : error && messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center px-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-red-500 text-center mb-2">{error}</p>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium underline"
                        >
                            Повторить загрузку
                        </button>
                    )}
                </div>
            ) : (
                <div className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-200 ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    {/* Кнопка "Загрузить все сообщения" */}
                    {!isFullyLoaded && hasMore && (
                        <div className="flex-shrink-0 flex items-center justify-center py-2 border-b border-gray-100">
                            <button
                                onClick={onLoadAll}
                                disabled={isLoadingAll}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                {isLoadingAll ? (
                                    <>
                                        <div className="loader h-3 w-3 border-2 border-gray-300 border-t-indigo-600"></div>
                                        Загрузка всех сообщений...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Загрузить все сообщения
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                    {isFullyLoaded && (
                        <div className="flex-shrink-0 flex items-center justify-center py-1.5 border-b border-gray-100">
                            <span className="text-xs text-green-600 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Все сообщения загружены
                            </span>
                        </div>
                    )}
                    <ChatMessageList
                        messages={filteredMessages}
                        chatActions={chatActions}
                        isLoadingMore={isLoadingMore}
                        hasMore={hasMore}
                        onLoadMore={onLoadMore}
                        searchQuery={searchQuery}
                        displayFilters={displayFilters}
                        onReplyMessage={handleToggleSelect}
                        selectedMessageIds={selectedMessages.map(m => m.id)}
                        onNavigateToDialog={onNavigateToDialog}
                    />
                    {/* Индикатор результатов поиска */}
                    {isSearchActive && (
                        <div className="flex-shrink-0 flex items-center justify-center py-1.5 border-t border-gray-100 bg-gray-50">
                            <span className="text-xs text-gray-500">
                                {filteredMessages.length === 0 
                                    ? 'Ничего не найдено'
                                    : `Найдено: ${filteredMessages.length} сообщ.`
                                }
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Баннер: другой менеджер просматривает диалог */}
            {otherManagers.length > 0 && (
                <div className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border-t border-emerald-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-xs text-emerald-700">
                        {otherManagers.length === 1
                            ? `${otherManagers[0].managerName} также просматривает этот диалог`
                            : `${otherManagers.map(m => m.managerName).join(', ')} также просматривают этот диалог`
                        }
                    </span>
                </div>
            )}

            {/* Typing-индикатор: пользователь печатает */}
            {isUserTyping && (
                <div className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 border-t border-gray-100">
                    <span className="inline-flex gap-0.5">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    <span className="text-xs text-gray-500 italic">
                        {user.firstName} печатает...
                    </span>
                </div>
            )}

            {/* Кнопка «Переслать в чат» — при выбранных сообщениях */}
            {selectedMessages.length > 0 && onForwardToChat && (
                <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-t border-gray-100 bg-indigo-50/50">
                    <button
                        onClick={() => onForwardToChat(selectedMessages)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                        title="Переслать выбранные сообщения в групповой чат"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Переслать в чат
                        <span className="text-indigo-400">({selectedMessages.length})</span>
                    </button>
                </div>
            )}

            {/* Поле ввода */}
            <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isSending}
                project={project || null}
                projectId={projectId || null}
                userName={user.firstName}
                currentUserId={Number(user.id) || null}
                pendingTemplate={pendingTemplate}
                onSaveAsTemplate={onSaveAsTemplate}
                replyToMessage={selectedMessages.length > 0 ? selectedMessages[0] : null}
                selectedMessages={selectedMessages}
                onCancelReply={() => setSelectedMessages([])}
                onRemoveSelected={(id: string) => setSelectedMessages(prev => prev.filter(m => m.id !== id))}
            />
        </div>
    );
};
