/**
 * Хук фильтров, вычисляемых данных и переключения вкладок/направлений.
 * Управляет: фильтры периодов, направление, суб-фильтры, computed-данные для графиков и таблиц.
 */

import { useState, useCallback, useMemo } from 'react';
import { Project } from '../../../../shared/types';
import {
    MessageStatsGlobalSummary,
    MessageStatsProjectSummary,
    MessageStatsChartPoint,
    MessageStatsUserItem,
} from '../../../../services/api/messages_stats.api';
import { PeriodType, DirectionFilter, StatsTab, IncomingSubFilter, computeDateRange } from './messageStatsConstants';

interface UseStatsFiltersParams {
    projects: Project[];
    projectsStats: MessageStatsProjectSummary[];
    chartData: MessageStatsChartPoint[];
    summary: MessageStatsGlobalSummary | null;
}

export function useStatsFilters({ projects, projectsStats, chartData, summary }: UseStatsFiltersParams) {
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

    // Фильтр графика по проекту
    const handleProjectFilter = useCallback((projectId: string) => {
        if (selectedProjectId === projectId) {
            setSelectedProjectId(null);
        } else {
            setSelectedProjectId(projectId);
        }
    }, [selectedProjectId]);

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

    return {
        state: {
            periodType,
            customStartDate,
            customEndDate,
            selectedProjectId,
            projectSearch,
            directionFilter,
            activeTab,
            incomingSubFilter,
            projectsMap,
            dateFrom,
            dateTo,
            filteredProjectsStats,
            displaySummary,
            filteredChartData,
            displayProjectsStats,
        },
        actions: {
            setPeriodType,
            setCustomStartDate,
            setCustomEndDate,
            setSelectedProjectId,
            setProjectSearch,
            handleProjectFilter,
            toggleIncomingSubFilter,
            setIncomingSubFilter,
            setActiveTab: handleSetActiveTab,
            filterUsersByDirection,
            toggleDirectionFilter,
        },
    };
}
