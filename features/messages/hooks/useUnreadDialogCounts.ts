import { useState, useEffect, useCallback, useRef } from 'react';
import { getUnreadDialogCountsBatch } from '../../../services/api/messages.api';
import { Project } from '../../../shared/types';
import { msgLog, msgWarn, msgGroup, msgGroupEnd, fmtProject, fmtCount, fmtCountsMap } from '../utils/messagesLogger';

interface UseUnreadDialogCountsParams {
    /** Список проектов */
    projects: Project[];
    /** Включён ли хук (true когда activeModule === 'am') */
    enabled: boolean;
}

interface UseUnreadDialogCountsResult {
    /** Словарь: projectId → количество диалогов с непрочитанными */
    unreadDialogCounts: Record<string, number>;
    /** Загружаются ли данные */
    isLoading: boolean;
    /** Обновить счётчик для конкретного проекта (из SSE/conversations) */
    updateProjectCount: (projectId: string, count: number) => void;
    /** Полная перезагрузка */
    refresh: () => void;
}

/**
 * Хук для подсчёта количества диалогов с непрочитанными сообщениями
 * по каждому проекту. Используется в сайдбаре проектов при модуле «Сообщения».
 *
 * Использует ОДИН batch-запрос для всех проектов (один HTTP → один SQL),
 * вместо N параллельных запросов — защита от N+1.
 */
export const useUnreadDialogCounts = ({
    projects,
    enabled,
}: UseUnreadDialogCountsParams): UseUnreadDialogCountsResult => {
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Защита от гонки состояний — каждый запрос получает уникальный ID
    const fetchGenRef = useRef(0);

    // --- Reconciliation timer: после SSE-обновления через 3с перезапрашиваем ВСЕ счётчики ---
    // Компенсирует потерю SSE-событий (event loop блокирован sync callback, QueueFull и т.д.)
    const reconciliationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fetchCountsRef = useRef<(p: Project[]) => Promise<void>>();
    const projectsRef = useRef(projects);

    const fetchCounts = useCallback(async (projectsList: Project[]) => {
        if (!enabled || projectsList.length === 0) {
            msgLog('UNREAD_COUNTS', `Пропуск загрузки: enabled=${enabled}, проектов=${projectsList.length}`);
            return;
        }

        // Фильтруем только активные проекты (не disabled)
        const activeProjects = projectsList.filter(p => !p.disabled);
        if (activeProjects.length === 0) {
            msgLog('UNREAD_COUNTS', `Нет активных проектов (все disabled)`);
            return;
        }

        const gen = ++fetchGenRef.current;
        msgGroup('UNREAD_COUNTS', `📨 Batch-загрузка счётчиков для ${activeProjects.length} проектов (gen=${gen})`);
        setIsLoading(true);

        try {
            const projectIds = activeProjects.map(p => p.id);
            msgLog('UNREAD_COUNTS', `Запрос getUnreadDialogCountsBatch: ${projectIds.length} проектов`);

            const response = await getUnreadDialogCountsBatch(projectIds);

            // Проверяем что это ещё актуальный запрос (не устарел из-за нового)
            if (gen !== fetchGenRef.current) {
                msgLog('UNREAD_COUNTS', `⏭️ Пропуск устаревшего ответа (gen=${gen}, текущий=${fetchGenRef.current})`);
                msgGroupEnd('UNREAD_COUNTS');
                return;
            }

            if (response.success && response.counts) {
                msgLog('UNREAD_COUNTS', `✅ Итог batch-загрузки: ${fmtCountsMap(response.counts)}`, response.counts);
                setCounts(response.counts);
            } else {
                msgWarn('UNREAD_COUNTS', `Ответ не success или нет counts`, response);
            }
        } catch (err) {
            // Проверяем актуальность и при ошибке
            if (gen !== fetchGenRef.current) {
                msgGroupEnd('UNREAD_COUNTS');
                return;
            }
            msgWarn('UNREAD_COUNTS', `Ошибка batch-загрузки`, err);
        } finally {
            if (gen === fetchGenRef.current) {
                setIsLoading(false);
            }
            msgGroupEnd('UNREAD_COUNTS');
        }
    }, [enabled]);

    // Обновляем refs (используются в reconciliation timer без пересоздания updateProjectCount)
    fetchCountsRef.current = fetchCounts;
    projectsRef.current = projects;

    // Cleanup timers при unmount
    useEffect(() => {
        return () => {
            if (reconciliationTimerRef.current) {
                clearTimeout(reconciliationTimerRef.current);
            }
            if (sseBatchTimerRef.current) {
                clearTimeout(sseBatchTimerRef.current);
            }
        };
    }, []);

    // Загрузка счётчиков — срабатывает при:
    // 1. enabled переключился в true
    // 2. Количество проектов изменилось (0 → N при асинхронной загрузке)
    // Зависимость от projects.length решает проблему тайминга:
    // первый рендер projects=[] → эффект пропускается → проекты загрузились → эффект повторяется
    useEffect(() => {
        // Безусловный лог — ВСЕГДА показывает состояние при каждом вызове useEffect
        msgLog('UNREAD_COUNTS', `⚙️ useEffect: enabled=${enabled}, projects.length=${projects.length}`);

        if (enabled && projects.length > 0) {
            msgLog('UNREAD_COUNTS', `🚀 Запуск batch-загрузки для ${projects.length} проектов`);
            fetchCounts(projects);
        }
    }, [enabled, projects.length, fetchCounts]);

    // --- Батчинг SSE-обновлений ---
    // Вместо setCounts на каждое SSE-событие (154 ре-рендеров при входе),
    // собираем обновления за 500ms и применяем разом — один ре-рендер.
    const sseBatchRef = useRef<Record<string, number>>({});
    const sseBatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const flushSseBatch = useCallback(() => {
        const batch = sseBatchRef.current;
        sseBatchRef.current = {};
        sseBatchTimerRef.current = null;

        const keys = Object.keys(batch);
        if (keys.length === 0) return;

        msgLog('UNREAD_COUNTS', `📦 SSE batch flush: ${keys.length} проектов обновлено за раз`);
        setCounts(prev => {
            let changed = false;
            const next = { ...prev };
            for (const [pid, count] of Object.entries(batch)) {
                if (next[pid] !== count) {
                    next[pid] = count;
                    changed = true;
                }
            }
            return changed ? next : prev;
        });

        // --- Reconciliation: через 3с перезапросить ВСЕ счётчики с бэкенда ---
        if (reconciliationTimerRef.current) {
            clearTimeout(reconciliationTimerRef.current);
        }
        reconciliationTimerRef.current = setTimeout(() => {
            msgLog('UNREAD_COUNTS', '🔄 Reconciliation refresh (3с после SSE — компенсация потерянных событий)');
            fetchCountsRef.current?.(projectsRef.current);
        }, 3000);
    }, []);

    // Обновить счётчик для конкретного проекта (для синхронизации с SSE/conversations)
    const updateProjectCount = useCallback((projectId: string, count: number) => {
        msgLog('UNREAD_COUNTS', `📌 updateProjectCount: ${fmtProject(projectId)} → ${fmtCount(count)}`);
        sseBatchRef.current[projectId] = count;

        if (!sseBatchTimerRef.current) {
            sseBatchTimerRef.current = setTimeout(flushSseBatch, 500);
        }
    }, [flushSseBatch]);

    // --- Периодический refresh (safety net для пропущенных SSE событий) ---
    // Каждые 60 секунд перезапрашиваем реальные счётчики с бэкенда,
    // чтобы компенсировать возможную потерю SSE-событий (QueueFull, обрывы соединения)
    useEffect(() => {
        if (!enabled || projects.length === 0) return;

        const INTERVAL_MS = 60_000; // 60 секунд
        const intervalId = setInterval(() => {
            msgLog('UNREAD_COUNTS', `🔄 Периодический refresh счётчиков (safety net, каждые ${INTERVAL_MS / 1000}с)`);
            fetchCounts(projects);
        }, INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [enabled, projects, fetchCounts]);

    // refresh: вызывается вручную — перезагружает с актуальными проектами
    const refresh = useCallback(() => {
        fetchCounts(projects);
    }, [fetchCounts, projects]);

    return {
        unreadDialogCounts: counts,
        isLoading,
        updateProjectCount,
        refresh,
    };
};
