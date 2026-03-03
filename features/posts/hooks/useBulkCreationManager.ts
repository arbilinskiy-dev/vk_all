import { useState, useEffect, useMemo, useCallback } from 'react';
import { ScheduledPost } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

const getLocalDateParts = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    return { dateString, timeString };
};

const getInitialDateTimeForCopyMode = (post: ScheduledPost) => {
    const postDate = new Date(post.date);
    const now = new Date();
    if (!isNaN(postDate.getTime()) && postDate > now) {
        return getLocalDateParts(postDate);
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return getLocalDateParts(tomorrow);
};

/**
 * Хук, инкапсулирующий логику управления режимами массового и 
 * мультипроектного создания постов.
 */
export const useBulkCreationManager = (
    post: ScheduledPost,
    initialMode: 'view' | 'edit' | 'copy',
    projectId: string
) => {
    const isCopyMode = initialMode === 'copy';

    const { dateString: initialDate, timeString: initialTime } = isCopyMode
        ? getInitialDateTimeForCopyMode(post)
        : getLocalDateParts(new Date(post.date));

    // State for bulk & multi-project creation
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [dateSlots, setDateSlots] = useState([{ id: uuidv4(), date: initialDate, time: initialTime }]);
    const [isMultiProjectMode, setIsMultiProjectMode] = useState(false);
    const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set([projectId]));

    // Состояния для сдвига времени при мультипроектной публикации
    const [timeShiftEnabled, setTimeShiftEnabled] = useState(false);
    const [timeShiftDays, setTimeShiftDays] = useState(0);
    const [timeShiftHours, setTimeShiftHours] = useState(0);
    const [timeShiftMinutes, setTimeShiftMinutes] = useState(10);
    const [orderedProjectIds, setOrderedProjectIds] = useState<string[]>([projectId]);

    // Индивидуальные даты/время для каждого проекта в мультипроектном режиме
    const [projectDateTimes, setProjectDateTimesRaw] = useState<Record<string, { date: string; time: string }>>({
        [projectId]: { date: initialDate, time: initialTime }
    });
    // Набор проектов с ручной настройкой даты/времени (не пересчитываются автоматически)
    const [customOverrideIds, setCustomOverrideIds] = useState<Set<string>>(new Set());

    const isFutureDate = useMemo(() => {
        if (!dateSlots[0]?.date) return false;
        const postDate = new Date(dateSlots[0].date);
        postDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return postDate > today;
    }, [dateSlots]);

    useEffect(() => {
        if (!isMultiProjectMode) {
            setSelectedProjectIds(new Set([projectId]));
        }
    }, [isMultiProjectMode, projectId]);

    // Синхронизация orderedProjectIds с selectedProjectIds
    useEffect(() => {
        setOrderedProjectIds(prev => {
            // Убираем проекты, которые больше не выбраны
            const filtered = prev.filter(id => selectedProjectIds.has(id));
            // Добавляем новые проекты в конец
            const newIds = Array.from(selectedProjectIds).filter(id => !prev.includes(id));
            return [...filtered, ...newIds];
        });
    }, [selectedProjectIds]);

    // При выключении мультипроектного режима — сбрасываем сдвиг и ручные настройки
    useEffect(() => {
        if (!isMultiProjectMode) {
            setTimeShiftEnabled(false);
            setOrderedProjectIds([projectId]);
            setCustomOverrideIds(new Set());
        }
    }, [isMultiProjectMode, projectId]);

    // Синхронизация индивидуальных дат/времени проектов с базовыми параметрами
    const baseDateValue = dateSlots[0]?.date;
    const baseTimeValue = dateSlots[0]?.time;

    useEffect(() => {
        if (!isMultiProjectMode) return;
        if (!baseDateValue || !baseTimeValue) return;

        const orderedSelected = orderedProjectIds.filter(id => selectedProjectIds.has(id));

        setProjectDateTimesRaw(prev => {
            const next: Record<string, { date: string; time: string }> = {};

            orderedSelected.forEach((id, index) => {
                if (customOverrideIds.has(id) && prev[id]) {
                    // Сохраняем ручную настройку
                    next[id] = prev[id];
                } else {
                    // Рассчитываем автоматически (с учётом сдвига)
                    const base = new Date(`${baseDateValue}T${baseTimeValue}:00`);
                    if (timeShiftEnabled && index > 0) {
                        const shiftMs = (
                            timeShiftDays * 24 * 60 * 60 * 1000 +
                            timeShiftHours * 60 * 60 * 1000 +
                            timeShiftMinutes * 60 * 1000
                        ) * index;
                        base.setTime(base.getTime() + shiftMs);
                    }
                    const { dateString, timeString } = getLocalDateParts(base);
                    next[id] = { date: dateString, time: timeString };
                }
            });

            return next;
        });
    }, [isMultiProjectMode, selectedProjectIds, orderedProjectIds, baseDateValue, baseTimeValue, timeShiftEnabled, timeShiftDays, timeShiftHours, timeShiftMinutes, customOverrideIds]);

    // Установить дату/время для конкретного проекта (ручная настройка)
    const setProjectDateTime = useCallback((projId: string, field: 'date' | 'time', value: string) => {
        setProjectDateTimesRaw(prev => ({
            ...prev,
            [projId]: {
                ...(prev[projId] || { date: baseDateValue || initialDate, time: baseTimeValue || initialTime }),
                [field]: value,
            }
        }));
        setCustomOverrideIds(prev => new Set(prev).add(projId));
    }, [baseDateValue, baseTimeValue, initialDate, initialTime]);

    // Сбросить ручную настройку для проекта (вернуть к авторасчету)
    const resetProjectDateTime = useCallback((projId: string) => {
        setCustomOverrideIds(prev => {
            const next = new Set(prev);
            next.delete(projId);
            return next;
        });
    }, []);

    // Обёртка для включения/выключения сдвига времени (сбрасывает все ручные настройки)
    const handleToggleTimeShift = useCallback((enabled: boolean) => {
        setTimeShiftEnabled(enabled);
        if (enabled) {
            setCustomOverrideIds(new Set());
        }
    }, []);

    const handleAddDateSlot = () => {
        setDateSlots(prev => {
            if (prev.length >= 10) return prev;
            const lastSlot = prev[prev.length - 1];
            const nextDate = new Date(lastSlot.date);
            nextDate.setDate(nextDate.getDate() + 1);
            const { dateString } = getLocalDateParts(nextDate);
            return [...prev, { id: uuidv4(), date: dateString, time: lastSlot.time }];
        });
    };

    const handleRemoveDateSlot = (id: string) => {
        setDateSlots(prev => prev.filter(slot => slot.id !== id));
    };

    const handleDateSlotChange = (id: string, field: 'date' | 'time', value: string) => {
        setDateSlots(prev => prev.map(slot => slot.id === id ? { ...slot, [field]: value } : slot));
    };

    // Функция для изменения порядка проектов (drag-n-drop)
    const reorderProjects = (fromIndex: number, toIndex: number) => {
        setOrderedProjectIds(prev => {
            const result = [...prev];
            const [removed] = result.splice(fromIndex, 1);
            result.splice(toIndex, 0, removed);
            return result;
        });
    };

    return {
        bulkState: {
            dateSlots,
            isBulkMode,
            isMultiProjectMode,
            selectedProjectIds,
            // Сдвиг времени
            timeShiftEnabled,
            timeShiftDays,
            timeShiftHours,
            timeShiftMinutes,
            orderedProjectIds,
            // Индивидуальные даты проектов
            projectDateTimes,
            customOverrideIds,
        },
        bulkActions: {
            setIsBulkMode,
            setIsMultiProjectMode,
            setSelectedProjectIds,
            handleAddDateSlot,
            handleRemoveDateSlot,
            handleDateSlotChange,
            // Сдвиг времени
            handleToggleTimeShift,
            setTimeShiftDays,
            setTimeShiftHours,
            setTimeShiftMinutes,
            reorderProjects,
            // Индивидуальные даты проектов
            setProjectDateTime,
            resetProjectDateTime,
        },
        isFutureDate,
    };
};
