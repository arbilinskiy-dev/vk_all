/**
 * Хук для real-time обновления таблицы рассылки через SSE.
 *
 * Подключается к тому же SSE-стриму /messages/stream и слушает событие
 * mailing_user_updated — когда бэкенд при callback message_new обновляет
 * пользователя в списке рассылки.
 *
 * Если пользователь смотрит вкладку «Рассылка» — перезагружает items, stats и meta
 * в реальном времени (с debounce чтобы не спамить при пачке колбэков).
 */

import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../../shared/config';
import { ListType } from '../types';

/** Получаем manager_id из localStorage (тот же ключ что в useMessagesSSE) */
function getManagerId(): string {
    const STORAGE_KEY = 'vk_planner_manager_id';
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
        id = `mgr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
}

interface UseMailingSSEUpdaterParams {
    /** ID проекта */
    projectId: string;
    /** Текущий активный тип списка */
    activeList: ListType | null;
    /** Текущий поисковый запрос (для перезагрузки items с тем же фильтром) */
    searchQuery: string;
    /** Функция перезагрузки элементов таблицы */
    fetchItems: (pageNum: number, search: string, isReset: boolean) => Promise<void>;
    /** Функция перезагрузки статистики */
    fetchStats: (listType: ListType) => Promise<void>;
    /** Функция обновления метаданных (счётчики) */
    fetchMeta: () => Promise<void>;
}

export function useMailingSSEUpdater({
    projectId,
    activeList,
    searchQuery,
    fetchItems,
    fetchStats,
    fetchMeta,
}: UseMailingSSEUpdaterParams): void {
    const eventSourceRef = useRef<EventSource | null>(null);
    const managerId = useRef(getManagerId()).current;

    // Храним activeList и searchQuery в ref, чтобы не пересоздавать EventSource
    const activeListRef = useRef(activeList);
    activeListRef.current = activeList;
    const searchQueryRef = useRef(searchQuery);
    searchQueryRef.current = searchQuery;

    // Debounce для обновления данных (если приходит несколько SSE подряд)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Храним функции в ref, чтобы EventSource не пересоздавался при изменении коллбэков
    const fetchItemsRef = useRef(fetchItems);
    fetchItemsRef.current = fetchItems;
    const fetchStatsRef = useRef(fetchStats);
    fetchStatsRef.current = fetchStats;
    const fetchMetaRef = useRef(fetchMeta);
    fetchMetaRef.current = fetchMeta;

    useEffect(() => {
        if (!projectId) return;

        // Создаём SSE-подключение к тому же стриму
        const params = new URLSearchParams({
            project_id: projectId,
            manager_id: `${managerId}_lists`,  // Суффикс чтобы не конфликтовать с Messages SSE
            manager_name: 'lists_updater',
        });
        const url = `${API_BASE_URL}/messages/stream?${params.toString()}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        // Слушаем mailing_user_updated
        es.addEventListener('mailing_user_updated', () => {
            // Мету обновляем ВСЕГДА — чтобы счётчик на карточке «В рассылке» был актуален,
            // даже если активна другая вкладка
            fetchMetaRef.current();

            // Таблицу и статистику обновляем только если активна вкладка «Рассылка»
            if (activeListRef.current !== 'mailing') return;

            // Debounce — при пачке колбэков перезагрузим данные один раз
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            debounceRef.current = setTimeout(() => {
                // M5 fix: Повторная проверка activeList после debounce —
                // за 500мс пользователь мог переключить таб
                if (activeListRef.current !== 'mailing') return;
                
                console.log('[Lists SSE] mailing_user_updated → перезагрузка таблицы и статистики');
                // Полная перезагрузка данных через HTTP — надёжно обновляет таблицу
                fetchItemsRef.current(1, searchQueryRef.current, true);
                fetchStatsRef.current('mailing');
            }, 500);
        });

        es.addEventListener('connected', () => {
            console.log('[Lists SSE] Подключен к потоку mailing_user_updated');
        });

        // Молча переподключаемся при ошибке (нативное поведение EventSource)
        es.onerror = () => {
            // EventSource автоматически переподключится
        };

        return () => {
            es.close();
            eventSourceRef.current = null;
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [projectId, managerId]);
}
