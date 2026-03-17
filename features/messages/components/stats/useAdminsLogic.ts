/**
 * Хук логики администраторов — раскрытие/сворачивание, ленивая загрузка диалогов.
 */

import { useState, useCallback } from 'react';
import {
    fetchAdminDialogs,
    AdminDialogItem,
} from '../../../../services/api/messages_stats.api';

interface UseAdminsLogicParams {
    dateFrom: string;
    dateTo: string;
}

export function useAdminsLogic({ dateFrom, dateTo }: UseAdminsLogicParams) {
    // Администраторы
    const [expandedAdmins, setExpandedAdmins] = useState<Set<string>>(new Set());
    const [adminDialogsMap, setAdminDialogsMap] = useState<Record<string, { dialogs: AdminDialogItem[]; loading: boolean }>>({});

    /** Раскрытие/сворачивание диалогов администратора */
    const toggleAdminExpand = useCallback((senderId: string) => {
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

    return {
        state: {
            expandedAdmins,
            adminDialogsMap,
        },
        actions: {
            toggleAdminExpand,
        },
    };
}
