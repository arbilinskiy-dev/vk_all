/**
 * Хук вкладки «Сотрудники» — объединение по имени, загрузка диалогов, группировка по проектам.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Project } from '../../../../shared/types';
import {
    fetchAdminDialogs,
    AdminStatsItem,
    AdminDialogItem,
} from '../../../../services/api/messages_stats.api';

/** Тип объединённого сотрудника */
export type MergedAdmin = {
    sender_name: string;
    sender_ids: string[];
    messages_sent: number;
    unique_dialogs: number;
    projects_count: number;
};

interface UseEmployeesLogicParams {
    dateFrom: string;
    dateTo: string;
    adminStats: AdminStatsItem[];
    projectSearch: string;
    projectsMap: Map<string, Project>;
}

export function useEmployeesLogic({
    dateFrom,
    dateTo,
    adminStats,
    projectSearch,
    projectsMap,
}: UseEmployeesLogicParams) {
    // Диалоги сотрудников (ленивая загрузка — только при переключении на вкладку)
    // Выбранный сотрудник по имени (т.к. один человек может иметь несколько sender_id)
    const [selectedEmployeeName, setSelectedEmployeeName] = useState<string | null>(null);
    const [employeeDialogs, setEmployeeDialogs] = useState<AdminDialogItem[]>([]);
    const [employeeLoading, setEmployeeLoading] = useState(false);

    // === Объединение сотрудников по имени (один человек может иметь несколько sender_id) ===
    const mergedAdminStats: MergedAdmin[] = useMemo(() => {
        const map = new Map<string, MergedAdmin>();
        for (const a of adminStats) {
            const name = (a.sender_name || '').trim() || `ID ${a.sender_id}`;
            const existing = map.get(name);
            if (existing) {
                existing.sender_ids.push(a.sender_id);
                existing.messages_sent += a.messages_sent;
                existing.unique_dialogs += a.unique_dialogs;
                // projects_count пересчитаем по уникальным проектам при загрузке диалогов
                // пока берём максимум
                existing.projects_count = Math.max(existing.projects_count, a.projects_count);
            } else {
                map.set(name, {
                    sender_name: name,
                    sender_ids: [a.sender_id],
                    messages_sent: a.messages_sent,
                    unique_dialogs: a.unique_dialogs,
                    projects_count: a.projects_count,
                });
            }
        }
        return Array.from(map.values()).sort((a, b) => b.messages_sent - a.messages_sent);
    }, [adminStats]);

    // === Диалоги сотрудников: загрузка при выборе сотрудника (по имени) ===
    const loadEmployeeDialogsByName = useCallback(async (employeeName: string) => {
        setSelectedEmployeeName(employeeName);
        setEmployeeLoading(true);
        setEmployeeDialogs([]);
        try {
            // Находим все sender_id для данного имени
            const merged = mergedAdminStats.find(m => m.sender_name === employeeName);
            const senderIds = merged?.sender_ids || [];
            if (senderIds.length === 0) {
                setEmployeeDialogs([]);
                return;
            }
            // Загружаем диалоги для каждого sender_id параллельно
            const results = await Promise.all(
                senderIds.map(sid =>
                    fetchAdminDialogs(sid, {
                        dateFrom: dateFrom || undefined,
                        dateTo: dateTo || undefined,
                    }).catch(() => ({ dialogs: [] as AdminDialogItem[], sender_id: sid, sender_name: employeeName }))
                )
            );
            // Объединяем все диалоги (дедупликация по project_id + vk_user_id)
            const allDialogs: AdminDialogItem[] = [];
            const seen = new Set<string>();
            for (const res of results) {
                for (const d of (res.dialogs || [])) {
                    const key = `${d.project_id}_${d.vk_user_id}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        allDialogs.push(d);
                    } else {
                        // Если дубликат — суммируем сообщения
                        const existing = allDialogs.find(x => x.project_id === d.project_id && x.vk_user_id === d.vk_user_id);
                        if (existing) existing.messages_sent += d.messages_sent;
                    }
                }
            }
            setEmployeeDialogs(allDialogs);
        } catch (e: any) {
            console.error('Ошибка загрузки диалогов сотрудника:', e);
            setEmployeeDialogs([]);
        } finally {
            setEmployeeLoading(false);
        }
    }, [dateFrom, dateTo, mergedAdminStats]);

    /** Выбрать сотрудника по имени (или сбросить если тот же) */
    const selectEmployee = useCallback((name: string | null) => {
        if (name === null || name === selectedEmployeeName) {
            setSelectedEmployeeName(null);
            setEmployeeDialogs([]);
            return;
        }
        loadEmployeeDialogsByName(name);
    }, [selectedEmployeeName, loadEmployeeDialogsByName]);

    // При смене периода перезагружаем данные сотрудника
    useEffect(() => {
        if (selectedEmployeeName !== null) {
            loadEmployeeDialogsByName(selectedEmployeeName);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateFrom, dateTo]);

    // Группировка диалогов сотрудника по проектам
    const employeeProjectsGrouped = useMemo(() => {
        if (!employeeDialogs.length) return [];
        const map = new Map<string, { project_id: string; messages_sent: number; dialogs: AdminDialogItem[] }>();
        for (const d of employeeDialogs) {
            const existing = map.get(d.project_id);
            if (existing) {
                existing.messages_sent += d.messages_sent;
                existing.dialogs.push(d);
            } else {
                map.set(d.project_id, {
                    project_id: d.project_id,
                    messages_sent: d.messages_sent,
                    dialogs: [d],
                });
            }
        }
        // Фильтрация по поиску
        let result = Array.from(map.values());
        if (projectSearch.trim()) {
            const q = projectSearch.toLowerCase().trim();
            result = result.filter(p => {
                const proj = projectsMap.get(p.project_id);
                const name = proj?.name?.toLowerCase() || '';
                const id = p.project_id.toLowerCase();
                return name.includes(q) || id.includes(q);
            });
        }
        // Сортировка по количеству сообщений (убывание)
        result.sort((a, b) => b.messages_sent - a.messages_sent);
        return result;
    }, [employeeDialogs, projectSearch, projectsMap]);

    // Сводная статистика выбранного сотрудника (из mergedAdminStats)
    const employeeSummary = useMemo(() => {
        if (selectedEmployeeName === null) return null;
        return mergedAdminStats.find(m => m.sender_name === selectedEmployeeName) || null;
    }, [selectedEmployeeName, mergedAdminStats]);

    return {
        state: {
            selectedEmployeeName,
            mergedAdminStats,
            employeeDialogs,
            employeeLoading,
            employeeProjectsGrouped,
            employeeSummary,
        },
        actions: {
            selectEmployee,
        },
    };
}
