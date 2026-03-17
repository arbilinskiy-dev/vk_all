/**
 * Хук загрузки пользователей при раскрытии проекта в таблице сообщений.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    fetchMessageStatsUsers,
    MessageStatsUserItem,
} from '../../../../services/api/messages_stats.api';
import { StatsTab, IncomingSubFilter } from './messageStatsConstants';

interface UseProjectUsersLogicParams {
    dateFrom: string;
    dateTo: string;
    activeTab: StatsTab;
    incomingSubFilter: IncomingSubFilter;
}

export function useProjectUsersLogic({ dateFrom, dateTo, activeTab, incomingSubFilter }: UseProjectUsersLogicParams) {
    // Раскрытые проекты (Set project_id → раскрыт список пользователей)
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [usersDataMap, setUsersDataMap] = useState<Record<string, { users: MessageStatsUserItem[]; total: number; loading: boolean }>>({});

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

    return {
        state: {
            expandedProjects,
            usersDataMap,
        },
        actions: {
            toggleProjectExpand,
        },
    };
}
