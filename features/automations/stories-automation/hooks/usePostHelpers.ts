import { useState, useRef } from 'react';
import { callApi } from '../../../../shared/utils/apiClient';
import { PublishedPost, StoryLog } from '../types';

/**
 * Хук для работы с постами: публикация историй, определение статуса, утилиты.
 */
export const usePostHelpers = (
    projectId?: string,
    keywords: string = '',
    logs: StoryLog[] = [],
    loadLogs?: () => Promise<void>
) => {
    const [visibleCount, setVisibleCount] = useState(50);
    const [isPublishing, setIsPublishing] = useState<number | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    /** Извлечение VK ID поста из URL */
    const extractVkId = (post: PublishedPost): number | null => {
        const match = post.vkPostUrl ? post.vkPostUrl.match(/wall(-?\d+)_(\d+)/) : null;
        if (match && match[2]) return parseInt(match[2]);
        if (post.vkPostUrl) {
            const parts = post.vkPostUrl.split('_');
            if (parts.length > 1) {
                const last = parts[parts.length - 1];
                return parseInt(last);
            }
        }
        return null;
    };

    /** Ручная публикация истории из поста */
    const handleManualPublish = async (post: PublishedPost) => {
        if (!projectId) return;

        const vkPostId = extractVkId(post);
        if (!vkPostId) {
            window.showAppToast?.('Не удалось определить ID поста', 'error');
            return;
        }

        setIsPublishing(post.id as unknown as number);
        try {
            const res = await callApi('manualPublishStory', { projectId, vkPostId });
            if (res.status === 'success') {
                window.showAppToast?.('История успешно опубликована, не забудьте нажать "Обновить", когда она появится', 'success');
            } else if (res.status === 'skipped') {
                window.showAppToast?.('История уже опубликована', 'info');
            } else {
                throw new Error(res.message);
            }
            await loadLogs?.();
        } catch (error: any) {
            console.error(error);
            const logMsg = error?.response?.data?.detail || error.message || 'Ошибка публикации';
            window.showAppToast?.(logMsg, 'error');
        } finally {
            setIsPublishing(null);
        }
    };

    /** Обработчик скролла для ленивой подгрузки постов */
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 50) {
                setVisibleCount(prev => Math.min(prev + 50, 10000));
            }
        }
    };

    /** Определение статуса поста (подходит/опубликован/пропущен) */
    const getPostStatus = (post: PublishedPost) => {
        const vkId = extractVkId(post);
        if (!vkId) {
            return { status: 'none', label: 'Нет ID', color: 'text-gray-500 bg-gray-50 border-gray-200', details: '', logDate: null, vkId: null };
        }

        const log = logs.find(l => l.vk_post_id === vkId);

        if (log) {
            let storyLink = null;
            try {
                if (log.log) {
                    const parsed = JSON.parse(log.log);
                    storyLink = parsed.story_link;
                }
            } catch (e) {}

            return {
                status: 'published',
                label: 'Опубликовано',
                color: 'text-green-600 bg-green-50 border-green-200',
                details: null,
                logDate: new Date(log.created_at),
                storyLink,
                vkId
            };
        }

        const kwList = keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
        const postText = (post.text || '').toLowerCase();

        if (kwList.length === 0) {
            return { status: 'none', label: 'Нет условий', color: 'text-gray-500 bg-gray-50 border-gray-200', details: '', logDate: null, vkId };
        }

        const hasKeyword = kwList.some(k => postText.includes(k));

        if (hasKeyword) {
            const postDate = new Date(post.date);
            const isOld = (Date.now() - postDate.getTime()) > 24 * 60 * 60 * 1000;

            if (isOld) {
                return { status: 'skipped', label: 'Пропущен (старый)', color: 'text-gray-500 bg-gray-50 border-gray-200', details: 'Пост старше 24ч', logDate: null, vkId };
            }

            return { status: 'pending', label: 'Подходит по условиям', color: 'text-amber-600 bg-amber-50 border-amber-200', details: 'Ожидает публикации', logDate: null, vkId };
        }

        return { status: 'mismatch', label: 'Не подходит', color: 'text-gray-400 bg-gray-50 border-gray-200', details: 'Нет ключевых слов', logDate: null, vkId };
    };

    /** Получение первого изображения поста */
    const getFirstImage = (post: PublishedPost) => {
        try {
            if (!post.images) return null;

            let imagesData = post.images;
            if (typeof imagesData === 'string') {
                try {
                    imagesData = JSON.parse(imagesData);
                } catch (e) {
                    return null;
                }
            }

            if (Array.isArray(imagesData) && imagesData.length > 0) {
                return imagesData[0].url;
            }
        } catch (e) {}
        return null;
    };

    /** Извлечение числового значения из StatCounter или числа */
    const getCount = (field: any): number => {
        if (typeof field === 'number') return field;
        if (field && typeof field === 'object' && 'count' in field) return field.count || 0;
        return 0;
    };

    return {
        visibleCount, setVisibleCount,
        isPublishing,
        scrollContainerRef,
        handleManualPublish,
        handleScroll,
        getPostStatus,
        getFirstImage,
        getCount,
    };
};
