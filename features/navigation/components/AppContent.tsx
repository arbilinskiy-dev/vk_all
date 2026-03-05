
import React, { useState } from 'react';
import { AppView, AppModule } from '../../../App';
import { Project, AuthUser } from '../../../shared/types';
import { ListGroup } from '../../lists/types';
import { useProjects } from '../../../contexts/ProjectsContext';

// Components
import { ScheduleTab } from '../../schedule/components/ScheduleTab';
import { SuggestedPostsTab } from '../../suggested-posts/components/SuggestedPostsTab';
import { ProductsTab } from '../../products/components/ProductsTab';
import { SystemListsTab } from '../../lists/components/SystemListsTab';
import { DatabaseManagementPage } from '../../database-management/components/DatabaseManagementPage';
import { UserManagementPage } from '../../users/components/UserManagementPage';
import { TrainingPage } from '../../training/components/TrainingPage';
import { ReviewsContestPage } from '../../automations/reviews-contest/ReviewsContestPage';
import { PlaceholderPage } from '../../../shared/components/PlaceholderPage';
import { WelcomeScreen } from '../../../shared/components/WelcomeScreen';
import { AiPostsPage } from '../../automations/ai-posts/AiPostsPage';
// NEW IMPORTS
import { GeneralContestsPage } from '../../automations/general-contests/GeneralContestsPage';
import { StoriesAutomationPage } from '../../automations/stories-automation/StoriesAutomationPage';
import { VkTestPage } from '../../test-auth/VkTestPage';
import { SettingsPage } from '../../settings/components/SettingsPage';
import { ContestV2Page } from '../../automations/contest-v2/ContestV2Page';
import { UpdatesPage } from '../../updates/components/UpdatesPage';
import { SandboxPage } from '../../sandbox/components/SandboxPage';
import { MessagesPage } from '../../messages/components/MessagesPage';
import { MessageStatsPage } from '../../messages/components/stats/MessageStatsPage';
import { AmAnalysisPage } from '../../messages/components/stats/AmAnalysisPage';
import { DlvryOrdersPage } from '../../statistics/dlvry/DlvryOrdersPage';
import { Conversation } from '../../messages/types';
import { ManagerFocusInfo } from '../../messages/hooks/chat/useTypingState';
import { SSEUserTypingData, SSEDialogFocusData } from '../../messages/types';

interface AppContentProps {
    activeModule: AppModule | null;
    activeView: AppView;
    activeProject: Project | null;
    activeViewParams?: Record<string, any>;
    onClearParams?: () => void;
    user: AuthUser;
    isInitialLoading: boolean;
    activeListGroup: ListGroup;
    onActiveListGroupChange: (group: ListGroup) => void;
    onForceRefreshProjects: () => Promise<void>;
    onNavigateToContest?: () => void;
    onNavigateToGeneralContest?: (contestId?: string) => void;
    onNavigateToAiPosts?: (postId?: string) => void;
    onNavigateToContestV2?: (contestId: string, projectId: string) => void; // Для Конкурс 2.0
    setNavigationBlocker?: React.Dispatch<React.SetStateAction<(() => boolean) | null>>;
    /** Колбэк для перехода в центр обучения */
    onGoToTraining?: () => void;
    /** Колбэк перехода в диалог: переключает проект + view + диалог */
    onNavigateToMessages?: (projectId: string, vkUserId: number) => void;
    /** ID активного диалога (модуль сообщений) */
    activeConversationId?: string | null;
    /** Колбэк выбора диалога */
    onSelectConversation?: (id: string | null) => void;
    /** Список диалогов (модуль сообщений) */
    conversations?: Conversation[];
    /** Обновить unreadCount для пользователя (из SSE) */
    updateUnreadCount?: (vkUserId: number, count: number) => void;
    /** Обновить последнее сообщение для пользователя (из SSE) */
    updateLastMessage?: (vkUserId: number, message: any) => void;
    /** Добавить нового пользователя в список диалогов (из SSE mailing_user_updated) */
    addNewConversationFromSSE?: (user: import('../../messages/types').MailingUserInfo) => void;
    /** SSE-колбэк: пользователь VK печатает */
    onUserTyping?: (data: SSEUserTypingData) => void;
    /** SSE-колбэк: менеджер открыл/покинул диалог */
    onDialogFocusUpdate?: (data: SSEDialogFocusData, myManagerId: string) => void;
    /** SSE-колбэк: все диалоги прочитаны другим менеджером */
    onAllRead?: () => void;
    /** Set vk_user_id печатающих пользователей */
    typingUsers?: Set<number>;
    /** Map: vk_user_id → список менеджеров в диалоге */
    dialogFocuses?: Map<number, ManagerFocusInfo[]>;
    /** Оптимистичное обновление бейджа проекта в sidebar (projectId, unreadDialogsCount) */
    onProjectUnreadUpdate?: (projectId: string, count: number) => void;
    /** Запросить пересортировку списка диалогов (при новом входящем сообщении) */
    requestResort?: () => void;
    /** Переключить пометку «Важное» для диалога */
    toggleImportant?: (vkUserId: number, isImportant: boolean) => Promise<void>;
    // --- Метки (ярлыки) диалогов ---
    /** Все метки проекта */
    dialogLabels?: import('../../../../services/api/dialog_labels.api').DialogLabel[];
    /** Назначить метку диалогу */
    onAssignLabel?: (vkUserId: number, labelId: string) => Promise<void>;
    /** Снять метку с диалога */
    onUnassignLabel?: (vkUserId: number, labelId: string) => Promise<void>;
}

export const AppContent: React.FC<AppContentProps> = ({
    activeModule,
    activeView,
    activeProject,
    activeViewParams,
    onClearParams,
    user,
    isInitialLoading,
    activeListGroup,
    onActiveListGroupChange,
    onForceRefreshProjects,
    onNavigateToContest,
    onNavigateToGeneralContest,
    onNavigateToAiPosts,
    onNavigateToContestV2,
    setNavigationBlocker,
    onGoToTraining,
    onNavigateToMessages,
    activeConversationId,
    onSelectConversation,
    conversations,
    updateUnreadCount,
    updateLastMessage,
    addNewConversationFromSSE,
    onUserTyping,
    onDialogFocusUpdate,
    onAllRead,
    typingUsers,
    dialogFocuses,
    onProjectUnreadUpdate,
    requestResort,
    toggleImportant,
    dialogLabels,
    onAssignLabel,
    onUnassignLabel,
}) => {
    const {
        projects,
        allPosts,
        allScheduledPosts,
        allSystemPosts,
        allSuggestedPosts,
        allNotes,
        allGlobalVarDefs,
        allGlobalVarValues,
        projectPermissionErrors,
        projectEmptyScheduleNotices,
        projectEmptySuggestedNotices,
        handleUpdateProjectSettings,
        handleNotesUpdate,
        setAllSuggestedPosts,
    } = useProjects();
    
    // Состояние вкладки для Stories Automation (хранится здесь, чтобы сохраняться при смене проекта)
    const [storiesActiveTab, setStoriesActiveTab] = useState<'settings' | 'stats' | 'create'>('settings');
    
    // State for General Contests Navigation (List <-> Editor) - MOVED TO GeneralContestsPage


    if (isInitialLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="loader mx-auto" style={{ width: '40px', height: '40px', borderTopColor: '#4f46e5' }}></div>
                    <p className="mt-4 text-gray-600">Загружаем данные из базы...</p>
                </div>
            </div>
        );
    }

    if (activeView === 'db-management') {
        return <DatabaseManagementPage onProjectsUpdate={onForceRefreshProjects} user={user} />;
    }
    if (activeView === 'user-management' && user?.role === 'admin') {
        return <UserManagementPage />;
    }
    if (activeView === 'settings') {
        return <SettingsPage />;
    }
    if (activeView === 'training') {
        return <TrainingPage />;
    }
    if (activeView === 'updates') {
        return <UpdatesPage />;
    }
    if (activeView === 'vk-auth-test') {
        return <VkTestPage />;
    }
    if (activeView === 'sandbox') {
        return <SandboxPage />;
    }
    
    if (activeView === 'automations') {
        return <PlaceholderPage title="Автоматизации" message="Выберите подраздел для настройки автоматизаций." />;
    }
    
    if (activeView === 'automations-stories') {
        // БЕЗ key — React переиспользует дерево, обновляя только данные внутри хуков.
        // Хуки (useStoriesSettings, useStoriesLoader, useStoriesDashboard) реактивно
        // сбрасывают и перезагружают данные через useEffect[projectId].
        // activeTab хранится здесь (в AppContent), чтобы сохраняться между переключениями проектов.
        return (
            <StoriesAutomationPage 
                projectId={activeProject?.id}
                activeTab={storiesActiveTab}
                setActiveTab={setStoriesActiveTab}
            />
        );
    }

    if (activeView === 'automations-reviews-contest') {
        if (!activeProject) return <WelcomeScreen onGoToTraining={onGoToTraining} />;
        return <ReviewsContestPage project={activeProject} />;
    }

    // --- GENERAL CONTESTS ROUTING ---
    if (activeView === 'automations-contests') {
        if (!activeProject) return <WelcomeScreen onGoToTraining={onGoToTraining} />;
        
        return (
            <GeneralContestsPage 
                projectId={activeProject.id} 
                setNavigationBlocker={setNavigationBlocker}
                initialContestId={activeViewParams?.contestId}
                onClearParams={onClearParams}
            />
        );
    }
    
    // --- CONTEST V2 ROUTING ---
    if (activeView === 'automations-contest-v2') {
        if (!activeProject) return <WelcomeScreen onGoToTraining={onGoToTraining} />;
        
        return (
            <ContestV2Page 
                projectId={activeProject.id} 
                setNavigationBlocker={setNavigationBlocker}
                initialContestId={activeViewParams?.contestId}
                onClearParams={onClearParams}
            />
        );
    }
    
    if (activeView === 'automations-ai-posts') {
        if (!activeProject) return <WelcomeScreen onGoToTraining={onGoToTraining} />;
        return (
            <AiPostsPage 
                projectId={activeProject.id} 
                setNavigationBlocker={setNavigationBlocker}
                initialPostId={activeViewParams?.postId}
                onClearParams={onClearParams}
            />
        );
    }
    
    // --- МОДУЛЬ СООБЩЕНИЙ ---
    if (activeView === 'messages-am-analysis') {
        return <AmAnalysisPage />;
    }

    if (activeView === 'messages-stats') {
        return (
            <MessageStatsPage
                projects={projects}
                onNavigateToChat={(projectId, vkUserId) => {
                    if (onNavigateToMessages) {
                        onNavigateToMessages(projectId, vkUserId);
                    }
                }}
            />
        );
    }

    if (activeView === 'messages-vk' || activeView === 'messages-tg') {
        const channel = activeView === 'messages-tg' ? 'tg' : 'vk';
        return (
            <MessagesPage 
                channel={channel}
                activeProject={activeProject}
                activeConversationId={activeConversationId ?? null}
                onSelectConversation={onSelectConversation ?? (() => {})}
                conversations={conversations ?? []}
                updateUnreadCount={updateUnreadCount}
                updateLastMessage={updateLastMessage}
                addNewConversationFromSSE={addNewConversationFromSSE}
                user={user}
                onUserTyping={onUserTyping}
                onDialogFocusUpdate={onDialogFocusUpdate}
                onAllRead={onAllRead}
                typingUsers={typingUsers}
                dialogFocuses={dialogFocuses}
                onProjectUnreadUpdate={onProjectUnreadUpdate}
                requestResort={requestResort}
                toggleImportant={toggleImportant}
                dialogLabels={dialogLabels}
                onAssignLabel={onAssignLabel}
                onUnassignLabel={onUnassignLabel}
            />
        );
    }

    // ... rest of the component (schedule, products, lists)
    if (activeModule === 'km') {
        if (!activeProject) return <WelcomeScreen onGoToTraining={onGoToTraining} />;
        if (activeView === 'schedule') {
             return (
                <ScheduleTab
                    key={activeProject.id}
                    project={activeProject}
                    projects={projects}
                    publishedPosts={allPosts[activeProject.id] || []}
                    scheduledPosts={allScheduledPosts[activeProject.id] || []}
                    systemPosts={allSystemPosts[activeProject.id] || []}
                    notes={allNotes[activeProject.id] || []}
                    allGlobalVarDefs={allGlobalVarDefs}
                    allGlobalVarValues={allGlobalVarValues}
                    onUpdateProject={handleUpdateProjectSettings}
                    onNotesUpdate={handleNotesUpdate}
                    permissionErrorMessage={projectPermissionErrors[activeProject.id]}
                    emptyScheduleMessage={projectEmptyScheduleNotices[activeProject.id]}
                    onNavigateToContest={onNavigateToContest}
                    onNavigateToGeneralContest={onNavigateToGeneralContest}
                    onNavigateToAiPosts={onNavigateToAiPosts}
                    onNavigateToContestV2={onNavigateToContestV2}
                />
            );
        }
        if (activeView === 'suggested') {
            return (
                <SuggestedPostsTab
                    key={activeProject.id}
                    project={activeProject}
                    cachedPosts={allSuggestedPosts[activeProject.id]}
                    onPostsLoaded={(posts) => {
                         setAllSuggestedPosts(prev => ({...prev, [activeProject.id]: posts}));
                    }}
                    permissionErrorMessage={projectPermissionErrors[activeProject.id]}
                    emptySuggestedMessage={projectEmptySuggestedNotices[activeProject.id]}
                />
            );
        }
        if (activeView === 'products') {
            return (
                <ProductsTab 
                    key={activeProject.id} 
                    project={activeProject}
                    permissionErrorMessage={projectPermissionErrors[activeProject.id]}
                />
            );
        }
    }
    
    if (activeModule === 'lists') {
        if (!activeProject) return <WelcomeScreen onGoToTraining={onGoToTraining} />;
        if (activeView === 'lists-system' || activeView === 'lists-automations') {
            return <SystemListsTab 
                project={activeProject} 
                activeListGroup={activeListGroup}
                onActiveListGroupChange={onActiveListGroupChange}
                activeView={activeView}
            />;
        }
         return <PlaceholderPage title="Раздел в разработке" message="Этот раздел скоро появится." />;
    }

    // --- МОДУЛЬ СТАТИСТИКИ ---
    if (activeModule === 'stats') {
        if (activeView === 'stats-db-agency') {
            return <PlaceholderPage title="DB Agency" message="Статистика базы данных агентства — в разработке." />;
        }
        if (activeView === 'stats-db-project') {
            return <PlaceholderPage title="DB Project" message="Статистика базы данных проекта — в разработке." />;
        }
        if (activeView === 'stats-dlvry') {
            return <DlvryOrdersPage project={activeProject} />;
        }
        if (activeView === 'stats-crm') {
            return <PlaceholderPage title="CRM" message="CRM статистика — в разработке." />;
        }
        if (activeView === 'stats-vk-ads') {
            return <PlaceholderPage title="VK Ads" message="Статистика VK рекламы — в разработке." />;
        }
        if (activeView === 'stats-vk-mass') {
            return <PlaceholderPage title="VK Mass" message="Статистика VK массовых рассылок — в разработке." />;
        }
        if (activeView === 'stats-vk-group') {
            return <PlaceholderPage title="VK Group" message="Статистика VK сообщества — в разработке." />;
        }
        if (activeView === 'stats-vk-content') {
            return <PlaceholderPage title="VK Content" message="Статистика VK контента — в разработке." />;
        }
        return <PlaceholderPage title="Статистика" message="Выберите подраздел в меню слева." />;
    }

    return <WelcomeScreen onGoToTraining={onGoToTraining} />;
};
