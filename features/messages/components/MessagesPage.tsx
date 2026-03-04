/**
 * MessagesPage — хаб-контейнер.
 * Страница модуля "Сообщения" — рендерится в AppContent.
 * Если есть активный диалог — показывает ChatView + UserInfoPanel.
 * Если нет — показывает empty state.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Project, AuthUser } from '../../../shared/types';
import { MessagesChannel, Conversation, SSEUserTypingData, SSEDialogFocusData } from '../types';
import { MessageTemplate } from '../../../services/api/message_template.api';
import { ManagerFocusInfo } from '../hooks/chat/useTypingState';
import { ChatView } from './chat/ChatView';
import { MessagesEmptyState } from './MessagesEmptyState';
import { UserInfoPanel } from './user-info/UserInfoPanel';
import { CompactUserInfo, InfoTab } from './user-info/CompactUserInfo';
import { useMessagesPageLogic } from '../hooks/useMessagesPageLogic';

interface MessagesPageProps {
    /** Текущий канал (vk или tg) */
    channel: MessagesChannel;
    /** Активный проект (может быть null если не выбран) */
    activeProject: Project | null;
    /** ID выбранного диалога */
    activeConversationId: string | null;
    /** Колбэк выбора диалога — пробрасывается наверх в App.tsx */
    onSelectConversation: (id: string | null) => void;
    /** Список диалогов (приходит из App.tsx, загружается через useConversations) */
    conversations: Conversation[];
    /** Обновить unreadCount для пользователя (из SSE) */
    updateUnreadCount?: (vkUserId: number, count: number) => void;
    /** Обновить последнее сообщение для пользователя (из SSE) */
    updateLastMessage?: (vkUserId: number, message: any) => void;
    /** Добавить нового пользователя в список диалогов (из SSE mailing_user_updated) */
    addNewConversationFromSSE?: (user: import('../types').MailingUserInfo) => void;
    /** Текущий авторизованный пользователь (для имени менеджера) */
    user?: AuthUser;
    /** SSE-колбэк: пользователь VK печатает (передаётся в useTypingState в App.tsx) */
    onUserTyping?: (data: SSEUserTypingData) => void;
    /** SSE-колбэк: менеджер открыл/покинул диалог (передаётся в useTypingState в App.tsx) */
    onDialogFocusUpdate?: (data: SSEDialogFocusData, myManagerId: string) => void;
    /** SSE-колбэк: все диалоги прочитаны другим менеджером */
    onAllRead?: () => void;
    /** Set vk_user_id печатающих пользователей (из useTypingState в App.tsx) */
    typingUsers?: Set<number>;
    /** Map: vk_user_id → список менеджеров в диалоге (из useTypingState в App.tsx) */
    dialogFocuses?: Map<number, ManagerFocusInfo[]>;
    /** Оптимистичное обновление бейджа проекта в sidebar (projectId, unreadDialogsCount) */
    onProjectUnreadUpdate?: (projectId: string, count: number) => void;
    /** Запросить пересортировку списка диалогов (при новом входящем сообщении) */
    requestResort?: () => void;
    /** Переключить пометку «Важное» для диалога */
    toggleImportant?: (vkUserId: number, isImportant: boolean) => Promise<void>;
    // --- Метки (ярлыки) диалогов ---
    /** Все метки проекта */
    dialogLabels?: import('../../../services/api/dialog_labels.api').DialogLabel[];
    /** Назначить метку диалогу */
    onAssignLabel?: (vkUserId: number, labelId: string) => Promise<void>;
    /** Снять метку с диалога */
    onUnassignLabel?: (vkUserId: number, labelId: string) => Promise<void>;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
    channel,
    activeProject,
    activeConversationId,
    onSelectConversation,
    conversations,
    updateUnreadCount,
    updateLastMessage,
    addNewConversationFromSSE,
    user,
    onUserTyping,
    onDialogFocusUpdate,
    onAllRead,
    typingUsers,
    dialogFocuses,
    onProjectUnreadUpdate,
    requestResort,
    toggleImportant,
    dialogLabels = [],
    onAssignLabel,
    onUnassignLabel,
}) => {
    const { state, actions } = useMessagesPageLogic({
        activeProject,
        activeConversationId,
        onSelectConversation,
        conversations,
        updateUnreadCount,
        updateLastMessage,
        addNewConversationFromSSE,
        user,
        onUserTyping,
        onDialogFocusUpdate,
        onAllRead,
        typingUsers,
        dialogFocuses,
        onProjectUnreadUpdate,
        requestResort,
    });

    // --- Шаблоны ответов: связь между UserInfoPanel и ChatInput ---
    /** Ожидающий шаблон для вставки в чат (text + key для повторной вставки) */
    const [pendingTemplate, setPendingTemplate] = useState<{ text: string; key: number; mode: 'insert' | 'replace' } | null>(null);
    const templateKeyRef = useRef(0);
    /** Текст из чата для «Сохранить как шаблон» */
    const [saveAsTemplateText, setSaveAsTemplateText] = useState<string | null>(null);

    // --- Состояние правой панели: полный / минималистичный режим ---
    const STORAGE_KEY = 'vk-planner-info-panel-expanded';
    const [isInfoPanelExpanded, setIsInfoPanelExpanded] = useState<boolean>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored === 'true'; // по умолчанию минималистичный (false)
        } catch {
            return false;
        }
    });
    /** Вкладка, которую нужно открыть при раскрытии панели */
    const [initialTab, setInitialTab] = useState<InfoTab | undefined>(undefined);

    const toggleInfoPanel = useCallback(() => {
        setIsInfoPanelExpanded(prev => {
            const next = !prev;
            try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
            if (!next) setInitialTab(undefined); // сброс при сворачивании
            return next;
        });
    }, []);

    /** Клик по вкладке в компактном режиме — раскрываем панель на нужной вкладке */
    const handleExpandToTab = useCallback((tab: InfoTab) => {
        setInitialTab(tab);
        setIsInfoPanelExpanded(true);
        try { localStorage.setItem(STORAGE_KEY, 'true'); } catch {}
    }, []);

    /** Пользователь нажал «Вставить» или «Заменить» в TemplatesTab — передаём текст в ChatInput */
    const handleApplyTemplate = useCallback((template: MessageTemplate, mode: 'insert' | 'replace') => {
        templateKeyRef.current++;
        setPendingTemplate({ text: template.text, key: templateKeyRef.current, mode });
    }, []);

    /** Пользователь нажал «Сохранить как шаблон» в ChatInput — открываем редактор */
    const handleSaveAsTemplate = useCallback((text: string) => {
        setSaveAsTemplateText(text);
    }, []);

    /** Сброс saveAsTemplateText после открытия модалки */
    const handleClearSaveAsTemplate = useCallback(() => {
        setSaveAsTemplateText(null);
    }, []);

    /** Навигация к чату по VK user_id (из промокодов: «Перейти в чат») */
    const handleNavigateToChat = useCallback((vkUserId: number) => {
        // Формат ID в useConversations: "conv-{vk_user_id}"
        onSelectConversation(`conv-${vkUserId}`);
    }, [onSelectConversation]);

    // Если нет проекта или нет выбранного диалога — показываем empty state
    if (!activeProject || !state.activeConversation) {
        return (
            <MessagesEmptyState
                channel={channel}
                hasProject={!!activeProject}
            />
        );
    }

    // Есть активный диалог — показываем чат + правая панель (полная/минималистичная)
    return (
        <div className="flex h-full w-full">
            {/* Чат — занимает всю ширину в минималистичном режиме, 50% в полном */}
            <div className={`h-full flex-shrink-0 border-r border-gray-200 transition-all duration-300 ${
                isInfoPanelExpanded ? 'w-1/2' : 'flex-1'
            }`}>
                <ChatView
                    user={state.activeConversation.user}
                    messages={state.messages}
                    isLoading={state.isMessagesLoading}
                    isLoadingMore={state.isLoadingMore}
                    isLoadingAll={state.isLoadingAll}
                    isSending={state.isSending}
                    error={state.messagesError}
                    hasMore={state.hasMore}
                    isFullyLoaded={state.isFullyLoaded}
                    onLoadMore={actions.loadMore}
                    onLoadAll={actions.loadAll}
                    onRefresh={actions.refreshMessages}
                    onSendMessage={actions.sendMessageWithSender}
                    project={activeProject}
                    projectId={activeProject?.id || null}
                    vkDialogUrl={state.vkDialogUrl}
                    isUserTyping={state.isCurrentUserTyping}
                    otherManagers={state.currentDialogManagers}
                    onMarkAsUnread={actions.handleMarkAsUnread}
                    canWrite={state.userInfo?.can_write_private_message}
                    serverDirection={state.messageDirection}
                    onServerDirectionChange={actions.setMessageDirection}
                    serverSearchText={state.debouncedSearchText}
                    onServerSearchTextChange={actions.setDebouncedSearchText}
                    pendingTemplate={pendingTemplate}
                    onSaveAsTemplate={handleSaveAsTemplate}
                    isImportant={state.activeConversation.isImportant}
                    onToggleImportant={() => {
                        const vkUserId = Number(state.activeConversation!.user.id);
                        const newValue = !state.activeConversation!.isImportant;
                        toggleImportant?.(vkUserId, newValue);
                    }}
                    dialogLabels={dialogLabels}
                    assignedLabelIds={state.activeConversation.labelIds || []}
                    onAssignLabel={onAssignLabel ? (labelId: string) => {
                        const vkUserId = Number(state.activeConversation!.user.id);
                        onAssignLabel(vkUserId, labelId);
                    } : undefined}
                    onUnassignLabel={onUnassignLabel ? (labelId: string) => {
                        const vkUserId = Number(state.activeConversation!.user.id);
                        onUnassignLabel(vkUserId, labelId);
                    } : undefined}
                />
            </div>
            {/* Правая рабочая область — информация о пользователе */}
            <div className={`h-full border-l border-gray-100 transition-all duration-300 flex flex-col ${
                isInfoPanelExpanded ? 'flex-1' : 'w-[320px] flex-shrink-0'
            }`}>
                {/* Кнопка свернуть/развернуть */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                    <button
                        onClick={toggleInfoPanel}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title={isInfoPanelExpanded ? 'Свернуть панель' : 'Развернуть панель'}
                    >
                        {isInfoPanelExpanded ? (
                            /* Стрелка вправо — свернуть */
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        ) : (
                            /* Стрелка влево — развернуть */
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        )}
                    </button>
                    <span className="text-xs text-gray-400 font-medium">
                        {isInfoPanelExpanded ? 'Профиль пользователя' : 'Инфо'}
                    </span>
                </div>
                {isInfoPanelExpanded ? (
                    /* Полный режим — все вкладки */
                    <UserInfoPanel
                        userInfo={state.userInfo}
                        user={state.activeConversation.user}
                        isLoading={state.isUserInfoLoading}
                        error={state.userInfoError}
                        isFound={state.isUserInfoFound}
                        onRefresh={actions.refreshUserInfo}
                        isRefreshing={state.isUserInfoRefreshing}
                        userPosts={state.userPosts}
                        userPostsTotalCount={state.userPostsTotalCount}
                        userPostsLoading={state.isUserPostsLoading}
                        userPostsError={state.userPostsError}
                        userPostsHasMore={state.userPostsHasMore}
                        onLoadMorePosts={actions.loadMoreUserPosts}
                        messageStats={state.messageStats}
                        messages={state.messages}
                        isFullyLoaded={state.isFullyLoaded}
                        isLoadingAll={state.isLoadingAll}
                        onLoadAll={actions.loadAll}
                        projectId={activeProject?.id || null}
                        project={activeProject}
                        onApplyTemplate={handleApplyTemplate}
                        saveAsTemplateText={saveAsTemplateText}
                        onClearSaveAsTemplate={handleClearSaveAsTemplate}
                        currentUserId={Number(state.activeConversation.user.id) || null}
                        onNavigateToChat={handleNavigateToChat}
                        initialTab={initialTab}
                    />
                ) : (
                    /* Минималистичный режим — компактная карточка */
                    <CompactUserInfo
                        user={state.activeConversation.user}
                        userInfo={state.userInfo}
                        isLoading={state.isUserInfoLoading}
                        messageStats={state.messageStats}
                        isImportant={state.activeConversation.isImportant}
                        userPostsTotalCount={state.userPostsTotalCount}
                        onExpandToTab={handleExpandToTab}
                    />
                )}
            </div>
        </div>
    );
};
