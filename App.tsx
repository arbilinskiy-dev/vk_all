
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar } from './features/projects/components/Sidebar';
import { ProjectSettingsModal } from './features/projects/components/modals/ProjectSettingsModal';
import { useProjects } from './contexts/ProjectsContext';
import { useAuth } from './features/auth/contexts/AuthContext';
import { LoginPage } from './features/auth/components/LoginPage';
import { PrimarySidebar } from './features/navigation/components/PrimarySidebar';
import { GlobalAiErrorModal } from './shared/components/modals/GlobalAiErrorModal';
import { ConfirmationModal } from './shared/components/modals/ConfirmationModal';
import { ConversationsSidebar } from './features/messages/components/conversations/ConversationsSidebar';
import { useConversations } from './features/messages/hooks/chat/useConversations';
import { useDialogLabels } from './features/messages/hooks/useDialogLabels';
import { useTypingState } from './features/messages/hooks/chat/useTypingState';
import { useUnreadDialogCounts } from './features/messages/hooks/useUnreadDialogCounts';
import { useGlobalUnreadSSE } from './features/messages/hooks/useGlobalUnreadSSE';
import { MessagesChannel } from './features/messages/types';
import { markAllDialogsAsRead } from './services/api/messages.api';
import { msgLog, msgWarn, fmtProject } from './features/messages/utils/messagesLogger';

// Импорт новых хуков и компонентов
import { useAppState } from './hooks/useAppState';
import { useSmartRefresh } from './hooks/useSmartRefresh';
import { AccordionSectionKey } from './features/projects/components/modals/ProjectSettingsModal';
import { AppContent } from './features/navigation/components/AppContent';

export type AppView = 'schedule' | 'suggested' | 'products' | 'automations' | 'db-management' | 'user-management' | 'settings' | 'training' | 'updates' | 'automations-stories' | 'automations-reviews-contest' | 'automations-promo-drop' | 'automations-contests' | 'automations-ai-posts' | 'automations-birthday' | 'automations-activity-contest' | 'automations-contest-v2' | 'lists-system' | 'lists-user' | 'lists-automations' | 'vk-auth-test' | 'sandbox' | 'messages-vk' | 'messages-tg' | 'messages-stats';
export type AppModule = 'km' | 'am' | 'stats' | 'lists';

const App: React.FC = () => {
    const { user, isLoading: isAuthLoading } = useAuth();
    
    // Состояние приложения (Навигация и UI)
    const {
        activeModule,
        activeProjectId,
        setActiveProjectId,
        activeView,
        activeViewParams,
        setActiveViewParams,
        editingProject,
        setEditingProject,
        activeListGroup,
        setActiveListGroup,
        handleSelectModule,
        handleSelectGlobalView,
        handleSelectKmView,
        handleSelectListsView,
        handleSelectMessagesView
    } = useAppState();

    // Данные из контекста
    const {
        projects,
        scheduledPostCounts,
        suggestedPostCounts,
        projectPermissionErrors,
        isInitialLoading,
        isCheckingForUpdates,
        updatedProjectIds,
        handleUpdateProjectSettings,
        handleForceRefreshProjects: refreshProjectsFromContext,
        handleRefreshForSidebar,
    } = useProjects();

    // Логика "умного обновления" (Smart Refresh) вынесена в отдельный хук
    useSmartRefresh(activeProjectId, activeView, activeModule);

    // --- Состояние модуля сообщений ---
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    /** Фильтр непрочитанных диалогов: 'all' — все, 'unread' — только с непрочитанными, 'important' — важные */
    const [conversationFilterUnread, setConversationFilterUnread] = useState<'all' | 'unread' | 'important'>('all');

    // Загрузка диалогов из списка рассылки
    const messagesChannel: MessagesChannel = activeView === 'messages-tg' ? 'tg' : 'vk';
    const {
        conversations,
        isLoading: isConversationsLoading,
        error: conversationsError,
        totalCount: conversationsTotalCount,
        totalUnreadCount: conversationsTotalUnreadCount,
        hasMore: conversationsHasMore,
        loadMore: loadMoreConversations,
        refresh: refreshConversations,
        updateUnreadCount,
        updateLastMessage,
        addNewConversationFromSSE,
        resetAllUnreadCounts,
        requestResort,
        toggleImportant,
        dialogLabelsMap: conversationDialogLabelsMap,
        setDialogLabelsMap: setConversationDialogLabelsMap,
    } = useConversations({
        projectId: activeModule === 'am' ? activeProjectId : null,
        channel: messagesChannel,
        filterUnread: conversationFilterUnread,
    });

    // Метки (ярлыки) диалогов — CRUD + назначение
    const dialogLabelsProjectId = activeModule === 'am' ? activeProjectId : null;
    const {
        labels: dialogLabels,
        isLoading: isDialogLabelsLoading,
        createLabel: createDialogLabel,
        editLabel: editDialogLabel,
        removeLabel: removeDialogLabel,
        assignLabel: assignDialogLabel,
        unassignLabel: unassignDialogLabel,
        dialogLabelsMap,
        setDialogLabelsFromInit,
    } = useDialogLabels({ projectId: dialogLabelsProjectId });

    /** Фильтр по метке: null = не фильтруем, label_id = фильтруем */
    const [activeFilterLabelId, setActiveFilterLabelId] = useState<string | null>(null);

    // Сброс фильтра по метке при смене проекта
    const prevFilterProjectRef = React.useRef(activeProjectId);
    if (prevFilterProjectRef.current !== activeProjectId) {
        prevFilterProjectRef.current = activeProjectId;
        if (activeFilterLabelId) setActiveFilterLabelId(null);
    }

    // Обёртки assign/unassign: обновляют И useDialogLabels (counts), И useConversations (labelIds)
    const handleAssignLabel = useCallback(async (vkUserId: number, labelId: string) => {
        setConversationDialogLabelsMap(prev => {
            const current = prev[vkUserId] || [];
            if (current.includes(labelId)) return prev;
            return { ...prev, [vkUserId]: [...current, labelId] };
        });
        await assignDialogLabel(vkUserId, labelId);
    }, [assignDialogLabel, setConversationDialogLabelsMap]);

    const handleUnassignLabel = useCallback(async (vkUserId: number, labelId: string) => {
        setConversationDialogLabelsMap(prev => {
            const current = prev[vkUserId] || [];
            return { ...prev, [vkUserId]: current.filter(id => id !== labelId) };
        });
        await unassignDialogLabel(vkUserId, labelId);
    }, [unassignDialogLabel, setConversationDialogLabelsMap]);

    // Обёртка удаления метки: убираем из всех диалогов + удаляем
    const handleRemoveLabel = useCallback(async (labelId: string) => {
        setConversationDialogLabelsMap(prev => {
            const next = { ...prev };
            for (const uid of Object.keys(next)) {
                next[Number(uid)] = next[Number(uid)].filter(id => id !== labelId);
                if (next[Number(uid)].length === 0) delete next[Number(uid)];
            }
            return next;
        });
        await removeDialogLabel(labelId);
    }, [removeDialogLabel, setConversationDialogLabelsMap]);

    // Typing + Dialog Focus: состояние печати пользователей и фокуса менеджеров
    const {
        typingUsers,
        dialogFocuses,
        handleUserTyping,
        handleDialogFocus: handleDialogFocusUpdate,
    } = useTypingState(activeModule === 'am' ? activeProjectId : null);

    // Количество диалогов с непрочитанными для каждого проекта (бейдж в сайдбаре)
    const {
        unreadDialogCounts,
        updateProjectCount: updateUnreadDialogCount,
        refresh: refreshUnreadDialogCounts,
        isLoading: isRefreshingUnreadDialogCounts,
    } = useUnreadDialogCounts({
        projects,
        // Счётчики непрочитанных загружаются ВСЕГДА — чтобы бейджи в сайдбаре
        // отражали реальное кол-во диалогов с непрочитанными вне зависимости от модуля
        enabled: true,
    });

    // Глобальный SSE-стрим: обновляет счётчики непрочитанных по ВСЕМ проектам в реальном времени
    // Работает ВСЕГДА — не зависит от активного модуля
    useGlobalUnreadSSE({
        enabled: true,
        onUnreadCountChanged: updateUnreadDialogCount,
    });

    // ВАЖНО: sync-эффект из conversations УБРАН — он создавал гонку состояний.
    // conversations проходит через промежуточные состояния (stale-данные от предыдущего
    // проекта → пустой массив → новые данные), и sync перезаписывал правильные
    // счётчики из useUnreadDialogCounts неверными промежуточными значениями.
    // Единственный авторитетный источник: useUnreadDialogCounts (начальная загрузка
    // через API /unread-counts) + useGlobalUnreadSSE (push-обновление в реальном времени).

    // --- Логика защиты от потери данных при переключении проекта ---
    const [navigationBlocker, setNavigationBlocker] = useState<(() => boolean) | null>(null);
    const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
    const [showNavConfirm, setShowNavConfirm] = useState(false);
    // Секция, которую нужно открыть при открытии модалки настроек проекта
    const [settingsInitialSection, setSettingsInitialSection] = useState<AccordionSectionKey | null>(null);

    const handleProjectSwitch = (projectId: string | null) => {
        // Если проект тот же самый, ничего не делаем
        if (projectId === activeProjectId) return;

        // Если есть блокировщик и он возвращает true (данные не сохранены)
        if (navigationBlocker && navigationBlocker()) {
            setPendingProjectId(projectId);
            setShowNavConfirm(true);
        } else {
            setActiveProjectId(projectId);
            setActiveViewParams({}); // Сбрасываем параметры при смене проекта
            setActiveConversationId(null); // Сбрасываем активный диалог при смене проекта
            setConversationFilterUnread('all'); // Сброс фильтра непрочитанных при смене проекта
        }
    };

    const confirmProjectSwitch = () => {
        // Сбрасываем блокировщик перед переключением, чтобы не сработал повторно
        setNavigationBlocker(null); 
        setActiveProjectId(pendingProjectId);
        setActiveViewParams({}); // Сбрасываем параметры
        setConversationFilterUnread('all'); // Сброс фильтра непрочитанных при смене проекта
        setShowNavConfirm(false);
        setPendingProjectId(null);
    };

    const cancelProjectSwitch = () => {
        setShowNavConfirm(false);
        setPendingProjectId(null);
    };
    // ----------------------------------------------------------------

    // Вычисляемые значения
    const activeProject = projects.find(p => p.id === activeProjectId) || null;
    
    const uniqueTeams = useMemo(() => {
        const teams = new Set<string>();
        projects.forEach(p => {
            if (p.team) {
                teams.add(p.team);
            }
        });
        return Array.from(teams).sort();
    }, [projects]);

    const handleForceRefreshProjects = async () => {
        await refreshProjectsFromContext();
        setActiveProjectId(null);
    };

    // Функция навигации к конкурсу
    const handleNavigateToContest = () => {
        handleSelectKmView('automations-reviews-contest');
    };

    // Функция навигации к универсальным конкурсам
    const handleNavigateToGeneralContest = (contestId?: string) => {
        if (contestId) {
            setActiveViewParams({ contestId });
        } else {
            setActiveViewParams({});
        }
        handleSelectKmView('automations-contests');
    };

    // Функция навигации к AI постам
    const handleNavigateToAiPosts = (postId?: string) => {
        if (postId) {
            setActiveViewParams({ postId });
        } else {
            setActiveViewParams({});
        }
        handleSelectKmView('automations-ai-posts');
    };
    
    // Функция навигации к Конкурс 2.0
    const handleNavigateToContestV2 = (contestId: string, projectId: string) => {
        // Сначала переключаемся на нужный проект если необходимо
        if (activeProjectId !== projectId) {
            setActiveProjectId(projectId);
        }
        // Устанавливаем параметры и переходим во вью
        setActiveViewParams({ contestId });
        handleSelectKmView('automations-contest-v2');
    };

    /** Открыть настройки активного проекта на секции «Интеграции» */
    const handleOpenIntegrations = useCallback(() => {
        if (activeProject) {
            setSettingsInitialSection('integrations');
            setEditingProject(activeProject);
        }
    }, [activeProject, setEditingProject]);

    if (isAuthLoading) {
         return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="loader" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }
    
    if (!user) {
        return <LoginPage />;
    }

    return (
        <div className="h-screen w-screen flex antialiased text-gray-800 bg-gray-100">
            {/* Глобальное модальное окно для критических ошибок AI */}
            <GlobalAiErrorModal />
            
            <PrimarySidebar
                userRole={user.role}
                activeModule={activeModule}
                activeView={activeView}
                onSelectModule={handleSelectModule}
                onSelectView={handleSelectKmView}
                onSelectListsView={handleSelectListsView}
                onSelectMessagesView={handleSelectMessagesView}
                onSelectGlobalView={handleSelectGlobalView}
            />
            
            {/* Сайдбар проектов отображается в модулях контент-менеджмента, списков и сообщений (скрывается в мониторинге) */}
            {(activeModule === 'km' || activeModule === 'lists' || activeModule === 'am') && activeView !== 'messages-stats' && (
                 <Sidebar
                    projects={projects}
                    activeProjectId={activeProjectId}
                    activeView={activeView}
                    scheduledPostCounts={scheduledPostCounts}
                    suggestedPostCounts={suggestedPostCounts}
                    unreadDialogCounts={unreadDialogCounts}
                    onRefreshUnreadDialogCounts={refreshUnreadDialogCounts}
                    isRefreshingUnreadDialogCounts={isRefreshingUnreadDialogCounts}
                    isLoadingCounts={isInitialLoading}
                    isCheckingForUpdatesProjectId={isCheckingForUpdates}
                    projectPermissionErrors={projectPermissionErrors}
                    updatedProjectIds={updatedProjectIds}
                    onSelectProject={handleProjectSwitch}
                    onOpenSettings={setEditingProject}
                    onRefreshProject={handleRefreshForSidebar}
                    onForceRefresh={handleForceRefreshProjects}
                />
            )}

            {/* Сайдбар диалогов отображается в модуле сообщений при выбранном проекте (скрывается в мониторинге) */}
            {activeModule === 'am' && activeProject && activeView !== 'messages-stats' && (
                <ConversationsSidebar
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    onSelectConversation={setActiveConversationId}
                    projectName={activeProject.name}
                    isLoading={isConversationsLoading}
                    error={conversationsError}
                    totalCount={conversationsTotalCount}
                    totalUnreadCount={conversationsTotalUnreadCount}
                    hasMore={conversationsHasMore}
                    onLoadMore={loadMoreConversations}
                    onRefresh={refreshConversations}
                    typingUsers={typingUsers}
                    dialogFocuses={dialogFocuses}
                    activeProject={activeProject}
                    onOpenIntegrations={handleOpenIntegrations}
                    filterUnread={conversationFilterUnread}
                    onFilterUnreadChange={setConversationFilterUnread}
                    onMarkAllRead={async () => {
                        if (!activeProjectId) return;
                        try {
                            msgLog('MARK_READ', `🧹 mark-all-read: начало для ${fmtProject(activeProjectId)}`);
                            await markAllDialogsAsRead(activeProjectId);
                            // Сбрасываем локальные unread счётчики в списке диалогов
                            resetAllUnreadCounts();
                            // Немедленно обновляем бейдж в сайдбаре (не ждём SSE)
                            updateUnreadDialogCount(activeProjectId, 0);
                            msgLog('MARK_READ', `✅ mark-all-read: завершено для ${fmtProject(activeProjectId)}`);
                        } catch (err) {
                            msgWarn('MARK_READ', `Ошибка mark-all-read ${fmtProject(activeProjectId)}`, err);
                        }
                    }}
                    dialogLabels={dialogLabels}
                    isDialogLabelsLoading={isDialogLabelsLoading}
                    activeFilterLabelId={activeFilterLabelId}
                    onFilterByLabel={setActiveFilterLabelId}
                    onCreateLabel={createDialogLabel}
                    onEditLabel={editDialogLabel}
                    onRemoveLabel={handleRemoveLabel}
                />
            )}

            <main className="flex-1 flex flex-col overflow-hidden">
                <AppContent 
                    activeModule={activeModule}
                    activeView={activeView}
                    activeProject={activeProject}
                    activeViewParams={activeViewParams} // Передаем параметры
                    onClearParams={() => setActiveViewParams({})} // Функция очистки
                    user={user}
                    isInitialLoading={isInitialLoading}
                    activeListGroup={activeListGroup}
                    onActiveListGroupChange={setActiveListGroup}
                    onForceRefreshProjects={handleForceRefreshProjects}
                    onNavigateToContest={handleNavigateToContest}
                    onNavigateToGeneralContest={handleNavigateToGeneralContest}
                    onNavigateToAiPosts={handleNavigateToAiPosts}
                    onNavigateToContestV2={handleNavigateToContestV2}
                    setNavigationBlocker={setNavigationBlocker} // Передаем сеттер блокировщика
                    onGoToTraining={() => handleSelectGlobalView('training')} // Переход в центр обучения
                    onNavigateToMessages={(projectId, vkUserId) => {
                        // 1) Переключаем проект
                        setActiveProjectId(projectId);
                        // 2) Переключаем view на messages-vk
                        handleSelectMessagesView('messages-vk');
                        // 3) Открываем диалог с этим пользователем
                        // ID формат в useConversations: "conv-{vk_user_id}"
                        setActiveConversationId(`conv-${vkUserId}`);
                    }}
                    activeConversationId={activeConversationId}
                    onSelectConversation={setActiveConversationId}
                    conversations={conversations}
                    updateUnreadCount={updateUnreadCount}
                    updateLastMessage={updateLastMessage}
                    addNewConversationFromSSE={addNewConversationFromSSE}
                    onUserTyping={handleUserTyping}
                    onDialogFocusUpdate={handleDialogFocusUpdate}
                    onAllRead={resetAllUnreadCounts}
                    typingUsers={typingUsers}
                    dialogFocuses={dialogFocuses}
                    onProjectUnreadUpdate={updateUnreadDialogCount}
                    requestResort={requestResort}
                    toggleImportant={toggleImportant}
                    dialogLabels={dialogLabels}
                    onAssignLabel={handleAssignLabel}
                    onUnassignLabel={handleUnassignLabel}
                />
            </main>
            
            {editingProject && (
                <ProjectSettingsModal
                    project={editingProject}
                    uniqueTeams={uniqueTeams}
                    onClose={() => { setEditingProject(null); setSettingsInitialSection(null); }}
                    onSave={handleUpdateProjectSettings}
                    initialOpenSection={settingsInitialSection}
                />
            )}

            {showNavConfirm && (
                <ConfirmationModal
                    title="Переключиться в другой проект?"
                    message="У вас есть несохраненные изменения в текущей форме создания/редактирования. Если вы переключитесь, все заполненные данные будут утеряны."
                    onConfirm={confirmProjectSwitch}
                    onCancel={cancelProjectSwitch}
                    confirmText="Да, переключиться"
                    cancelText="Остаться"
                    confirmButtonVariant="danger"
                    zIndex="z-[60]"
                />
            )}
        </div>
    );
};

export default App;
