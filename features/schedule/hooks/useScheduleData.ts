
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, ScheduledPost, Note, SystemPost } from '../../../shared/types';
import * as api from '../../../services/api';
import { useProjects } from '../../../contexts/ProjectsContext';
import { RefreshType } from '../../posts/components/modals/PostDetailsModal';

// FIX: Modified the UnifiedPost type to include the 'date' property for system posts,
// ensuring a consistent shape for all post types in the calendar.
// Also added isGhost and originalId to SystemPost variant to support ghost posts logic.
export type UnifiedPost = (ScheduledPost & { postType: 'scheduled' | 'published' }) | (SystemPost & { postType: 'system', date: string, isGhost?: boolean, originalId?: string });


interface UseScheduleDataProps {
    project: Project;
    initialPublishedPosts: ScheduledPost[];
    initialScheduledPosts: ScheduledPost[];
    initialSystemPosts: SystemPost[];
    initialNotes: Note[];
    onRefreshPublished: (projectId: string) => Promise<void>;
    onRefreshScheduled: (projectId: string) => Promise<ScheduledPost[]>;
    onSystemPostsUpdate: (projectIds: string[]) => Promise<void>;
    onNotesUpdate: (projectId?: string) => Promise<void>;
    onSaveComplete: (projectIds: string[], refreshType: RefreshType) => Promise<void>;
    onRefreshAllSchedule?: (projectId: string) => Promise<void>;
}

export const useScheduleData = ({
    project,
    initialPublishedPosts,
    initialScheduledPosts,
    initialSystemPosts,
    initialNotes,
    onRefreshPublished,
    onRefreshScheduled,
    onSystemPostsUpdate,
    onNotesUpdate,
    onSaveComplete,
    onRefreshAllSchedule,
}: UseScheduleDataProps) => {
    const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>(initialScheduledPosts);
    const [systemPosts, setSystemPosts] = useState<SystemPost[]>(initialSystemPosts);
    const [posts, setPosts] = useState<UnifiedPost[]>([]);
    const [notes, setNotes] = useState<Note[]>(initialNotes);
    
    const [loadingStates, setLoadingStates] = useState({
        isRefreshingPublished: false,
        isRefreshingScheduled: false,
        isSavingNote: false,
        isDeleting: false,
    });
    
    useEffect(() => {
        setScheduledPosts(initialScheduledPosts);
        setSystemPosts(initialSystemPosts);
        setNotes(initialNotes);
    }, [project.id, initialScheduledPosts, initialSystemPosts, initialNotes]);

    useEffect(() => {
        const published: UnifiedPost[] = initialPublishedPosts.map(p => ({ ...p, postType: 'published' }));
        const scheduled: UnifiedPost[] = scheduledPosts.map(p => ({ ...p, postType: 'scheduled' }));
        const system: UnifiedPost[] = systemPosts.map(p => ({ 
            ...p, 
            date: p.publication_date, // Приводим к общему полю 'date'
            postType: 'system' 
        }));
        setPosts([...published, ...scheduled, ...system]);
    }, [initialPublishedPosts, scheduledPosts, systemPosts]);

    const handleRefreshAll = useCallback(async () => {
        setLoadingStates(prev => ({ ...prev, isRefreshingPublished: true, isRefreshingScheduled: true }));
        try {
            if (onRefreshAllSchedule) {
                // Атомарное обновление: Запрос -> Запись -> Тегирование -> Ответ
                await onRefreshAllSchedule(project.id);
            } else {
                // Fallback: Выполняем обновление последовательно
                // 1. Обновляем опубликованные посты
                await onRefreshPublished(project.id);
                
                // 2. Обновляем отложенные посты
                const scheduled = await onRefreshScheduled(project.id);
                setScheduledPosts(scheduled);
            }
            
            // 3. Обновляем системные посты и заметки
            await onSystemPostsUpdate([project.id]);
            await onNotesUpdate(project.id);
            
            window.showAppToast?.("Все данные календаря обновлены.", 'success');
        } catch (error) {
            console.error("Ошибка во время 'Обновить всё':", error);
        } finally {
            setLoadingStates(prev => ({ ...prev, isRefreshingPublished: false, isRefreshingScheduled: false }));
        }
    }, [project.id, onRefreshPublished, onRefreshScheduled, onSystemPostsUpdate, onNotesUpdate, onRefreshAllSchedule]);


    const handleRefreshPublishedClick = useCallback(async () => {
        setLoadingStates(prev => ({ ...prev, isRefreshingPublished: true }));
        try {
            await onRefreshPublished(project.id);
             window.showAppToast?.("Опубликованные посты обновлены из VK.", 'success');
        } catch (error) {
            // Ошибка уже обработана в контексте
        } finally {
            setLoadingStates(prev => ({ ...prev, isRefreshingPublished: false }));
        }
    }, [project.id, onRefreshPublished]);

    const handleRefreshScheduledClick = useCallback(async () => {
        setLoadingStates(prev => ({ ...prev, isRefreshingScheduled: true }));
        try {
            const freshScheduledPosts = await onRefreshScheduled(project.id);
            setScheduledPosts(freshScheduledPosts);
            window.showAppToast?.("Отложенные посты обновлены из VK.", 'success');
        } catch(error) {
            // Ошибка уже обработана в контексте
        } finally {
            setLoadingStates(prev => ({ ...prev, isRefreshingScheduled: false }));
        }
    }, [project.id, onRefreshScheduled]);
    
    const handleDelete = useCallback(async (postToDelete: UnifiedPost) => {
        // Защита: нельзя удалять посты contest_v2_start напрямую из расписания
        // Они связаны с механикой конкурса и удаляются только вместе с ней
        if (postToDelete.postType === 'system' && 'post_type' in postToDelete && postToDelete.post_type === 'contest_v2_start') {
            window.showAppToast?.("Этот пост связан с механикой Конкурс 2.0. Удалите его через настройки конкурса.", 'warning');
            return false;
        }
        
        setLoadingStates(prev => ({ ...prev, isDeleting: true }));
        let success = false;
        try {
            if (postToDelete.postType === 'system') {
                // FIX: Called the correct API function `deleteSystemPost` for deleting system posts.
                await api.deleteSystemPost(postToDelete.id);
                window.showAppToast?.("Системный пост успешно удален.", 'success');
                await onSystemPostsUpdate([project.id]);
            } else {
                 const isPublished = new Date(postToDelete.date) < new Date();
                if (isPublished) {
                    const result = await api.deletePublishedPost(postToDelete.id, project.id);
                    if (result.message === 'already_deleted') {
                        window.showAppToast?.("Этот пост уже был удален в VK. Он будет убран из вашего расписания.", 'info');
                    }
                    await onRefreshPublished(project.id);
                } else {
                    await api.deletePost(postToDelete.id, project.id);
                    window.showAppToast?.("Пост успешно удален.", 'success');
                    const freshScheduledPosts = await onRefreshScheduled(project.id);
                    setScheduledPosts(freshScheduledPosts);
                }
            }
            success = true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            window.showAppToast?.(`Не удалось удалить пост: ${errorMessage}`, 'error');
        } finally {
            setLoadingStates(prev => ({ ...prev, isDeleting: false }));
        }
        return success;
    }, [project.id, onRefreshPublished, onRefreshScheduled, onSystemPostsUpdate]);

     const handleDeleteNote = useCallback(async (noteToDelete: Note) => {
        setLoadingStates(prev => ({ ...prev, isDeleting: true }));
        let success = false;
        try {
            await api.deleteNote(noteToDelete.id);
            await onNotesUpdate(project.id);
            success = true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            window.showAppToast?.(`Не удалось удалить заметку: ${errorMessage}`, 'error');
        } finally {
            setLoadingStates(prev => ({ ...prev, isDeleting: false }));
        }
        return success;
    }, [onNotesUpdate, project.id]);

    const handleSaveNote = useCallback(async (noteToSave: Partial<Note>) => {
        setLoadingStates(prev => ({ ...prev, isSavingNote: true }));
        let success = false;
        try {
            const noteWithProjectId: Note = {
                ...(noteToSave as Note),
                projectId: project.id,
            };
            await api.saveNote(noteWithProjectId, project.id);
            await onNotesUpdate(project.id);
            success = true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            window.showAppToast?.(`Не удалось сохранить заметку: ${errorMessage}`, 'error');
        } finally {
            setLoadingStates(prev => ({ ...prev, isSavingNote: false }));
        }
        return success;
    }, [project.id, onNotesUpdate]);

    const handleSavePost = useCallback(async (affectedProjectIds: string[], refreshType: RefreshType) => {
        await onSaveComplete(affectedProjectIds, refreshType);
    }, [onSaveComplete]);

    /**
     * Массовое удаление постов и заметок — ТОЛЬКО API-вызовы, БЕЗ индивидуальных рефрешей.
     * Используется в handleConfirmBulkDelete, чтобы избежать гонки состояний
     * при параллельных рефрешах (каждый из которых мог затирать stories пустым массивом).
     * После вызова этого метода нужно сделать один финальный onRefreshAll.
     */
    const handleBulkDeleteOnly = useCallback(async (
        postsToDelete: UnifiedPost[],
        notesToDelete: Note[]
    ): Promise<{ successCount: number; totalCount: number }> => {
        const totalCount = postsToDelete.length + notesToDelete.length;
        
        // Формируем промисы удаления — только API-вызовы, без рефрешей
        const postPromises = postsToDelete.map(async (post) => {
            try {
                if (post.postType === 'system') {
                    await api.deleteSystemPost(post.id);
                } else {
                    const isPublished = new Date(post.date) < new Date();
                    if (isPublished) {
                        await api.deletePublishedPost(post.id, project.id);
                    } else {
                        await api.deletePost(post.id, project.id);
                    }
                }
                return true;
            } catch (error) {
                console.error(`Ошибка удаления поста ${post.id}:`, error);
                return false;
            }
        });
        
        const notePromises = notesToDelete.map(async (note) => {
            try {
                await api.deleteNote(note.id);
                return true;
            } catch (error) {
                console.error(`Ошибка удаления заметки ${note.id}:`, error);
                return false;
            }
        });
        
        const results = await Promise.allSettled([...postPromises, ...notePromises]);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
        
        return { successCount, totalCount };
    }, [project.id]);

    const actions = useMemo(() => ({
        handleRefreshPublishedClick,
        handleRefreshScheduledClick,
        handleRefreshAll,
        handleDelete,
        handleDeleteNote,
        handleBulkDeleteOnly,
        handleSaveNote,
        handleSavePost,
        onSystemPostsUpdate,
    }), [
        handleRefreshPublishedClick,
        handleRefreshScheduledClick,
        handleRefreshAll,
        handleDelete,
        handleDeleteNote,
        handleBulkDeleteOnly,
        handleSaveNote,
        handleSavePost,
        onSystemPostsUpdate
    ]);

    return {
        posts,
        notes,
        loadingStates,
        actions,
    };
};
