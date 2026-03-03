
import { useState, useEffect, useCallback, useRef } from 'react';
import { Project, AllPosts, ScheduledPost, SuggestedPost, Note, SystemPost, GlobalVariableDefinition, ProjectGlobalVariableValue, ContestStatus, UnifiedStory } from '../../shared/types';
import * as api from '../../services/api';

// Тип данных, возвращаемых хуком
export interface InitialDataState {
    projects: Project[];
    allPosts: AllPosts;
    allScheduledPosts: Record<string, ScheduledPost[]>;
    allSuggestedPosts: Record<string, SuggestedPost[]>;
    allSystemPosts: Record<string, SystemPost[]>;
    allStories: Record<string, UnifiedStory[]>;
    allNotes: Record<string, Note[]>;
    scheduledPostCounts: Record<string, number>;
    suggestedPostCounts: Record<string, number>;
    allGlobalVarDefs: GlobalVariableDefinition[];
    allGlobalVarValues: Record<string, ProjectGlobalVariableValue[]>;
    reviewsContestStatuses: Record<string, ContestStatus>;
    storiesAutomationStatuses: Record<string, boolean>;
}

const initialState: InitialDataState = {
    projects: [],
    allPosts: {},
    allScheduledPosts: {},
    allSuggestedPosts: {},
    allSystemPosts: {},
    allStories: {},
    allNotes: {},
    scheduledPostCounts: {},
    suggestedPostCounts: {},
    allGlobalVarDefs: [],
    allGlobalVarValues: {},
    reviewsContestStatuses: {},
    storiesAutomationStatuses: {},
};

/**
 * Хук для гибридной загрузки данных (v2 — параллельная):
 * - Фаза 1 (быстрая): Загружает только проекты и счётчики → UI готов мгновенно
 * - Фаза 2 (фоновая): параллельные запросы — по чанкам projectIds
 * 
 * Для тяжёлых эндпоинтов (posts, stories) projectIds разбиваются на чанки по 30,
 * чтобы не превысить лимит ответа Yandex Cloud (10 МБ) и не вызвать OOM.
 * 
 * ВАЖНО: Используется защита от двойного выполнения в React Strict Mode через useRef.
 */

// Утилита: разбивает массив на чанки
function chunkArray<T>(arr: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}

// Утилита: вызывает API по чанкам и мержит результаты
// Максимум MAX_CONCURRENT параллельных запросов, чтобы не перегрузить сервер
const MAX_CONCURRENT = 5;

async function fetchInChunks<T>(
    projectIds: string[],
    apiFn: (ids: string[]) => Promise<Record<string, T[]>>,
    chunkSize: number
): Promise<Record<string, T[]>> {
    const chunks = chunkArray(projectIds, chunkSize);
    const merged: Record<string, T[]> = {};
    
    // Обрабатываем чанки группами по MAX_CONCURRENT
    for (let i = 0; i < chunks.length; i += MAX_CONCURRENT) {
        const batch = chunks.slice(i, i + MAX_CONCURRENT);
        const results = await Promise.allSettled(batch.map(chunk => apiFn(chunk)));
        
        for (const result of results) {
            if (result.status === 'fulfilled') {
                Object.assign(merged, result.value);
            }
        }
    }
    
    return merged;
}

// Размер чанка для тяжёлых эндпоинтов (posts, stories)
// Лимит ответа Yandex Cloud Serverless Containers: ~3.5 МБ
// 10 проектов ≈ 1.5 МБ, безопасный запас ×2
const HEAVY_CHUNK_SIZE = 10;

export const useDataInitialization = () => {
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
    const [initialData, setInitialData] = useState<InitialDataState>(initialState);
    
    // Защита от двойного выполнения в React Strict Mode
    const isLoadingStarted = useRef(false);

    // Функция для инкрементального обновления данных (оставлена для совместимости)
    const mergeChunkData = useCallback((chunkData: {
        allPosts: AllPosts;
        allScheduledPosts: Record<string, ScheduledPost[]>;
        allSuggestedPosts: Record<string, SuggestedPost[]>;
        allSystemPosts: Record<string, SystemPost[]>;
        allNotes: Record<string, Note[]>;
        allStories: Record<string, UnifiedStory[]>;
    }) => {
        setInitialData(prev => {
            // Вычисляем новые счётчики для загруженных проектов
            const newScheduledCounts = { ...prev.scheduledPostCounts };
            const loadedProjectIds = Object.keys(chunkData.allScheduledPosts);
            loadedProjectIds.forEach(id => {
                const scheduledCount = chunkData.allScheduledPosts[id]?.length || 0;
                const systemCount = chunkData.allSystemPosts[id]?.length || 0;
                newScheduledCounts[id] = scheduledCount + systemCount;
            });

            return {
                ...prev,
                allPosts: { ...prev.allPosts, ...chunkData.allPosts },
                allScheduledPosts: { ...prev.allScheduledPosts, ...chunkData.allScheduledPosts },
                allSuggestedPosts: { ...prev.allSuggestedPosts, ...chunkData.allSuggestedPosts },
                allSystemPosts: { ...prev.allSystemPosts, ...chunkData.allSystemPosts },
                allNotes: { ...prev.allNotes, ...chunkData.allNotes },
                allStories: { ...prev.allStories, ...chunkData.allStories },
                scheduledPostCounts: newScheduledCounts,
            };
        });
    }, []);

    // Функция для обновления глобальных переменных
    const mergeGlobalVars = useCallback((defs: GlobalVariableDefinition[], values: Record<string, ProjectGlobalVariableValue[]>) => {
        setInitialData(prev => ({
            ...prev,
            allGlobalVarDefs: defs,
            allGlobalVarValues: { ...prev.allGlobalVarValues, ...values },
        }));
    }, []);

    useEffect(() => {
        // Защита от двойного выполнения в React Strict Mode
        if (isLoadingStarted.current) {
            console.log("⏭️ Пропускаем повторную загрузку (React Strict Mode)");
            return;
        }
        isLoadingStarted.current = true;
        
        const loadData = async () => {
            setIsInitialLoading(true);
            try {
                // ═══════════════════════════════════════════════════════════════
                // ФАЗА 1: Быстрая загрузка (проекты + счётчики) → UI готов!
                // ═══════════════════════════════════════════════════════════════
                console.log("⚡ Фаза 1: Быстрая загрузка проектов и счётчиков...");
                const startPhase1 = performance.now();
                
                const { 
                    projects: initialProjects, 
                    suggestedPostCounts: initialSuggestedCounts,
                    reviewsContestStatuses: initialContestStatuses,
                    storiesAutomationStatuses: initialStoriesStatuses
                } = await api.getInitialData();

                if (initialProjects.length === 0) {
                    setInitialData({ ...initialState, projects: [], suggestedPostCounts: initialSuggestedCounts || {}, storiesAutomationStatuses: initialStoriesStatuses || {} });
                    console.log(`✓ Фаза 1 завершена за ${(performance.now() - startPhase1).toFixed(0)}ms (нет проектов)`);
                    return;
                }

                // Сразу отдаём проекты в UI - пользователь видит интерфейс!
                setInitialData({
                    ...initialState,
                    projects: initialProjects,
                    suggestedPostCounts: initialSuggestedCounts || {},
                    reviewsContestStatuses: initialContestStatuses || {},
                    storiesAutomationStatuses: initialStoriesStatuses || {},
                });
                
                console.log(`✓ Фаза 1 завершена за ${(performance.now() - startPhase1).toFixed(0)}ms (${initialProjects.length} проектов)`);
                
                // Завершаем "начальную" загрузку - UI уже интерактивен
                setIsInitialLoading(false);
                
                // Даём React время перерисовать UI перед началом фоновой загрузки
                await new Promise(resolve => setTimeout(resolve, 50));
                
                // ═══════════════════════════════════════════════════════════════
                // ФАЗА 2: Параллельная загрузка — по чанкам для тяжёлых, всё за раз для лёгких
                // Тяжёлые: posts, stories (много данных → чанки по 30 проектов)
                // Лёгкие: scheduled, suggested, system, notes, globalVars (мало данных → все 145 сразу)
                // ═══════════════════════════════════════════════════════════════
                console.log(`🔄 Фаза 2: Параллельная загрузка контента (чанки по ${HEAVY_CHUNK_SIZE})...`);
                setIsBackgroundLoading(true);
                const startPhase2 = performance.now();
                
                const projectIds = initialProjects.map(p => p.id);
                
                // Запускаем ВСЕ запросы параллельно:
                // - Тяжёлые через fetchInChunks (разбиваются на ~5 подзапросов)
                // - Лёгкие — одним запросом на все проекты
                const [
                    postsResult,
                    storiesResult,
                    scheduledResult,
                    suggestedResult,
                    systemResult,
                    notesResult,
                    globalVarsResult,
                ] = await Promise.allSettled([
                    fetchInChunks(projectIds, api.getPostsBatch, HEAVY_CHUNK_SIZE),
                    fetchInChunks(projectIds, api.getStoriesBatch, HEAVY_CHUNK_SIZE),
                    api.getScheduledPostsBatch(projectIds),
                    api.getSuggestedPostsBatch(projectIds),
                    api.getSystemPostsBatch(projectIds),
                    api.getNotesBatch(projectIds),
                    api.getGlobalVariablesForMultipleProjects(projectIds),
                ]);
                
                // Логируем результаты
                const results = [
                    { name: 'posts', result: postsResult },
                    { name: 'scheduled', result: scheduledResult },
                    { name: 'suggested', result: suggestedResult },
                    { name: 'system', result: systemResult },
                    { name: 'notes', result: notesResult },
                    { name: 'stories', result: storiesResult },
                    { name: 'globalVars', result: globalVarsResult },
                ];
                
                for (const { name, result } of results) {
                    if (result.status === 'fulfilled') {
                        console.log(`  ✅ ${name}: загружено`);
                    } else {
                        console.error(`  ❌ ${name}: ошибка`, result.reason);
                    }
                }
                
                // Собираем все успешные результаты в один объект и обновляем стейт ОДНИМ вызовом
                const allPosts = postsResult.status === 'fulfilled' ? postsResult.value : {};
                const allScheduledPosts = scheduledResult.status === 'fulfilled' ? scheduledResult.value : {};
                const allSuggestedPosts = suggestedResult.status === 'fulfilled' ? suggestedResult.value : {};
                const allSystemPosts = systemResult.status === 'fulfilled' ? systemResult.value : {};
                const allNotes = notesResult.status === 'fulfilled' ? notesResult.value : {};
                const allStories = storiesResult.status === 'fulfilled' ? storiesResult.value : {};
                
                // Вычисляем счётчики
                const newScheduledCounts: Record<string, number> = {};
                for (const pid of projectIds) {
                    const scheduledCount = allScheduledPosts[pid]?.length || 0;
                    const systemCount = allSystemPosts[pid]?.length || 0;
                    newScheduledCounts[pid] = scheduledCount + systemCount;
                }
                
                // Один setState вместо 12 — минимум re-render
                setInitialData(prev => ({
                    ...prev,
                    allPosts,
                    allScheduledPosts,
                    allSuggestedPosts,
                    allSystemPosts,
                    allNotes,
                    allStories,
                    scheduledPostCounts: newScheduledCounts,
                    ...(globalVarsResult.status === 'fulfilled' ? {
                        allGlobalVarDefs: globalVarsResult.value.definitions,
                        allGlobalVarValues: globalVarsResult.value.valuesByProject,
                    } : {}),
                }));
                
                console.log(`✓ Фаза 2 завершена за ${(performance.now() - startPhase2).toFixed(0)}ms`);
                console.log("🎉 Загрузка всех данных завершена.");

            } catch (error) {
                console.error("❌ Критическая ошибка при загрузке данных:", error);
                window.showAppToast?.("Не удалось загрузить данные. Убедитесь, что бэкенд запущен, и обновите страницу.", 'error');
                setInitialData(initialState);
            } finally {
                setIsInitialLoading(false);
                setIsBackgroundLoading(false);
            }
        };

        loadData();
    }, [mergeChunkData, mergeGlobalVars]);

    return { isInitialLoading, isBackgroundLoading, initialData };
};
