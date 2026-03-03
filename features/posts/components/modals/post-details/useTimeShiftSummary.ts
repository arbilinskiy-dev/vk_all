
import { useMemo } from 'react';
import { Project } from '../../../../../shared/types';

interface UseTimeShiftSummaryParams {
    isMultiProjectMode: boolean;
    isBulkMode: boolean;
    selectedProjectIds: Set<string>;
    orderedProjectIds: string[];
    projectDateTimes: Record<string, { date: string; time: string }>;
    dateSlots: { id: string; date: string; time: string }[];
    allProjects: Project[];
}

export interface TimeShiftSummaryItem {
    projectName: string;
    dateTime: string;
}

export function useTimeShiftSummary({
    isMultiProjectMode,
    isBulkMode,
    selectedProjectIds,
    orderedProjectIds,
    projectDateTimes,
    dateSlots,
    allProjects,
}: UseTimeShiftSummaryParams): TimeShiftSummaryItem[] | undefined {
    return useMemo(() => {
        if (!isMultiProjectMode || selectedProjectIds.size <= 1) return undefined;
        
        const activeProjects = orderedProjectIds.filter(id => selectedProjectIds.has(id));
        const datesToUse = isBulkMode ? dateSlots : [dateSlots[0]];
        
        // Базовый слот — от него считаем сдвиг для каждого проекта
        const baseSlot = dateSlots[0];
        const baseMs = baseSlot?.date && baseSlot?.time 
            ? new Date(`${baseSlot.date}T${baseSlot.time}:00`).getTime() 
            : 0;

        const formatDate = (d: Date) => {
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear();
            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');
            return `${day}.${month}.${year} ${hours}:${minutes}`;
        };

        const items: TimeShiftSummaryItem[] = [];

        for (const slot of datesToUse) {
            if (!slot?.date || !slot?.time) continue;
            const slotMs = new Date(`${slot.date}T${slot.time}:00`).getTime();

            for (const id of activeProjects) {
                const project = allProjects.find(p => p.id === id);
                const pdt = projectDateTimes[id];
                if (!pdt) continue;

                // Вычисляем сдвиг проекта относительно базового слота
                const projMs = new Date(`${pdt.date}T${pdt.time}:00`).getTime();
                const shiftMs = projMs - baseMs;
                const finalDate = new Date(slotMs + shiftMs);

                items.push({
                    projectName: project?.name || id,
                    dateTime: formatDate(finalDate),
                });
            }
        }

        return items.length > 0 ? items : undefined;
    }, [isMultiProjectMode, isBulkMode, selectedProjectIds, orderedProjectIds, projectDateTimes, dateSlots, allProjects]);
}
