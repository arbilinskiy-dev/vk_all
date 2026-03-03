import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../../services/api';

/**
 * Хук для инкапсуляции логики фонового опроса (polling)
 * на наличие обновлений с бэкенда.
 * 
 * ИСПРАВЛЕНИЯ:
 * - Пауза polling при неактивной вкладке (document.visibilityState)
 * - Exponential backoff при отсутствии обновлений (5s → 10s → 20s → max 30s)
 * - Блокировка во время фоновой загрузки (Фаза 2)
 * - Защита от повторного добавления проектов, которые уже в очереди
 * - Debounce для предотвращения слишком частых обновлений состояния
 */
export const useUpdatePolling = () => {
    const [updatedProjectIds, setUpdatedProjectIds] = useState<Set<string>>(new Set());
    // Храним timestamp последнего ручного рефреша для каждого проекта
    const recentlyRefreshedRef = useRef<Map<string, number>>(new Map());
    // Ref для отслеживания проектов, которые сейчас обрабатываются (синхронизируются)
    const processingProjectsRef = useRef<Set<string>>(new Set());
    // Ref для debounce обновления состояния
    const pendingUpdatesRef = useRef<Set<string>>(new Set());
    const updateDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    // Ref для текущего интервала (exponential backoff)
    const currentIntervalRef = useRef<number>(5000);
    // Ref для таймера polling
    const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
    // Ref для флага фоновой загрузки (передаётся извне)
    const isBackgroundLoadingRef = useRef<boolean>(false);

    const addRecentRefresh = useCallback((projectId: string) => {
        recentlyRefreshedRef.current.set(projectId, Date.now());
        // Также помечаем проект как "обрабатываемый" на короткое время
        processingProjectsRef.current.add(projectId);
        
        // Очищаем устаревшие записи (старше 60 секунд)
        const now = Date.now();
        recentlyRefreshedRef.current.forEach((time, id) => {
            if (now - time > 60000) {
                recentlyRefreshedRef.current.delete(id);
            }
        });
        
        // Снимаем флаг "обрабатывается" через 5 секунд
        setTimeout(() => {
            processingProjectsRef.current.delete(projectId);
        }, 5000);
    }, []);

    // Метод для установки флага фоновой загрузки извне
    const setBackgroundLoading = useCallback((value: boolean) => {
        isBackgroundLoadingRef.current = value;
    }, []);

    useEffect(() => {
        const BASE_INTERVAL = 5000;    // Начальный интервал: 5 секунд
        const MAX_INTERVAL = 30000;    // Максимальный интервал: 30 секунд
        
        const scheduleNextPoll = () => {
            if (pollingTimerRef.current) {
                clearTimeout(pollingTimerRef.current);
            }
            pollingTimerRef.current = setTimeout(checkForUpdates, currentIntervalRef.current);
        };

        const checkForUpdates = async () => {
            // Не опрашиваем, если вкладка неактивна или идёт фоновая загрузка
            if (document.visibilityState === 'hidden' || isBackgroundLoadingRef.current) {
                scheduleNextPoll();
                return;
            }
            
            try {
                const { updatedProjectIds: updates } = await api.getUpdates();
                if (updates.length > 0) {
                    // Есть обновления — сбрасываем интервал на базовый
                    currentIntervalRef.current = BASE_INTERVAL;
                    
                    const now = Date.now();
                    const validUpdates: string[] = [];

                    updates.forEach(id => {
                        // Проверка 1: Проект был недавно обновлен вручную (30 секунд)
                        const lastRefreshTime = recentlyRefreshedRef.current.get(id);
                        if (lastRefreshTime && (now - lastRefreshTime < 30000)) {
                            return;
                        }
                        
                        // Проверка 2: Проект сейчас обрабатывается
                        if (processingProjectsRef.current.has(id)) {
                            return;
                        }
                        
                        validUpdates.push(id);
                    });

                    if (validUpdates.length > 0) {
                        // Собираем обновления с debounce для предотвращения частых перерисовок
                        validUpdates.forEach(id => pendingUpdatesRef.current.add(id));
                        
                        // Очищаем предыдущий таймер
                        if (updateDebounceTimerRef.current) {
                            clearTimeout(updateDebounceTimerRef.current);
                        }
                        
                        // Применяем обновления с задержкой 200ms
                        updateDebounceTimerRef.current = setTimeout(() => {
                            if (pendingUpdatesRef.current.size > 0) {
                                setUpdatedProjectIds(prev => {
                                    const newSet = new Set(prev);
                                    let hasChanges = false;
                                    
                                    pendingUpdatesRef.current.forEach(id => {
                                        // Финальная проверка перед добавлением
                                        if (!newSet.has(id) && !processingProjectsRef.current.has(id)) {
                                            newSet.add(id);
                                            hasChanges = true;
                                        }
                                    });
                                    
                                    pendingUpdatesRef.current.clear();
                                    return hasChanges ? newSet : prev;
                                });
                            }
                        }, 200);
                    }
                } else {
                    // Нет обновлений — увеличиваем интервал (exponential backoff)
                    currentIntervalRef.current = Math.min(currentIntervalRef.current * 2, MAX_INTERVAL);
                }
            } catch (error) {
                console.warn("Ошибка при опросе обновлений:", error);
                // При ошибке тоже увеличиваем интервал
                currentIntervalRef.current = Math.min(currentIntervalRef.current * 2, MAX_INTERVAL);
            }
            
            scheduleNextPoll();
        };

        // Первый запрос через 1 секунду
        const initialTimer = setTimeout(checkForUpdates, 1000);
        
        // При возвращении на вкладку — сбрасываем интервал и опрашиваем сразу
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                currentIntervalRef.current = BASE_INTERVAL;
                // Планируем проверку через 500ms после возврата на вкладку
                if (pollingTimerRef.current) {
                    clearTimeout(pollingTimerRef.current);
                }
                pollingTimerRef.current = setTimeout(checkForUpdates, 500);
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            clearTimeout(initialTimer);
            if (pollingTimerRef.current) {
                clearTimeout(pollingTimerRef.current);
            }
            if (updateDebounceTimerRef.current) {
                clearTimeout(updateDebounceTimerRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return { updatedProjectIds, setUpdatedProjectIds, addRecentRefresh, setBackgroundLoading };
};
