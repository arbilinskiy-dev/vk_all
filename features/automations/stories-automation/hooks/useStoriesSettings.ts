import { useState, useEffect } from 'react';
import { callApi } from '../../../../shared/utils/apiClient';
import { PublishedPost, StoryLog } from '../types';
import { useProjects } from '../../../../contexts/ProjectsContext';

/**
 * Хук управления настройками автоматизации историй.
 * Отвечает за загрузку/сохранение настроек, списка постов и логов.
 */
export const useStoriesSettings = (projectId?: string) => {
    // Синхронизация с глобальным контекстом (для индикатора в сайдбаре)
    const { setStoriesAutomationStatuses } = useProjects();
    
    // Состояние настроек
    const [isActive, setIsActive] = useState(false);
    const [keywords, setKeywords] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Посты и логи
    const [posts, setPosts] = useState<PublishedPost[]>([]);
    const [logs, setLogs] = useState<StoryLog[]>([]);

    // Загрузка данных при смене проекта
    useEffect(() => {
        if (!projectId) return;
        loadData();
    }, [projectId]);

    /** Загрузка настроек, постов и логов */
    const loadData = async () => {
        setIsLoading(true);
        setIsInitialLoad(true);
        try {
            const [settingsData, postsData, logsData] = await Promise.all([
                callApi('getStoriesAutomation', { projectId }),
                callApi('getCachedPublishedPosts', { projectId }),
                callApi('getStoriesAutomationLogs', { projectId }),
            ]);

            setIsActive(settingsData.is_active || false);
            setKeywords(settingsData.keywords || '');
            setPosts(postsData || []);
            setLogs(logsData || []);
        } catch (error) {
            console.error(error);
            window.showAppToast?.('Не удалось загрузить данные', 'error');
        } finally {
            setIsLoading(false);
            setIsInitialLoad(false);
        }
    };

    /** Сохранение настроек */
    const handleSave = async () => {
        if (!projectId) return;
        setIsSaving(true);
        try {
            await callApi('updateStoriesAutomation', {
                projectId,
                settings: { is_active: isActive, keywords: keywords }
            });
            // Синхронизируем глобальный контекст для индикатора в сайдбаре
            setStoriesAutomationStatuses(prev => ({
                ...prev,
                [projectId]: isActive
            }));
            window.showAppToast?.('Настройки обновлены', 'success');
        } catch (error) {
            console.error(error);
            window.showAppToast?.('Не удалось сохранить', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    /** Перезагрузка логов */
    const loadLogs = async () => {
        if (!projectId) return;
        try {
            const logsData = await callApi('getStoriesAutomationLogs', { projectId });
            setLogs(logsData || []);
        } catch (error) {
            console.error(error);
        }
    };

    return {
        isActive, setIsActive,
        keywords, setKeywords,
        isLoading,
        isInitialLoad,
        isSaving,
        posts,
        logs,
        handleSave,
        loadLogs,
    };
};
