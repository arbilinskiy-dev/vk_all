/**
 * Хук бизнес-логики страницы статистики сообщений.
 * Управляет состоянием, загрузкой данных, фильтрами, раскрытием проектов.
 * Возвращает { state, actions }.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Project } from '../../../../shared/types';
import {
    fetchMessageStatsSummary,
    fetchMessageStatsProjects,
    fetchMessageStatsChart,
    fetchMessageStatsUsers,
    fetchAdminStats,
    fetchAdminDialogs,
    syncMessageStatsFromLogs,
    getSyncFromLogsStatus,
    reconcileMessageStats,
    MessageStatsGlobalSummary,
    MessageStatsProjectSummary,
    MessageStatsChartPoint,
    MessageStatsUserItem,
    AdminStatsItem,
    AdminDialogItem,
    ReconcileEvent,
    SyncFromLogsProgress,
} from '../../../../services/api/messages_stats.api';
import {
    fetchSubscriptionsSummary,
    fetchSubscriptionsChart,
    fetchSubscriptionsProjects,
    fetchSubscriptionsProjectUsers,
    SubscriptionsSummary,
    SubscriptionsChartPoint,
    SubscriptionsProjectItem,
    SubscriptionUserItem,
} from '../../../../services/api/message_subscriptions.api';
import { PeriodType, DirectionFilter, StatsTab, IncomingSubFilter, computeDateRange } from './messageStatsConstants';

export function useMessageStatsLogic(projects: Project[]) {
    // --- Состояние ---
    const [summary, setSummary] = useState<MessageStatsGlobalSummary | null>(null);
    const [projectsStats, setProjectsStats] = useState<MessageStatsProjectSummary[]>([]);
    const [chartData, setChartData] = useState<MessageStatsChartPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Фильтры
    const [periodType, setPeriodType] = useState<PeriodType>('today');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [projectSearch, setProjectSearch] = useState('');
    const [directionFilter, setDirectionFilter] = useState<DirectionFilter>('all');

    // Активная вкладка: входящие / исходящие
    const [activeTab, setActiveTabRaw] = useState<StatsTab>('incoming');

    // Суб-фильтр входящих: все / реальные / кнопочные
    const [incomingSubFilter, setIncomingSubFilter] = useState<IncomingSubFilter>('all');

    // Раскрытые проекты (Set project_id → раскрыт список пользователей)
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [usersDataMap, setUsersDataMap] = useState<Record<string, { users: MessageStatsUserItem[]; total: number; loading: boolean }>>({});

    // Синхронизация из логов (фоновая задача с прогрессом)
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<string | null>(null);
    const [syncProgress, setSyncProgress] = useState<SyncFromLogsProgress | null>(null);

    // Сверка с VK API
    const [isReconciling, setIsReconciling] = useState(false);
    const [reconcileResult, setReconcileResult] = useState<string | null>(null);
    const [reconcileProgress, setReconcileProgress] = useState<{
        processed: number;
        total: number;
        percent: number;
    } | null>(null);

    // Администраторы
    const [adminStats, setAdminStats] = useState<AdminStatsItem[]>([]);
    const [expandedAdmins, setExpandedAdmins] = useState<Set<number>>(new Set());
    const [adminDialogsMap, setAdminDialogsMap] = useState<Record<number, { dialogs: AdminDialogItem[]; loading: boolean }>>({});

    // Подписки/отписки (ленивая загрузка — только при переключении на вкладку)
    const [subsSummary, setSubsSummary] = useState<SubscriptionsSummary | null>(null);
    const [subsChart, setSubsChart] = useState<SubscriptionsChartPoint[]>([]);
    const [subsProjects, setSubsProjects] = useState<SubscriptionsProjectItem[]>([]);
    const [subsLoading, setSubsLoading] = useState(false);
    const [subsLoaded, setSubsLoaded] = useState(false);
    const [subsExpandedProjects, setSubsExpandedProjects] = useState<Set<string>>(new Set());
    const [subsUsersMap, setSubsUsersMap] = useState<Record<string, { users: SubscriptionUserItem[]; total: number; loading: boolean }>>({}); 

    // Маппинг project_id → Project
    const projectsMap = useMemo(() => {
        const map = new Map<string, Project>();
        projects.forEach(p => map.set(p.id, p));
        return map;
    }, [projects]);

    // Вычисляемые даты из периода
    const { dateFrom, dateTo } = useMemo(
        () => computeDateRange(periodType, customStartDate, customEndDate),
        [periodType, customStartDate, customEndDate]
    );

    // --- Загрузка данных ---
    const loadDashboard = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [summaryRes, projectsRes, chartRes, adminsRes] = await Promise.all([
                fetchMessageStatsSummary({
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                }),
                fetchMessageStatsProjects({
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                }),
                fetchMessageStatsChart({
                    projectId: selectedProjectId || undefined,
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                }),
                fetchAdminStats({
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                }),
            ]);
            setSummary(summaryRes);
            setProjectsStats(projectsRes.projects);
            setChartData(chartRes.chart);
            setAdminStats(adminsRes.admins || []);
        } catch (e: any) {
            setError(e.message || 'Ошибка загрузки статистики');
        } finally {
            setIsLoading(false);
        }
    }, [selectedProjectId, dateFrom, dateTo]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    // При смене периода или суб-фильтра сбрасываем кэш пользователей
    useEffect(() => {
        setUsersDataMap({});
        setExpandedProjects(new Set());
    }, [dateFrom, dateTo, incomingSubFilter]);

    // --- Загрузка пользователей при раскрытии проекта ---
    const loadUsersForProject = useCallback(async (projectId: string) => {
        setUsersDataMap(prev => ({
            ...prev,
            [projectId]: { users: [], total: 0, loading: true },
        }));
        try {
            const res = await fetchMessageStatsUsers(projectId, {
                sortBy: 'last_message_at',
                sortOrder: 'desc',
                limit: 50,
                offset: 0,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                messageType: activeTab === 'incoming' && incomingSubFilter !== 'all' ? incomingSubFilter : undefined,
            });
            setUsersDataMap(prev => ({
                ...prev,
                [projectId]: { users: res.users, total: res.total_count, loading: false },
            }));
        } catch (e: any) {
            console.error('Ошибка загрузки пользователей:', e);
            setUsersDataMap(prev => ({
                ...prev,
                [projectId]: { users: [], total: 0, loading: false },
            }));
        }
    }, [dateFrom, dateTo, activeTab, incomingSubFilter]);

    // --- Обработчики ---
    const toggleProjectExpand = useCallback((projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) {
                next.delete(projectId);
            } else {
                next.add(projectId);
                // Загружаем пользователей если ещё не загружены
                if (!usersDataMap[projectId]) {
                    loadUsersForProject(projectId);
                }
            }
            return next;
        });
    }, [usersDataMap, loadUsersForProject]);

    const handleProjectFilter = useCallback((projectId: string) => {
        // Фильтр графика по проекту
        if (selectedProjectId === projectId) {
            setSelectedProjectId(null);
        } else {
            setSelectedProjectId(projectId);
        }
    }, [selectedProjectId]);

    /** Синхронизация статистики из callback-логов (фоновая задача с polling прогресса) */
    const handleSyncFromLogs = useCallback(async () => {
        setIsSyncing(true);
        setSyncResult(null);
        setSyncProgress(null);
        try {
            // 1. Запускаем фоновую задачу
            const { taskId } = await syncMessageStatsFromLogs();
            if (!taskId) throw new Error('Не удалось запустить задачу');
            
            // 2. Polling прогресса каждые 1.5 сек
            await new Promise<void>((resolve, reject) => {
                const intervalId = setInterval(async () => {
                    try {
                        const status = await getSyncFromLogsStatus(taskId);
                        setSyncProgress(status);
                        
                        if (status.status === 'done') {
                            clearInterval(intervalId);
                            setSyncResult(status.message || 'Синхронизация завершена');
                            setSyncProgress(null);
                            resolve();
                        } else if (status.status === 'error') {
                            clearInterval(intervalId);
                            setSyncResult(`Ошибка: ${status.error || 'Неизвестная ошибка'}`);
                            setSyncProgress(null);
                            resolve();
                        }
                    } catch (e) {
                        clearInterval(intervalId);
                        reject(e);
                    }
                }, 1500);
            });
            
            await loadDashboard();
        } catch (e: any) {
            setSyncResult(`Ошибка: ${e.message}`);
            setSyncProgress(null);
        } finally {
            setIsSyncing(false);
        }
    }, [loadDashboard]);

    /** Сверка статистики с VK API (reconciliation) — SSE-стриминг с прогрессом */
    const handleReconcile = useCallback(async () => {
        setIsReconciling(true);
        setReconcileResult(null);
        setReconcileProgress(null);
        try {
            const res = await reconcileMessageStats({
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                onProgress: (event: ReconcileEvent) => {
                    if (event.type === 'start') {
                        setReconcileProgress({
                            processed: 0,
                            total: event.total_dialogs,
                            percent: 0,
                        });
                    } else if (event.type === 'progress') {
                        const percent = event.total > 0 ? Math.round((event.processed / event.total) * 100) : 0;
                        setReconcileProgress({
                            processed: event.processed,
                            total: event.total,
                            percent,
                        });
                    }
                },
            });
            setReconcileResult(res.details);
            setReconcileProgress(null);
            await loadDashboard();
        } catch (e: any) {
            setReconcileResult(`Ошибка: ${e.message}`);
            setReconcileProgress(null);
        } finally {
            setIsReconciling(false);
        }
    }, [loadDashboard, dateFrom, dateTo]);

    /** Раскрытие/сворачивание диалогов администратора */
    const toggleAdminExpand = useCallback((senderId: number) => {
        setExpandedAdmins(prev => {
            const next = new Set(prev);
            if (next.has(senderId)) {
                next.delete(senderId);
            } else {
                next.add(senderId);
                // Загружаем диалоги если ещё не загружены
                if (!adminDialogsMap[senderId]) {
                    setAdminDialogsMap(p => ({
                        ...p,
                        [senderId]: { dialogs: [], loading: true },
                    }));
                    fetchAdminDialogs(senderId, {
                        dateFrom: dateFrom || undefined,
                        dateTo: dateTo || undefined,
                    }).then(res => {
                        setAdminDialogsMap(p => ({
                            ...p,
                            [senderId]: { dialogs: res.dialogs || [], loading: false },
                        }));
                    }).catch(() => {
                        setAdminDialogsMap(p => ({
                            ...p,
                            [senderId]: { dialogs: [], loading: false },
                        }));
                    });
                }
            }
            return next;
        });
    }, [adminDialogsMap, dateFrom, dateTo]);

    // Фильтрация проектов по строке поиска и направлению
    const filteredProjectsStats = useMemo(() => {
        let result = projectsStats;
        // Фильтр по направлению
        if (directionFilter === 'incoming') {
            result = result.filter(ps => ps.total_incoming > 0);
        } else if (directionFilter === 'outgoing') {
            result = result.filter(ps => ps.total_outgoing > 0);
        }
        // Фильтр по поиску
        if (projectSearch.trim()) {
            const q = projectSearch.toLowerCase().trim();
            result = result.filter(ps => {
                const proj = projectsMap.get(ps.project_id);
                const name = proj?.name?.toLowerCase() || '';
                const id = ps.project_id.toLowerCase();
                return name.includes(q) || id.includes(q);
            });
        }
        // Суб-фильтр входящих (text/payload)
        if (activeTab === 'incoming' && incomingSubFilter !== 'all') {
            if (incomingSubFilter === 'text') {
                result = result.filter(ps => (ps.incoming_text ?? 0) > 0);
            } else if (incomingSubFilter === 'payload') {
                result = result.filter(ps => (ps.incoming_payload ?? 0) > 0);
            }
        }
        return result;
    }, [projectsStats, projectSearch, projectsMap, directionFilter, activeTab, incomingSubFilter]);

    // Пересчёт сводки при фильтре по направлению
    const displaySummary = useMemo(() => {
        if (!summary) return null;
        if (directionFilter === 'all') return summary;

        // Берём проекты с нужным направлением
        const fps = directionFilter === 'incoming'
            ? projectsStats.filter(ps => ps.total_incoming > 0)
            : projectsStats.filter(ps => ps.total_outgoing > 0);

        const totalMessages = fps.reduce(
            (s, p) => s + (directionFilter === 'incoming' ? p.total_incoming : p.total_outgoing), 0
        );

        // Используем глобальные incoming_users / outgoing_users из бэкенда (считаются с DISTINCT),
        // а НЕ суммируем по проектам — иначе один пользователь в N проектах считается N раз.
        const uniqueUsers = directionFilter === 'incoming'
            ? (summary.incoming_users || 0)
            : (summary.outgoing_users || 0);

        return {
            ...summary,
            total_projects: fps.length,
            total_messages: totalMessages,
            total_incoming: fps.reduce((s, p) => s + p.total_incoming, 0),
            total_outgoing: fps.reduce((s, p) => s + p.total_outgoing, 0),
            unique_users: uniqueUsers,
        };
    }, [summary, projectsStats, directionFilter]);

    // Данные графика с учётом суб-фильтра входящих
    const filteredChartData = useMemo(() => {
        if (activeTab !== 'incoming' || incomingSubFilter === 'all') return chartData;
        return chartData.map(point => ({
            ...point,
            // Заменяем общую линию входящих на суб-категорию
            incoming: incomingSubFilter === 'text'
                ? (point.incoming_text ?? 0)
                : (point.incoming_payload ?? 0),
        }));
    }, [chartData, activeTab, incomingSubFilter]);

    // Проекты с подменёнными значениями при активном суб-фильтре
    const displayProjectsStats = useMemo(() => {
        if (activeTab !== 'incoming' || incomingSubFilter === 'all') return filteredProjectsStats;
        return filteredProjectsStats.map(ps => ({
            ...ps,
            total_incoming: incomingSubFilter === 'text'
                ? ((ps as any).filtered_incoming_text ?? ps.incoming_text ?? 0)
                : (ps.incoming_payload ?? 0),
            incoming_dialogs: incomingSubFilter === 'text'
                ? (ps.dialogs_with_text ?? 0)
                : (ps.dialogs_with_payload ?? 0),
        }));
    }, [filteredProjectsStats, activeTab, incomingSubFilter]);

    /** Переключение суб-фильтра входящих (toggle) */
    const toggleIncomingSubFilter = useCallback((filter: IncomingSubFilter) => {
        setIncomingSubFilter(prev => prev === filter ? 'all' : filter);
    }, []);

    /** Переключение вкладки со сбросом суб-фильтра */
    const handleSetActiveTab = useCallback((tab: StatsTab) => {
        setActiveTabRaw(tab);
        setIncomingSubFilter('all');
    }, []);

    /** Фильтрация пользователей по направлению */
    const filterUsersByDirection = useCallback((users: MessageStatsUserItem[]) => {
        if (directionFilter === 'incoming') return users.filter(u => u.incoming_count > 0);
        if (directionFilter === 'outgoing') return users.filter(u => u.outgoing_count > 0);
        return users;
    }, [directionFilter]);

    /** Переключение фильтра направления */
    const toggleDirectionFilter = useCallback((dir: DirectionFilter) => {
        setDirectionFilter(prev => prev === dir ? 'all' : dir);
    }, []);

    // === Подписки: ленивая загрузка при переходе на вкладку ===
    const loadSubscriptions = useCallback(async () => {
        setSubsLoading(true);
        try {
            const [summaryRes, chartRes, projectsRes] = await Promise.all([
                fetchSubscriptionsSummary({
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                }),
                fetchSubscriptionsChart({
                    projectId: selectedProjectId || undefined,
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                }),
                fetchSubscriptionsProjects({
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                }),
            ]);
            setSubsSummary(summaryRes);
            setSubsChart(chartRes.chart);
            setSubsProjects(projectsRes.projects);
            setSubsLoaded(true);
        } catch (e: any) {
            console.error('Ошибка загрузки подписок:', e);
        } finally {
            setSubsLoading(false);
        }
    }, [dateFrom, dateTo, selectedProjectId]);

    // При переключении на вкладку подписок — загружаем данные
    useEffect(() => {
        if (activeTab === 'subscriptions') {
            loadSubscriptions();
        }
    }, [activeTab, loadSubscriptions]);

    // Сброс флага subsLoaded при смене периода (чтобы перезагрузить при возврате на вкладку)
    useEffect(() => {
        setSubsLoaded(false);
    }, [dateFrom, dateTo, selectedProjectId]);

    /** Раскрытие проекта в таблице подписок (ленивая загрузка пользователей) */
    const toggleSubsProjectExpand = useCallback((projectId: string) => {
        setSubsExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) {
                next.delete(projectId);
            } else {
                next.add(projectId);
                // Ленивая загрузка пользователей по подпискам
                if (!subsUsersMap[projectId]) {
                    setSubsUsersMap(p => ({
                        ...p,
                        [projectId]: { users: [], total: 0, loading: true },
                    }));
                    fetchSubscriptionsProjectUsers(projectId, {
                        dateFrom: dateFrom || undefined,
                        dateTo: dateTo || undefined,
                        limit: 50,
                        offset: 0,
                    }).then(res => {
                        setSubsUsersMap(p => ({
                            ...p,
                            [projectId]: { users: res.users, total: res.total_count, loading: false },
                        }));
                    }).catch(() => {
                        setSubsUsersMap(p => ({
                            ...p,
                            [projectId]: { users: [], total: 0, loading: false },
                        }));
                    });
                }
            }
            return next;
        });
    }, [subsUsersMap, dateFrom, dateTo]);

    // Фильтрация проектов подписок по строке поиска
    const filteredSubsProjects = useMemo(() => {
        if (!projectSearch.trim()) return subsProjects;
        const q = projectSearch.toLowerCase().trim();
        return subsProjects.filter(sp => {
            const proj = projectsMap.get(sp.project_id);
            const name = proj?.name?.toLowerCase() || '';
            const id = sp.project_id.toLowerCase();
            return name.includes(q) || id.includes(q);
        });
    }, [subsProjects, projectSearch, projectsMap]);

    return {
        state: {
            summary,
            chartData,
            isLoading,
            error,
            periodType,
            customStartDate,
            customEndDate,
            selectedProjectId,
            projectSearch,
            directionFilter,
            expandedProjects,
            usersDataMap,
            isSyncing,
            syncResult,
            syncProgress,
            isReconciling,
            reconcileResult,
            reconcileProgress,
            projectsMap,
            filteredProjectsStats,
            displayProjectsStats,
            filteredChartData,
            incomingSubFilter,
            displaySummary,
            adminStats,
            expandedAdmins,
            adminDialogsMap,
            activeTab,
            // Подписки
            subsSummary,
            subsChart,
            subsLoading,
            subsLoaded,
            filteredSubsProjects,
            subsExpandedProjects,
            subsUsersMap,
        },
        actions: {
            loadDashboard,
            setPeriodType,
            setCustomStartDate,
            setCustomEndDate,
            setSelectedProjectId,
            setProjectSearch,
            toggleProjectExpand,
            handleProjectFilter,
            handleSyncFromLogs,
            setSyncResult,
            handleReconcile,
            setReconcileResult,
            toggleDirectionFilter,
            filterUsersByDirection,
            toggleAdminExpand,
            setActiveTab: handleSetActiveTab,
            toggleIncomingSubFilter,
            setIncomingSubFilter,
            // Подписки
            loadSubscriptions,
            toggleSubsProjectExpand,
        },
    };
}
