
import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Project, ProjectSummary, AllPosts, ScheduledPost, SuggestedPost, Note, SystemPost, GlobalVariableDefinition, ProjectGlobalVariableValue, ContestStatus, UnifiedStory } from '../shared/types';
import { AppView } from '../App';
import { useDataInitialization } from './hooks/useDataInitialization';
import { useUpdatePolling } from './hooks/useUpdatePolling';
import { useDataRefreshers } from './hooks/useDataRefreshers';
import * as api from '../services/api';

interface IProjectsContext {
    projects: ProjectSummary[];
    allPosts: AllPosts;
    allScheduledPosts: Record<string, ScheduledPost[]>;
    allSuggestedPosts: Record<string, SuggestedPost[]>;
    // FIX: Add `setAllSuggestedPosts` to the context interface to make it available to consumers.
    setAllSuggestedPosts: React.Dispatch<React.SetStateAction<Record<string, SuggestedPost[]>>>;
    allSystemPosts: Record<string, SystemPost[]>;
    allStories: Record<string, UnifiedStory[]>; // Новое состояние для историй
    allNotes: Record<string, Note[]>;
    allGlobalVarDefs: GlobalVariableDefinition[];
    allGlobalVarValues: Record<string, ProjectGlobalVariableValue[]>;
    scheduledPostCounts: Record<string, number>;
    suggestedPostCounts: Record<string, number>;
    // Обновленное состояние для статусов конкурсов
    reviewsContestStatuses: Record<string, ContestStatus>;
    setReviewsContestStatuses: React.Dispatch<React.SetStateAction<Record<string, ContestStatus>>>;
    
    // Статусы автоматизации историй {projectId: is_active}
    storiesAutomationStatuses: Record<string, boolean>;
    setStoriesAutomationStatuses: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    
    projectPermissionErrors: Record<string, string | null>;
    setProjectPermissionErrors: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
    projectEmptyScheduleNotices: Record<string, string | null>;
    projectEmptySuggestedNotices: Record<string, string | null>;
    isInitialLoading: boolean;
    isBackgroundLoading: boolean; // Флаг фоновой загрузки контента
    isCheckingForUpdates: string | null;
    setIsCheckingForUpdates: React.Dispatch<React.SetStateAction<string | null>>;
    updatedProjectIds: Set<string>;
    
    // Functions
    handleUpdateProjectSettings: (updatedProject: Project) => Promise<void>;
    handleForceRefreshProjects: () => Promise<void>;
    getFullProject: (projectId: string) => Promise<Project>;
    handleRefreshForSidebar: (projectId: string, activeView: AppView, silent?: boolean) => Promise<number>;
    handleBulkRefresh: (projectIds: string[]) => Promise<void>;
    handleSystemPostUpdate: (projectIds: string[]) => Promise<void>; // Новая функция
    handleNotesUpdate: (projectId?: string) => Promise<void>;
    syncDataForProject: (projectId: string, activeView: AppView) => Promise<void>;
    handleRefreshPublished: (projectId: string) => Promise<void>;
    handleRefreshScheduled: (projectId: string) => Promise<ScheduledPost[]>;
    handleRefreshSuggested: (projectId: string) => Promise<SuggestedPost[]>;
    handleRefreshStories: (projectId: string) => Promise<void>; // Новая функция
    handleRefreshAllSchedule: (projectId: string) => Promise<void>;
}

const ProjectsContext = createContext<IProjectsContext | undefined>(undefined);

export const useProjects = (): IProjectsContext => {
    const context = useContext(ProjectsContext);
    if (!context) {
        throw new Error('useProjects must be used within a ProjectsProvider');
    }
    return context;
};

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 1. Хук для первоначальной загрузки данных (гибридная загрузка)
    const { isInitialLoading, isBackgroundLoading, initialData } = useDataInitialization();

    // 2. Инициализация состояний на основе данных из хука
    // Ref для отслеживания ссылки на initialData.projects — чтобы фоновые чанки (Фаза 2)
    // не перезатирали projects, обновлённые через handleForceRefreshProjects
    const prevInitialProjectsRef = useRef(initialData.projects);
    const [projects, setProjects] = useState<ProjectSummary[]>(initialData.projects);
    const [projectDetailsCache, setProjectDetailsCache] = useState<Record<string, Project>>({});
    const [allPosts, setAllPosts] = useState<AllPosts>(initialData.allPosts);
    const [allScheduledPosts, setAllScheduledPosts] = useState<Record<string, ScheduledPost[]>>(initialData.allScheduledPosts);
    const [allSuggestedPosts, setAllSuggestedPosts] = useState<Record<string, SuggestedPost[]>>(initialData.allSuggestedPosts);
    const [allSystemPosts, setAllSystemPosts] = useState<Record<string, SystemPost[]>>(initialData.allSystemPosts);
    const [allStories, setAllStories] = useState<Record<string, UnifiedStory[]>>(initialData.allStories || {});
    const [allNotes, setAllNotes] = useState<Record<string, Note[]>>(initialData.allNotes);
    const [allGlobalVarDefs, setAllGlobalVarDefs] = useState<GlobalVariableDefinition[]>(initialData.allGlobalVarDefs);
    const [allGlobalVarValues, setAllGlobalVarValues] = useState<Record<string, ProjectGlobalVariableValue[]>>(initialData.allGlobalVarValues);
    const [scheduledPostCounts, setScheduledPostCounts] = useState<Record<string, number>>(initialData.scheduledPostCounts);
    const [suggestedPostCounts, setSuggestedPostCounts] = useState<Record<string, number>>(initialData.suggestedPostCounts);
    const [reviewsContestStatuses, setReviewsContestStatuses] = useState<Record<string, ContestStatus>>(initialData.reviewsContestStatuses);
    const [storiesAutomationStatuses, setStoriesAutomationStatuses] = useState<Record<string, boolean>>(initialData.storiesAutomationStatuses || {});

    useEffect(() => {
        // Обновляем projects ТОЛЬКО когда ссылка на массив реально изменилась.
        // Фаза 2 (mergeChunkData) создаёт новый объект initialData, но НЕ меняет projects —
        // без этой проверки каждый чанк перезатирал бы projects данными из Фазы 1,
        // отменяя изменения от handleForceRefreshProjects (баг DLVRY ID).
        if (initialData.projects !== prevInitialProjectsRef.current) {
            setProjects(initialData.projects);
            prevInitialProjectsRef.current = initialData.projects;
        }
        setAllPosts(initialData.allPosts);
        setAllScheduledPosts(initialData.allScheduledPosts);
        setAllSuggestedPosts(initialData.allSuggestedPosts);
        setAllSystemPosts(initialData.allSystemPosts);
        setAllStories(initialData.allStories || {});
        setAllNotes(initialData.allNotes);
        setAllGlobalVarDefs(initialData.allGlobalVarDefs);
        setAllGlobalVarValues(initialData.allGlobalVarValues);
        setScheduledPostCounts(initialData.scheduledPostCounts);
        setSuggestedPostCounts(initialData.suggestedPostCounts);
        setReviewsContestStatuses(initialData.reviewsContestStatuses);
        setStoriesAutomationStatuses(initialData.storiesAutomationStatuses || {});
    }, [initialData]);

    // 3. Хук для фонового опроса
    const { updatedProjectIds, setUpdatedProjectIds, addRecentRefresh, setBackgroundLoading } = useUpdatePolling();
    
    // Синхронизируем флаг фоновой загрузки с polling'ом,
    // чтобы polling не спамил getUpdates пока идёт Фаза 2
    useEffect(() => {
        setBackgroundLoading(isBackgroundLoading);
    }, [isBackgroundLoading, setBackgroundLoading]);
    
    // 4. Хук для всех функций обновления (передаем ему состояния и сеттеры)
    const {
        states,
        setters,
        refreshers,
    } = useDataRefreshers({
        initialProjects: initialData.projects, // Передаем исходные проекты для onForceRefresh
        projects, setProjects,
        allPosts, setAllPosts,
        allScheduledPosts, setAllScheduledPosts,
        allSuggestedPosts, setAllSuggestedPosts,
        allSystemPosts, setAllSystemPosts,
        allStories, setAllStories,
        allNotes, setAllNotes,
        allGlobalVarDefs, setAllGlobalVarDefs,
        allGlobalVarValues, setAllGlobalVarValues,
        scheduledPostCounts, setScheduledPostCounts,
        suggestedPostCounts, setSuggestedPostCounts,
        updatedProjectIds, setUpdatedProjectIds,
        addRecentRefresh,
    });

    // Загрузка полных данных проекта с кешированием
    const getFullProject = useCallback(async (projectId: string): Promise<Project> => {
        if (projectDetailsCache[projectId]) {
            return projectDetailsCache[projectId];
        }
        const fullProject = await api.getProjectDetails(projectId);
        setProjectDetailsCache(prev => ({ ...prev, [projectId]: fullProject }));
        return fullProject;
    }, [projectDetailsCache]);
    
    const value = {
        ...states,
        ...setters,
        ...refreshers,
        reviewsContestStatuses,
        setReviewsContestStatuses,
        storiesAutomationStatuses,
        setStoriesAutomationStatuses,
        allStories,
        isInitialLoading,
        isBackgroundLoading, // Флаг фоновой загрузки для UI индикаторов
        // FIX: Provide `setAllSuggestedPosts` in the context value.
        setAllSuggestedPosts,
        getFullProject,
    };

    return <ProjectsContext.Provider value={value as IProjectsContext}>{children}</ProjectsContext.Provider>;
};
