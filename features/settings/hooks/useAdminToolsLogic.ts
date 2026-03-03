/**
 * Хук логики для раздела «Админ-инструменты».
 * Управляет стейтом задач, опросом статуса и экшнами.
 */
import { useState, useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import * as managementApi from '../../../services/api/management.api';
import * as listsApi from '../../../services/api/lists.api';
import type { BulkTaskState, PostsLimit, PostsMode, ExpandedTask } from '../types';

export const useAdminToolsLogic = () => {
    // Состояние для задачи обновления подписчиков
    const [subscribersTask, setSubscribersTask] = useState<BulkTaskState>({
        isRunning: false,
        taskId: null,
        progress: null
    });
    
    // Состояние для задачи сбора постов
    const [postsTask, setPostsTask] = useState<BulkTaskState>({
        isRunning: false,
        taskId: null,
        progress: null
    });
    
    // Выбор лимита постов и режима
    const [postsLimit, setPostsLimit] = useState<PostsLimit>('1000');
    const [postsMode, setPostsMode] = useState<PostsMode>('limit');
    
    // Состояние раскрытия деталей задач
    const [expandedTask, setExpandedTask] = useState<ExpandedTask>(null);

    // Функция для опроса статуса задачи
    const pollTaskStatus = useCallback(async (
        taskId: string, 
        setTaskState: Dispatch<SetStateAction<BulkTaskState>>
    ) => {
        const poll = async () => {
            try {
                const status = await listsApi.getTaskStatus(taskId);
                
                setTaskState(prev => ({
                    ...prev,
                    progress: status
                }));
                
                if (status.status === 'done' || status.status === 'error') {
                    setTaskState(prev => ({
                        ...prev,
                        isRunning: false
                    }));
                    
                    if (status.status === 'done') {
                        window.showAppToast?.('Задача успешно завершена!', 'success');
                    } else {
                        window.showAppToast?.(`Ошибка: ${status.error}`, 'error');
                    }
                    return;
                }
                
                // Продолжаем опрос
                setTimeout(poll, 2000);
            } catch (error) {
                console.error('Ошибка при опросе статуса задачи:', error);
                setTaskState(prev => ({
                    ...prev,
                    isRunning: false,
                    progress: { status: 'error', error: 'Потеряно соединение с сервером' }
                }));
            }
        };
        
        poll();
    }, []);

    // Проверка активных задач при монтировании
    useEffect(() => {
        const checkExistingTasks = async () => {
            // Проверяем, нет ли уже запущенных или недавно завершённых глобальных задач
            try {
                const allTasks = await listsApi.getAllTasks();
                
                // Ищем задачу обновления подписчиков (активную или последнюю завершённую)
                const subscribersTaskFound = allTasks.find(
                    t => t.meta?.project_id === 'GLOBAL' && 
                        t.meta?.list_type === 'refresh_all_subscribers'
                );
                
                if (subscribersTaskFound) {
                    const isRunning = subscribersTaskFound.status !== 'done' && subscribersTaskFound.status !== 'error';
                    setSubscribersTask({
                        isRunning,
                        taskId: subscribersTaskFound.taskId,
                        progress: subscribersTaskFound
                    });
                    // Запускаем polling только если задача активна
                    if (isRunning) {
                        pollTaskStatus(subscribersTaskFound.taskId, setSubscribersTask);
                    }
                }
                
                // Ищем задачу сбора постов (активную или последнюю завершённую)
                const postsTaskFound = allTasks.find(
                    t => t.meta?.project_id === 'GLOBAL' && 
                        t.meta?.list_type === 'refresh_all_posts'
                );
                
                if (postsTaskFound) {
                    const isRunning = postsTaskFound.status !== 'done' && postsTaskFound.status !== 'error';
                    setPostsTask({
                        isRunning,
                        taskId: postsTaskFound.taskId,
                        progress: postsTaskFound
                    });
                    // Запускаем polling только если задача активна
                    if (isRunning) {
                        pollTaskStatus(postsTaskFound.taskId, setPostsTask);
                    }
                }
            } catch (e) {
                console.warn('Не удалось проверить активные задачи', e);
            }
        };
        
        checkExistingTasks();
    }, [pollTaskStatus]);

    // Запуск обновления подписчиков всех проектов
    const handleRefreshAllSubscribers = async () => {
        try {
            setSubscribersTask(prev => ({ ...prev, isRunning: true, progress: { status: 'pending', message: 'Запуск...' } }));
            
            const { taskId } = await managementApi.refreshAllSubscribers();
            
            setSubscribersTask(prev => ({ ...prev, taskId }));
            
            // Начинаем опрос статуса
            pollTaskStatus(taskId, setSubscribersTask);
            
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            window.showAppToast?.(`Не удалось запустить задачу: ${msg}`, 'error');
            setSubscribersTask({ isRunning: false, taskId: null, progress: null });
        }
    };

    // Запуск сбора постов всех проектов
    const handleRefreshAllPosts = async (mode: PostsMode = 'limit') => {
        try {
            setPostsTask(prev => ({ ...prev, isRunning: true, progress: { status: 'pending', message: 'Запуск...' } }));
            setPostsMode(mode);
            
            const { taskId } = await managementApi.refreshAllPosts(postsLimit, mode);
            
            setPostsTask(prev => ({ ...prev, taskId }));
            
            // Начинаем опрос статуса
            pollTaskStatus(taskId, setPostsTask);
            
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            window.showAppToast?.(`Не удалось запустить задачу: ${msg}`, 'error');
            setPostsTask({ isRunning: false, taskId: null, progress: null });
        }
    };

    // Остановка задачи
    const handleStopTask = async (taskId: string | null, setTaskState: Dispatch<SetStateAction<BulkTaskState>>) => {
        if (!taskId) return;
        try {
            await listsApi.deleteTask(taskId);
            setTaskState({ isRunning: false, taskId: null, progress: null });
            window.showAppToast?.('Задача остановлена', 'info');
        } catch (error) {
            console.error('Ошибка при остановке задачи:', error);
            window.showAppToast?.('Не удалось остановить задачу', 'error');
        }
    };

    return {
        state: {
            subscribersTask,
            postsTask,
            postsLimit,
            postsMode,
            expandedTask,
        },
        actions: {
            setPostsLimit,
            setExpandedTask,
            handleRefreshAllSubscribers,
            handleRefreshAllPosts,
            handleStopSubscribers: () => handleStopTask(subscribersTask.taskId, setSubscribersTask),
            handleStopPosts: () => handleStopTask(postsTask.taskId, setPostsTask),
        }
    };
};
