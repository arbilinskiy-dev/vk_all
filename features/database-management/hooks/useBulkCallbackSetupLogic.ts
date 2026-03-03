import { useState, useMemo, useCallback, useRef } from 'react';
import { Project } from '../../../shared/types';
import { setupCallbackAuto, CallbackSetupResponse, detectTunnel } from '../../../services/api/vk.api';
import { ALL_EVENT_KEYS, CallbackEventCategory } from '../../../shared/utils/callbackEvents';
import { ProjectSetupResult, TunnelMode, TunnelStatus, BulkSetupStats } from '../components/modals/types';

// ─── Константы ────────────────────────────────────────────────────

/** Задержка между запросами (мс) для избежания rate limit VK API */
const DELAY_BETWEEN_REQUESTS_MS = 400;

// ─── Утилита задержки ──────────────────────────────────────────────
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Параметры хука ───────────────────────────────────────────────

interface UseBulkCallbackSetupLogicParams {
    projects: Project[];
    onClose: () => void;
    onComplete: () => void;
}

// ─── Хук ──────────────────────────────────────────────────────────

export function useBulkCallbackSetupLogic({ projects, onClose, onComplete }: UseBulkCallbackSetupLogicParams) {
    // ─── Состояние выполнения ──────────────────────────────────────
    const [isRunning, setIsRunning] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentProjectName, setCurrentProjectName] = useState('');
    const [results, setResults] = useState<ProjectSetupResult[]>([]);
    const abortRef = useRef(false);

    // ─── Режим локального туннеля: ngrok или SSH tunnel ───────────
    const [tunnelMode, setTunnelMode] = useState<TunnelMode>(() => {
        try {
            return (window.localStorage.getItem('callback_tunnel_mode') as TunnelMode) || 'ssh-tunnel';
        } catch {
            return 'ssh-tunnel';
        }
    });
    const [tunnelStatus, setTunnelStatus] = useState<TunnelStatus>({ checked: false, active: false });
    const [isCheckingTunnel, setIsCheckingTunnel] = useState(false);

    const handleTunnelModeChange = useCallback((mode: TunnelMode) => {
        setTunnelMode(mode);
        setTunnelStatus({ checked: false, active: false });
        try { window.localStorage.setItem('callback_tunnel_mode', mode); } catch { /* игнорируем */ }
    }, []);

    const checkTunnelStatus = useCallback(async () => {
        setIsCheckingTunnel(true);
        try {
            const result = await detectTunnel();
            setTunnelStatus({ checked: true, active: result.detected, message: result.message });
        } catch {
            setTunnelStatus({ checked: true, active: false, message: 'Ошибка проверки tunnel' });
        } finally {
            setIsCheckingTunnel(false);
        }
    }, []);

    // ─── Выбор событий для подписки ───────────────────────────────
    const [selectedEvents, setSelectedEvents] = useState<Set<string>>(() => new Set(ALL_EVENT_KEYS));
    const [showEventSelector, setShowEventSelector] = useState(false);

    // allSelected: проверяем что ВСЕ ключи из ALL_EVENT_KEYS выбраны
    // (после загрузки из VK в selectedEvents могут быть лишние ключи — фильтруем)
    const allSelected = useMemo(() => {
        if (selectedEvents.size < ALL_EVENT_KEYS.length) return false;
        return ALL_EVENT_KEYS.every(key => selectedEvents.has(key));
    }, [selectedEvents]);

    const toggleEvent = useCallback((key: string) => {
        setSelectedEvents(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    }, []);

    const toggleCategory = useCallback((category: CallbackEventCategory) => {
        setSelectedEvents(prev => {
            const next = new Set(prev);
            const allInCategory = category.events.every(e => prev.has(e.key));
            category.events.forEach(e => allInCategory ? next.delete(e.key) : next.add(e.key));
            return next;
        });
    }, []);

    const selectAll = useCallback(() => setSelectedEvents(new Set(ALL_EVENT_KEYS)), []);
    const deselectAll = useCallback(() => setSelectedEvents(new Set()), []);

    const toggleShowEventSelector = useCallback(() => setShowEventSelector(prev => !prev), []);

    // ─── Определяем окружение ──────────────────────────────────────
    const environment = useMemo(() => {
        try {
            return window.localStorage.getItem('api_environment') || 'local';
        } catch {
            return 'local';
        }
    }, []);
    const isLocal = environment === 'local';

    // ─── Проекты с заполненным токеном (кандидаты на настройку) ────
    const eligibleProjects = useMemo(() => {
        return projects.filter(p =>
            p.communityToken &&
            p.communityToken.trim() !== '' &&
            p.vkProjectId &&
            !p.archived
        );
    }, [projects]);

    // ─── Статистика результатов ────────────────────────────────────
    const stats = useMemo<BulkSetupStats>(() => {
        const success = results.filter(r => r.success).length;
        const errors = results.filter(r => !r.success).length;
        const created = results.filter(r => r.action === 'created').length;
        const updated = results.filter(r => r.action === 'updated').length;
        const eventsUpdated = results.filter(r => r.action === 'events_updated').length;
        return { success, errors, created, updated, eventsUpdated };
    }, [results]);

    // Только ошибки для отображения
    const errorResults = useMemo(() => results.filter(r => !r.success), [results]);

    // ─── Основная логика массовой настройки ────────────────────────
    const handleStart = useCallback(async () => {
        if (eligibleProjects.length === 0) return;

        setIsRunning(true);
        setIsFinished(false);
        setResults([]);
        setCurrentIndex(0);
        abortRef.current = false;

        const allResults: ProjectSetupResult[] = [];

        for (let i = 0; i < eligibleProjects.length; i++) {
            // Проверяем, не отменил ли пользователь
            if (abortRef.current) break;

            const project = eligibleProjects[i];
            setCurrentIndex(i + 1);
            setCurrentProjectName(project.name);

            try {
                const useTunnel = isLocal && tunnelMode === 'ssh-tunnel';
                const response: CallbackSetupResponse = await setupCallbackAuto({
                    project_id: project.id,
                    is_local: isLocal,
                    use_tunnel: useTunnel,
                    events: Array.from(selectedEvents),
                });

                allResults.push({
                    projectId: project.id,
                    projectName: project.name,
                    vkProjectId: project.vkProjectId,
                    success: response.success,
                    action: response.action,
                    message: response.message,
                    errorCode: response.error_code,
                    serverName: response.server_name,
                    callbackUrl: response.callback_url,
                });
            } catch (err: any) {
                allResults.push({
                    projectId: project.id,
                    projectName: project.name,
                    vkProjectId: project.vkProjectId,
                    success: false,
                    message: err.message || 'Неизвестная ошибка',
                });
            }

            // Обновляем результаты в стейте после каждого проекта
            setResults([...allResults]);

            // Задержка между запросами (кроме последнего)
            if (i < eligibleProjects.length - 1 && !abortRef.current) {
                await delay(DELAY_BETWEEN_REQUESTS_MS);
            }
        }

        setIsRunning(false);
        setIsFinished(true);
        onComplete();
    }, [eligibleProjects, isLocal, tunnelMode, allSelected, selectedEvents, onComplete]);

    // ─── Повтор для одного проекта с ошибкой ───────────────────────
    const [retryingProjectId, setRetryingProjectId] = useState<string | null>(null);

    const retryProject = useCallback(async (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        setRetryingProjectId(projectId);

        try {
            const useTunnel = isLocal && tunnelMode === 'ssh-tunnel';
            const response: CallbackSetupResponse = await setupCallbackAuto({
                project_id: project.id,
                is_local: isLocal,
                use_tunnel: useTunnel,
                events: Array.from(selectedEvents),
            });

            // Обновляем результат в массиве
            setResults(prev => prev.map(r =>
                r.projectId === projectId
                    ? {
                        projectId: project.id,
                        projectName: project.name,
                        success: response.success,
                        action: response.action,
                        message: response.message,
                        errorCode: response.error_code,
                        serverName: response.server_name,
                        callbackUrl: response.callback_url,
                    }
                    : r
            ));
        } catch (err: any) {
            setResults(prev => prev.map(r =>
                r.projectId === projectId
                    ? { ...r, success: false, message: err.message || 'Неизвестная ошибка' }
                    : r
            ));
        } finally {
            setRetryingProjectId(null);
        }
    }, [projects, isLocal, tunnelMode, allSelected, selectedEvents]);

    // ─── Отмена ────────────────────────────────────────────────────
    const handleAbort = useCallback(() => {
        abortRef.current = true;
    }, []);

    // ─── Сброс и закрытие ──────────────────────────────────────────
    const handleClose = useCallback(() => {
        if (isRunning) {
            abortRef.current = true;
        }
        // Сбрасываем состояние
        setIsRunning(false);
        setIsFinished(false);
        setResults([]);
        setCurrentIndex(0);
        setCurrentProjectName('');
        onClose();
    }, [isRunning, onClose]);

    // ─── Вычисляемые значения для UI ──────────────────────────────

    // Текст окружения для UI
    const envLabel = isLocal
        ? tunnelMode === 'ssh-tunnel' ? '🔗 Локалка (SSH Tunnel)' : '🖥 Локалка (ngrok)'
        : '🌐 Сервер (api.dosmmit.ru)';
    const envColor = isLocal
        ? tunnelMode === 'ssh-tunnel' ? 'text-purple-600 bg-purple-50' : 'text-blue-600 bg-blue-50'
        : 'text-green-600 bg-green-50';

    // Процент прогресса
    const progressPercent = eligibleProjects.length > 0
        ? Math.round((currentIndex / eligibleProjects.length) * 100)
        : 0;

    // Была ли прервана настройка
    const wasAborted = abortRef.current;

    // Примерное время выполнения
    const estimatedTimeSec = Math.ceil(eligibleProjects.length * (DELAY_BETWEEN_REQUESTS_MS + 800) / 1000);

    // Количество активных (не архивных) проектов
    const activeProjectsCount = projects.filter(p => !p.archived).length;

    return {
        state: {
            isRunning,
            isFinished,
            currentIndex,
            currentProjectName,
            results,
            tunnelMode,
            tunnelStatus,
            isCheckingTunnel,
            selectedEvents,
            showEventSelector,
            allSelected,
            isLocal,
            eligibleProjects,
            stats,
            errorResults,
            retryingProjectId,
            envLabel,
            envColor,
            progressPercent,
            wasAborted,
            estimatedTimeSec,
            activeProjectsCount,
            delayBetweenRequests: DELAY_BETWEEN_REQUESTS_MS,
        },
        actions: {
            handleTunnelModeChange,
            checkTunnelStatus,
            toggleEvent,
            toggleCategory,
            selectAll,
            deselectAll,
            toggleShowEventSelector,
            handleStart,
            retryProject,
            handleAbort,
            handleClose,
        },
    };
}
