/**
 * useDialogLabels — хук для работы с метками (ярлыками) диалогов.
 * CRUD меток проекта + назначение/снятие с диалогов.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    DialogLabel,
    getDialogLabels,
    createDialogLabel,
    updateDialogLabel,
    deleteDialogLabel,
    assignDialogLabel,
    unassignDialogLabel,
    setDialogLabels as apiSetDialogLabels,
} from '../../../services/api/dialog_labels.api';

interface UseDialogLabelsParams {
    /** ID проекта (null = не загружать) */
    projectId: string | null;
}

interface UseDialogLabelsResult {
    /** Все метки проекта */
    labels: DialogLabel[];
    /** Загружаются ли метки */
    isLoading: boolean;
    /** Создать новую метку */
    createLabel: (name: string, color?: string) => Promise<DialogLabel | null>;
    /** Обновить метку */
    editLabel: (labelId: string, data: { name?: string; color?: string }) => Promise<void>;
    /** Удалить метку */
    removeLabel: (labelId: string) => Promise<void>;
    /** Назначить метку диалогу (оптимистично) */
    assignLabel: (vkUserId: number, labelId: string) => Promise<void>;
    /** Снять метку с диалога (оптимистично) */
    unassignLabel: (vkUserId: number, labelId: string) => Promise<void>;
    /** Установить полный набор меток диалога */
    setLabels: (vkUserId: number, labelIds: string[]) => Promise<void>;
    /** Перезагрузить метки */
    refresh: () => void;
    /** Map: vk_user_id → [label_id, ...] — для быстрого доступа из компонентов */
    dialogLabelsMap: Record<number, string[]>;
    /** Обновить dialogLabelsMap из данных conversations-init */
    setDialogLabelsFromInit: (map: Record<number, string[]>) => void;
}

export const useDialogLabels = ({ projectId }: UseDialogLabelsParams): UseDialogLabelsResult => {
    const [labels, setLabels] = useState<DialogLabel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    /** Map: vk_user_id → [label_id, ...] */
    const [dialogLabelsMap, setDialogLabelsMap] = useState<Record<number, string[]>>({});

    const loadedProjectRef = useRef<string | null>(null);

    // Загрузка меток проекта
    const fetchLabels = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const res = await getDialogLabels(projectId);
            setLabels(res.labels);
            loadedProjectRef.current = projectId;
        } catch (err) {
            console.error('[DialogLabels] Ошибка загрузки меток:', err);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    // Загрузка при смене проекта
    useEffect(() => {
        if (projectId) {
            if (projectId !== loadedProjectRef.current) {
                setLabels([]);
                setDialogLabelsMap({});
            }
            fetchLabels();
        } else {
            setLabels([]);
            setDialogLabelsMap({});
            loadedProjectRef.current = null;
        }
    }, [projectId, fetchLabels]);

    // Создать метку
    const createLabel = useCallback(async (name: string, color?: string): Promise<DialogLabel | null> => {
        if (!projectId) return null;
        try {
            const res = await createDialogLabel(projectId, name, color);
            setLabels(prev => [...prev, res.label]);
            return res.label;
        } catch (err) {
            console.error('[DialogLabels] Ошибка создания:', err);
            return null;
        }
    }, [projectId]);

    // Обновить метку
    const editLabel = useCallback(async (labelId: string, data: { name?: string; color?: string }) => {
        try {
            const res = await updateDialogLabel(labelId, data);
            setLabels(prev => prev.map(l => l.id === labelId ? { ...l, ...res.label } : l));
        } catch (err) {
            console.error('[DialogLabels] Ошибка обновления:', err);
        }
    }, []);

    // Удалить метку
    const removeLabel = useCallback(async (labelId: string) => {
        try {
            await deleteDialogLabel(labelId);
            setLabels(prev => prev.filter(l => l.id !== labelId));
            // Убираем метку из всех диалогов
            setDialogLabelsMap(prev => {
                const next = { ...prev };
                for (const uid of Object.keys(next)) {
                    next[Number(uid)] = next[Number(uid)].filter(id => id !== labelId);
                    if (next[Number(uid)].length === 0) delete next[Number(uid)];
                }
                return next;
            });
        } catch (err) {
            console.error('[DialogLabels] Ошибка удаления:', err);
        }
    }, []);

    // Назначить метку (оптимистично)
    const assignLabelFn = useCallback(async (vkUserId: number, labelId: string) => {
        if (!projectId) return;
        // Оптимистичное обновление
        setDialogLabelsMap(prev => {
            const current = prev[vkUserId] || [];
            if (current.includes(labelId)) return prev;
            return { ...prev, [vkUserId]: [...current, labelId] };
        });
        // Обновляем счётчик на метке
        setLabels(prev => prev.map(l =>
            l.id === labelId ? { ...l, dialog_count: l.dialog_count + 1 } : l
        ));
        try {
            await assignDialogLabel(projectId, vkUserId, labelId);
        } catch (err) {
            // Откат
            setDialogLabelsMap(prev => {
                const current = prev[vkUserId] || [];
                return { ...prev, [vkUserId]: current.filter(id => id !== labelId) };
            });
            setLabels(prev => prev.map(l =>
                l.id === labelId ? { ...l, dialog_count: Math.max(0, l.dialog_count - 1) } : l
            ));
            console.error('[DialogLabels] Ошибка назначения:', err);
        }
    }, [projectId]);

    // Снять метку (оптимистично)
    const unassignLabelFn = useCallback(async (vkUserId: number, labelId: string) => {
        if (!projectId) return;
        // Оптимистичное обновление
        setDialogLabelsMap(prev => {
            const current = prev[vkUserId] || [];
            return { ...prev, [vkUserId]: current.filter(id => id !== labelId) };
        });
        setLabels(prev => prev.map(l =>
            l.id === labelId ? { ...l, dialog_count: Math.max(0, l.dialog_count - 1) } : l
        ));
        try {
            await unassignDialogLabel(projectId, vkUserId, labelId);
        } catch (err) {
            // Откат
            setDialogLabelsMap(prev => {
                const current = prev[vkUserId] || [];
                if (current.includes(labelId)) return prev;
                return { ...prev, [vkUserId]: [...current, labelId] };
            });
            setLabels(prev => prev.map(l =>
                l.id === labelId ? { ...l, dialog_count: l.dialog_count + 1 } : l
            ));
            console.error('[DialogLabels] Ошибка снятия:', err);
        }
    }, [projectId]);

    // Установить полный набор меток
    const setLabelsFn = useCallback(async (vkUserId: number, labelIds: string[]) => {
        if (!projectId) return;
        const prevLabelIds = dialogLabelsMap[vkUserId] || [];
        // Оптимистичное обновление
        setDialogLabelsMap(prev => ({ ...prev, [vkUserId]: labelIds }));
        try {
            await apiSetDialogLabels(projectId, vkUserId, labelIds);
            // Обновляем счётчики после успешного запроса
            fetchLabels();
        } catch (err) {
            // Откат
            setDialogLabelsMap(prev => ({ ...prev, [vkUserId]: prevLabelIds }));
            console.error('[DialogLabels] Ошибка установки:', err);
        }
    }, [projectId, dialogLabelsMap, fetchLabels]);

    // Инициализация dialogLabelsMap из данных conversations-init
    const setDialogLabelsFromInit = useCallback((map: Record<number, string[]>) => {
        setDialogLabelsMap(prev => ({ ...prev, ...map }));
    }, []);

    return {
        labels,
        isLoading,
        createLabel,
        editLabel,
        removeLabel,
        assignLabel: assignLabelFn,
        unassignLabel: unassignLabelFn,
        setLabels: setLabelsFn,
        refresh: fetchLabels,
        dialogLabelsMap,
        setDialogLabelsFromInit,
    };
};
