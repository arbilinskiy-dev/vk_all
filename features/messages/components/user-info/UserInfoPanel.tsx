/**
 * Панель информации о пользователе — правая часть страницы "Сообщения".
 * Hub-файл: импортирует шапку, вкладку профиля и утилиты.
 * Контракт не изменён.
 */

import React, { useState, useEffect, useRef } from 'react';
import { MailingUserInfo, ConversationUser, ChatMessageData } from '../../types';
import { SystemListPost } from '../../../../shared/types';
import { UserPostsTab } from './UserPostsTab';
import { AttachmentsTab } from '../attachments/AttachmentsTab';
import { MessageStats } from '../../hooks/chat/useMessageHistory';
import { UserInfoPanelHeader } from './UserInfoPanelHeader';
import { UserInfoProfileTab } from './UserInfoProfileTab';
import { TemplatesTab } from '../templates/TemplatesTab';
import { PromocodesTab } from '../promocodes/PromocodesTab';
import { MessageTemplate } from '../../../../services/api/message_template.api';
import { Project } from '../../../../shared/types';

/** Вкладка панели информации */
type InfoTab = 'profile' | 'posts' | 'attachments' | 'templates' | 'promocodes';

interface UserInfoPanelProps {
    /** Данные пользователя из рассылки */
    userInfo: MailingUserInfo | null;
    /** Базовые данные из диалога (аватар, имя) */
    user: ConversationUser;
    /** Идёт первичная загрузка */
    isLoading: boolean;
    /** Ошибка */
    error: string | null;
    /** Найден ли в рассылке */
    isFound: boolean;
    /** Обновить данные пользователя (запрос в VK API + запись в БД) */
    onRefresh?: () => void;
    /** Идёт фоновое обновление данных (не скрывает контент) */
    isRefreshing?: boolean;
    /** --- Данные для вкладки «Посты» --- */
    /** Посты пользователя в сообществе */
    userPosts?: SystemListPost[];
    /** Общее количество постов */
    userPostsTotalCount?: number;
    /** Идёт загрузка постов */
    userPostsLoading?: boolean;
    /** Ошибка загрузки постов */
    userPostsError?: string | null;
    /** Есть ещё страницы постов */
    userPostsHasMore?: boolean;
    /** Загрузить ещё постов */
    onLoadMorePosts?: () => void;
    /** --- Статистика сообщений --- */
    /** Статистика: всего в VK, в кэше, входящие/исходящие */
    messageStats?: MessageStats | null;
    /** --- Данные для вкладки «Вложения» --- */
    /** Все загруженные сообщения (для извлечения вложений) */
    messages?: ChatMessageData[];
    /** Загружена ли вся история сообщений */
    isFullyLoaded?: boolean;
    /** Идёт ли загрузка всех сообщений */
    isLoadingAll?: boolean;
    /** Загрузить все сообщения */
    onLoadAll?: () => void;
    /** --- Шаблоны ответов --- */
    /** ID проекта (для CRUD шаблонов) */
    projectId?: string | null;
    /** Объект проекта (для переменных в шаблонах) */
    project?: Project | null;
    /** Вставить/заменить шаблон в поле ввода чата */
    onApplyTemplate?: (template: MessageTemplate, mode: 'insert' | 'replace') => void;
    /** Текст из чата для «Сохранить как шаблон» */
    saveAsTemplateText?: string | null;
    /** Сбросить текст «Сохранить как шаблон» после открытия модалки */
    onClearSaveAsTemplate?: () => void;
    /** VK user_id текущего собеседника */
    currentUserId?: number | null;
    /** Колбэк навигации к чату по VK user_id (из промокодов) */
    onNavigateToChat?: (vkUserId: number) => void;
    /** Начальная вкладка (при раскрытии из компактного режима) */
    initialTab?: 'profile' | 'posts' | 'attachments' | 'templates' | 'promocodes';
}

export const UserInfoPanel: React.FC<UserInfoPanelProps> = ({
    userInfo,
    user,
    isLoading,
    error,
    isFound,
    onRefresh,
    isRefreshing,
    userPosts = [],
    userPostsTotalCount = 0,
    userPostsLoading = false,
    userPostsError = null,
    userPostsHasMore = false,
    onLoadMorePosts,
    messageStats,
    messages = [],
    isFullyLoaded = false,
    isLoadingAll = false,
    onLoadAll,
    projectId,
    project,
    onApplyTemplate,
    saveAsTemplateText,
    onClearSaveAsTemplate,
    currentUserId,
    onNavigateToChat,
    initialTab,
}) => {
    const [activeTab, setActiveTab] = useState<InfoTab>(initialTab || 'profile');

    // При изменении initialTab (клик по вкладке из компактного режима) — переключаем вкладку
    const prevInitialTabRef = useRef(initialTab);
    useEffect(() => {
        if (initialTab && initialTab !== prevInitialTabRef.current) {
            setActiveTab(initialTab);
        }
        prevInitialTabRef.current = initialTab;
    }, [initialTab]);
    const renderCountRef = useRef(0);
    renderCountRef.current++;

    // Автопереключение на вкладку «Шаблоны» при запросе «Сохранить как шаблон» из чата
    useEffect(() => {
        if (saveAsTemplateText) {
            setActiveTab('templates');
        }
    }, [saveAsTemplateText]);

    // Сброс вкладки при смене пользователя — только если была вкладка с данными конкретного юзера (профиль, посты, вложения)
    // Вкладки «Шаблоны» и «Промокоды» — общие для проекта, сохраняем при переходе между чатами
    const prevUserIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (prevUserIdRef.current !== null && prevUserIdRef.current !== user.id) {
            console.log(
                '%c[INFO-PANEL] 🔄 СМЕНА ПОЛЬЗОВАТЕЛЯ — сохраняем вкладку',
                'color:#ff0;background:#333;font-weight:bold;padding:2px 6px',
                { from: prevUserIdRef.current, to: user.id, tab: activeTab }
            );
            // Сбрасываем только пользовательские вкладки, не общие
            if (activeTab === 'posts' || activeTab === 'attachments') {
                setActiveTab('profile');
            }
        }
        prevUserIdRef.current = user.id;
    }, [user.id, activeTab]);

    // === DEBUG: логируем состояние рендера ===
    const renderBranch = (isLoading && !userInfo)
        ? 'LOADING-SPINNER'
        : error
            ? 'ERROR'
            : (!isFound || !userInfo)
                ? 'NOT-FOUND'
                : 'CONTENT';
    console.log(
        `%c[INFO-PANEL] render #${renderCountRef.current} — ветка: ${renderBranch}`,
        renderBranch === 'LOADING-SPINNER' ? 'color:#f00;font-weight:bold'
            : renderBranch === 'CONTENT' ? 'color:#0a0'
            : 'color:#f90',
        {
            userId: user.id,
            userName: user.firstName,
            isLoading,
            isRefreshing,
            hasUserInfo: !!userInfo,
            isFound,
            error: error || null,
            activeTab,
        }
    );

    // Загрузка (только первичная — когда данных ещё нет вообще)
    if (isLoading && !userInfo) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center animate-fade-in">
                <div className="loader h-6 w-6 border-2 border-gray-300 border-t-indigo-600"></div>
                <p className="text-xs text-gray-400 mt-2">Загрузка профиля...</p>
            </div>
        );
    }

    // Ошибка
    if (error) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center px-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-xs text-red-400 text-center">{error}</p>
            </div>
        );
    }

    // Не найден в рассылке
    if (!isFound || !userInfo) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center px-6 animate-fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-sm text-gray-400 text-center">Пользователь не найден в базе рассылки</p>
                <p className="text-xs text-gray-300 mt-1 text-center">Запустите синхронизацию рассылки в разделе «Списки»</p>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex flex-col bg-white overflow-y-auto custom-scrollbar">

            {/* Шапка — аватар, имя, ссылка на VK */}
            <UserInfoPanelHeader userInfo={userInfo} user={user} />

            {/* Переключатель вкладок — underline стиль */}
            <div className="px-4 pt-2 bg-white border-b border-gray-200">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`py-2 px-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'profile'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Профиль
                    </button>
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`py-2 px-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'posts'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Посты{userPostsTotalCount > 0 ? ` - ${userPostsTotalCount}` : ''}
                    </button>
                    <button
                        onClick={() => setActiveTab('attachments')}
                        className={`py-2 px-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'attachments'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Вложения
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`py-2 px-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'templates'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Шаблоны
                    </button>
                    <button
                        onClick={() => setActiveTab('promocodes')}
                        className={`py-2 px-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'promocodes'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Промокоды
                    </button>
                </div>
            </div>

            {/* Контент вкладок — без key, React обновляет DOM in-place без пересоздания */}
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                {activeTab === 'posts' && (
                    <UserPostsTab
                        posts={userPosts}
                        totalCount={userPostsTotalCount}
                        isLoading={userPostsLoading}
                        error={userPostsError}
                        hasMore={userPostsHasMore}
                        onLoadMore={onLoadMorePosts || (() => {})}
                    />
                )}

                {activeTab === 'attachments' && (
                    <AttachmentsTab
                        messages={messages}
                        isFullyLoaded={isFullyLoaded}
                        isLoadingAll={isLoadingAll}
                        onLoadAll={onLoadAll || (() => {})}
                        loadedMessagesCount={messages.length}
                    />
                )}

                {activeTab === 'profile' && (
                    <UserInfoProfileTab
                        userInfo={userInfo}
                        onRefresh={onRefresh}
                        isRefreshing={isRefreshing}
                        messageStats={messageStats}
                    />
                )}

                {activeTab === 'templates' && (
                    <TemplatesTab
                        projectId={projectId || null}
                        project={project || null}
                        onApplyTemplate={onApplyTemplate || ((() => {}) as any)}
                        userName={user.firstName}
                        currentUserId={currentUserId}
                        saveAsTemplateText={saveAsTemplateText}
                        onClearSaveAsTemplate={onClearSaveAsTemplate}
                    />
                )}

                {activeTab === 'promocodes' && (
                    <PromocodesTab
                        projectId={projectId || null}
                        vkGroupId={project?.vkProjectId}
                        onNavigateToChat={onNavigateToChat}
                    />
                )}
            </div>
        </div>
    );
};
