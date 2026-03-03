
import { useEffect, useRef } from 'react';
import { AppView, AppModule } from '../App';
import { useProjects } from '../contexts/ProjectsContext';
import * as api from '../services/api';

export const useSmartRefresh = (
    activeProjectId: string | null,
    activeView: AppView,
    activeModule: AppModule | null
) => {
    const {
        allPosts,
        allSuggestedPosts,
        isBackgroundLoading,
        projectPermissionErrors,
        projectEmptyScheduleNotices,
        projectEmptySuggestedNotices,
        setIsCheckingForUpdates,
        updatedProjectIds,
        handleRefreshForSidebar,
        syncDataForProject,
        handleRefreshPublished,
        handleRefreshScheduled,
        handleRefreshSuggested,
        handleRefreshStories
    } = useProjects();

    // Refs для чтения данных БЕЗ добавления в зависимости useEffect
    // Это предотвращает перезапуск эффекта при каждом обновлении батча в Фазе 2
    const allPostsRef = useRef(allPosts);
    const allSuggestedPostsRef = useRef(allSuggestedPosts);
    allPostsRef.current = allPosts;
    allSuggestedPostsRef.current = allSuggestedPosts;

    // Ref для отслеживания активных операций и предотвращения гонки состояний
    const activeOperationsRef = useRef<Map<string, AbortController>>(new Map());
    // Ref для дебаунсинга проверки свежести
    const stalenessCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Ref для предотвращения дублирования операций
    const lastProcessedRef = useRef<{ projectId: string | null; view: AppView | null; timestamp: number }>({
        projectId: null,
        view: null,
        timestamp: 0
    });

    useEffect(() => {
        if (!activeProjectId || (activeModule !== 'km' && activeModule !== 'lists')) return;
        
        // Блокируем SmartRefresh пока идёт фоновая загрузка батчей (Фаза 2)
        // Это предотвращает гонку состояний: каждый батч менял refs → useEffect перезапускался
        if (isBackgroundLoading) {
            return;
        }
        
        // Защита от слишком частых вызовов для одного и того же проекта (debounce 300ms)
        const now = Date.now();
        const last = lastProcessedRef.current;
        if (last.projectId === activeProjectId && last.view === activeView && (now - last.timestamp) < 300) {
            return;
        }

        const hasPermissionError = !!projectPermissionErrors[activeProjectId];
        const hasEmptyScheduleNotice = !!projectEmptyScheduleNotices[activeProjectId];
        const hasEmptySuggestedNotice = !!projectEmptySuggestedNotices[activeProjectId];

        if (hasPermissionError) {
             return;
        }
        if (activeView === 'schedule' && hasEmptyScheduleNotice) {
            return;
        }
        if (activeView === 'suggested' && hasEmptySuggestedNotice) {
             return;
        }

        const hasUpdateFlag = updatedProjectIds.has(activeProjectId);
        
        // Читаем из refs, чтобы не триггерить перезапуск useEffect при каждом обновлении батча
        let isDataMissing = false;
        if (activeView === 'schedule') {
            if (allPostsRef.current[activeProjectId] === undefined) {
                isDataMissing = true;
            }
        } else if (activeView === 'suggested') {
            if (allSuggestedPostsRef.current[activeProjectId] === undefined) {
                isDataMissing = true;
            }
        }

        // Ключ для отслеживания активной операции
        const operationKey = `${activeProjectId}_${activeView}`;
        
        // Отменяем предыдущую операцию для этого проекта/вида, если она есть
        const existingController = activeOperationsRef.current.get(operationKey);
        if (existingController) {
            existingController.abort();
            activeOperationsRef.current.delete(operationKey);
        }

        // Создаем новый AbortController для текущей операции
        const abortController = new AbortController();
        activeOperationsRef.current.set(operationKey, abortController);

        // Обновляем timestamp последней обработки
        lastProcessedRef.current = { projectId: activeProjectId, view: activeView, timestamp: now };

        if (isDataMissing) {
            // ВАЖНО: Вместо того чтобы сразу запускать refresh (запрос к API VK),
            // мы сначала просто подтягиваем данные из БД через syncDataForProject.
            // Пользователь сам нажмет "Обновить", если данные устарели.
            // Это значительно ускоряет вход в проект и снижает нагрузку на API.
            syncDataForProject(activeProjectId, activeView);
        } else if (hasUpdateFlag) {
            syncDataForProject(activeProjectId, activeView);
        } else {
             
             // Очищаем предыдущий таймер проверки свежести
             if (stalenessCheckTimeoutRef.current) {
                 clearTimeout(stalenessCheckTimeoutRef.current);
             }
             
             // Дебаунсим проверку свежести на 500ms для предотвращения множественных запросов
             stalenessCheckTimeoutRef.current = setTimeout(async () => {
                // Проверяем, не была ли операция отменена
                if (abortController.signal.aborted) {
                    return;
                }

                try {
                    const status = await api.getProjectUpdateStatus();
                    
                    // Повторная проверка после async операции
                    if (abortController.signal.aborted) {
                        return;
                    }

                    const promises: Promise<any>[] = [];
                    let needsAnyRefresh = false;

                    if (activeView === 'schedule') {
                        if (status.stalePublished.includes(activeProjectId)) {
                            promises.push(handleRefreshPublished(activeProjectId));
                            needsAnyRefresh = true;
                        }
                        if (status.staleScheduled.includes(activeProjectId)) {
                            promises.push(handleRefreshScheduled(activeProjectId));
                            needsAnyRefresh = true;
                        }
                        // Истории живут 24ч — проверяем свежесть с порогом 6ч
                        if (status.staleStories?.includes(activeProjectId)) {
                            promises.push(handleRefreshStories(activeProjectId));
                            needsAnyRefresh = true;
                        }
                    } else if (activeView === 'suggested' && status.staleSuggested.includes(activeProjectId)) {
                        promises.push(handleRefreshSuggested(activeProjectId));
                        needsAnyRefresh = true;
                    }

                    if (needsAnyRefresh) {
                        // Финальная проверка перед запуском обновлений
                        if (abortController.signal.aborted) {
                            return;
                        }
                        
                        setIsCheckingForUpdates(activeProjectId);
                        await Promise.allSettled(promises).finally(() => {
                            setIsCheckingForUpdates(null);
                        });
                    } else {
                    }
                } catch (error) {
                    if (!abortController.signal.aborted) {
                        console.error("Ошибка при проверке свежести данных:", error);
                    }
                } finally {
                    // Удаляем контроллер из списка активных операций
                    activeOperationsRef.current.delete(operationKey);
                }
             }, 500);
        }

        // Cleanup функция для отмены операций при размонтировании или изменении зависимостей
        return () => {
            abortController.abort();
            activeOperationsRef.current.delete(operationKey);
            if (stalenessCheckTimeoutRef.current) {
                clearTimeout(stalenessCheckTimeoutRef.current);
            }
        };
    }, [
        activeProjectId, 
        activeView, 
        activeModule,
        isBackgroundLoading,
        handleRefreshForSidebar, 
        handleRefreshPublished, 
        handleRefreshScheduled, 
        handleRefreshSuggested, 
        handleRefreshStories,
        projectEmptyScheduleNotices, 
        projectEmptySuggestedNotices,
        projectPermissionErrors, 
        setIsCheckingForUpdates, 
        syncDataForProject, 
        updatedProjectIds
    ]);
};
