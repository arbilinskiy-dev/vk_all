import { useState, useEffect, useRef } from 'react';
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

    // Флаг: данные были загружены хотя бы раз — после этого скелетон всей страницы не показывается
    const hasEverLoadedRef = useRef(false);

    // Ref для отслеживания текущего projectId (защита от stale-ответов)
    const currentProjectIdRef = useRef<string | undefined>(projectId);
    if (projectId !== currentProjectIdRef.current) {
        currentProjectIdRef.current = projectId;
    }

    // Загрузка данных при смене проекта.
    // НЕ сбрасываем state синхронно — старые данные остаются видимыми
    // до прихода новых, чтобы избежать мерцания интерфейса.
    useEffect(() => {
        if (!projectId) return;
        loadData();
    }, [projectId]);

    /** Загрузка настроек, постов и логов */
    const loadData = async () => {
        const targetPid = currentProjectIdRef.current;
        // Скелетон всей страницы показываем только при первом запуске.
        // При смене проекта контент остаётся смонтированным — дашборд не релоадится.
        if (!hasEverLoadedRef.current) {
            setIsLoading(true);
        }
        setIsInitialLoad(true);
        try {
            const [settingsData, postsData, logsData] = await Promise.all([
                callApi('getStoriesAutomation', { projectId: targetPid }),
                callApi('getCachedPublishedPosts', { projectId: targetPid }),
                callApi('getStoriesAutomationLogs', { projectId: targetPid }),
            ]);

            // Защита от stale-ответов: если проект сменился — не перезаписываем state
            if (currentProjectIdRef.current !== targetPid) return;

            setIsActive(settingsData.is_active || false);
            setKeywords(settingsData.keywords || '');
            setPosts(postsData || []);
            setLogs(logsData || []);
            hasEverLoadedRef.current = true;
        } catch (error) {
            console.error(error);
            if (currentProjectIdRef.current === targetPid) {
                window.showAppToast?.('Не удалось загрузить данные', 'error');
            }
        } finally {
            if (currentProjectIdRef.current === targetPid) {
                setIsLoading(false);
                setIsInitialLoad(false);
            }
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
