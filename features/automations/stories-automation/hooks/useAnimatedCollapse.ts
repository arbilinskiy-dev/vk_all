import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Хук для анимированного сворачивания/разворачивания блока.
 * Отслеживает высоту внутреннего контента через ResizeObserver
 * и обеспечивает плавный transition height.
 *
 * Фикс E: functional setState для предотвращения лишних ре-рендеров,
 * guard для ResizeObserver при скрытом блоке.
 */
export function useAnimatedCollapse({ isVisible }: { isVisible: boolean }) {
    // Refs для плавного изменения высоты
    const containerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState<number | 'auto'>(0);
    // Флаг: блок хотя бы раз был показан (для начальной анимации)
    const wasVisibleRef = useRef(false);
    // Ref для доступа к isVisible из ResizeObserver callback без пересоздания
    const isVisibleRef = useRef(isVisible);
    isVisibleRef.current = isVisible;

    // Обновляем высоту контейнера при изменении содержимого
    // Фикс E: functional setState — если значение не изменилось, React не перерисовывает
    const updateHeight = useCallback(() => {
        if (innerRef.current && isVisible) {
            const h = innerRef.current.scrollHeight;
            setContainerHeight(prev => {
                if (prev === h) return prev; // без изменений — не перерисовываем
                return h;
            });
        } else if (!isVisible) {
            setContainerHeight(prev => {
                if (prev === 0) return prev; // уже 0 — не перерисовываем
                return 0;
            });
        }
    }, [isVisible]);

    // Отслеживаем, был ли блок видим
    useEffect(() => {
        if (isVisible) wasVisibleRef.current = true;
    }, [isVisible]);

    // ResizeObserver для отслеживания изменения размеров внутреннего контента
    // Фикс E: пропускаем нулевые resize для скрытого блока
    useEffect(() => {
        if (!innerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            const h = Math.round(entry.contentRect.height);
            // Пропускаем нулевые resize для скрытого блока — бесполезная работа
            if (h === 0 && !isVisibleRef.current) return;
            updateHeight();
        });
        observer.observe(innerRef.current);
        return () => {
            observer.disconnect();
        };
    }, [updateHeight]);

    return {
        containerRef,
        innerRef,
        containerHeight,
        updateHeight,
    };
}
