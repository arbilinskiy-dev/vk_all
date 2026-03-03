import React, { useState, useRef, useCallback, useEffect } from 'react';

interface UseColumnResizeProps {
    /** Ref на элемент <table> */
    tableRef: React.RefObject<HTMLTableElement>;
    /** Количество проектов (для триггера инициализации) */
    projectsCount: number;
    /** Карта видимости колонок */
    visibleColumns: Record<string, boolean>;
}

interface UseColumnResizeState {
    columnWidths: Record<string, number>;
    isInitialized: boolean;
}

interface UseColumnResizeActions {
    handleMouseDown: (key: string, e: React.MouseEvent) => void;
}

/**
 * Хук для логики ресайза колонок таблицы.
 * Считывает начальную ширину из DOM и позволяет перетаскивать границы колонок.
 */
export function useColumnResize({ tableRef, projectsCount, visibleColumns }: UseColumnResizeProps): {
    state: UseColumnResizeState;
    actions: UseColumnResizeActions;
} {
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const [isInitialized, setIsInitialized] = useState(false);

    const activeColumnKeyRef = useRef<string | null>(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    // Инициализация ширин колонок из DOM
    useEffect(() => {
        if (tableRef.current && !isInitialized && projectsCount > 0) {
            const thElements = Array.from(tableRef.current.querySelectorAll<HTMLTableCellElement>('thead th'));
            const initialWidths: Record<string, number> = {};
            thElements.forEach((th: HTMLTableCellElement) => {
                const key = th.getAttribute('data-key');
                if (key) {
                    initialWidths[key] = th.clientWidth + 16;
                }
            });
            setColumnWidths(initialWidths);
            setIsInitialized(true);
        }
    }, [isInitialized, projectsCount, visibleColumns]);

    // Начало перетаскивания
    const handleMouseDown = useCallback((key: string, e: React.MouseEvent) => {
        activeColumnKeyRef.current = key;
        startXRef.current = e.clientX;
        startWidthRef.current = columnWidths[key];
        document.body.style.cursor = 'col-resize';
        e.preventDefault();
    }, [columnWidths]);

    // Перемещение мыши
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (activeColumnKeyRef.current === null) return;

        const deltaX = e.clientX - startXRef.current;
        const newWidth = startWidthRef.current + deltaX;

        setColumnWidths(prevWidths => ({
            ...prevWidths,
            [activeColumnKeyRef.current!]: Math.max(newWidth, 80),
        }));
    }, []);

    // Окончание перетаскивания
    const handleMouseUp = useCallback(() => {
        activeColumnKeyRef.current = null;
        document.body.style.cursor = '';
    }, []);

    // Глобальные слушатели mouse move/up
    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return {
        state: { columnWidths, isInitialized },
        actions: { handleMouseDown },
    };
}
