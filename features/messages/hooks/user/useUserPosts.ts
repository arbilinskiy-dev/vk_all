/**
 * Хук для загрузки постов пользователя (автора) в сообществе.
 * Ищет посты по signer_id / post_author_id в таблице system_list_posts.
 */

import { useState, useEffect, useCallback } from 'react';
import { SystemListPost } from '../../../../shared/types';
import { getUserPosts } from '../../../../services/api/lists.api';

interface UseUserPostsParams {
    projectId: string | null;
    /** VK ID пользователя */
    userId: number | null;
    /** Загружать ли данные (можно отложить до переключения вкладки) */
    enabled?: boolean;
}

interface UseUserPostsResult {
    /** Посты пользователя */
    posts: SystemListPost[];
    /** Общее количество постов */
    totalCount: number;
    /** Идёт загрузка */
    isLoading: boolean;
    /** Ошибка */
    error: string | null;
    /** Текущая страница */
    page: number;
    /** Есть ли ещё страницы */
    hasMore: boolean;
    /** Загрузить следующую страницу */
    loadMore: () => void;
}

const PAGE_SIZE = 20;

export function useUserPosts({ projectId, userId, enabled = true }: UseUserPostsParams): UseUserPostsResult {
    const [posts, setPosts] = useState<SystemListPost[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    // Сброс при смене пользователя
    useEffect(() => {
        setPosts([]);
        setTotalCount(0);
        setPage(1);
        setError(null);
    }, [projectId, userId]);

    // Загрузка данных
    const fetchPosts = useCallback(async (pageToLoad: number) => {
        if (!projectId || !userId || !enabled) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await getUserPosts(projectId, userId, pageToLoad, PAGE_SIZE);
            if (pageToLoad === 1) {
                // Первая страница — заменяем
                setPosts(response.items);
            } else {
                // Дозагрузка — добавляем
                setPosts(prev => [...prev, ...response.items]);
            }
            setTotalCount(response.total_count);
            setPage(pageToLoad);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка загрузки постов пользователя');
        } finally {
            setIsLoading(false);
        }
    }, [projectId, userId, enabled]);

    // Автозагрузка при включении / смене пользователя
    useEffect(() => {
        if (enabled && projectId && userId) {
            fetchPosts(1);
        }
    }, [enabled, projectId, userId, fetchPosts]);

    const hasMore = posts.length < totalCount;

    const loadMore = useCallback(() => {
        if (!isLoading && hasMore) {
            fetchPosts(page + 1);
        }
    }, [isLoading, hasMore, page, fetchPosts]);

    return {
        posts,
        totalCount,
        isLoading,
        error,
        page,
        hasMore,
        loadMore,
    };
}
