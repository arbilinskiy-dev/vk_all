/**
 * Хук вкладки «Подписки/отписки» — ленивая загрузка, раскрытие проектов, фильтрация.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Project } from '../../../../shared/types';
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
import { StatsTab } from './messageStatsConstants';

interface UseSubscriptionsLogicParams {
    dateFrom: string;
    dateTo: string;
    selectedProjectId: string | null;
    projectSearch: string;
    projectsMap: Map<string, Project>;
    activeTab: StatsTab;
}

export function useSubscriptionsLogic({
    dateFrom,
    dateTo,
    selectedProjectId,
    projectSearch,
    projectsMap,
    activeTab,
}: UseSubscriptionsLogicParams) {
    // Подписки/отписки (ленивая загрузка — только при переключении на вкладку)
    const [subsSummary, setSubsSummary] = useState<SubscriptionsSummary | null>(null);
    const [subsChart, setSubsChart] = useState<SubscriptionsChartPoint[]>([]);
    const [subsProjects, setSubsProjects] = useState<SubscriptionsProjectItem[]>([]);
    const [subsLoading, setSubsLoading] = useState(false);
    const [subsLoaded, setSubsLoaded] = useState(false);
    const [subsExpandedProjects, setSubsExpandedProjects] = useState<Set<string>>(new Set());
    const [subsUsersMap, setSubsUsersMap] = useState<Record<string, { users: SubscriptionUserItem[]; total: number; loading: boolean }>>({});

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
            subsSummary,
            subsChart,
            subsLoading,
            subsLoaded,
            filteredSubsProjects,
            subsExpandedProjects,
            subsUsersMap,
        },
        actions: {
            loadSubscriptions,
            toggleSubsProjectExpand,
        },
    };
}
