/**
 * Хук для управления логикой массового редактирования постов
 */

import { useState, useCallback, useMemo } from 'react';
import { Project, PhotoAttachment, Attachment, ScheduledPost, SystemPost } from '../../../shared/types';
import * as api from '../../../services/api';
import { 
    BulkEditSearchRequest, 
    BulkEditSearchResponse, 
    FoundPost, 
    BulkEditTaskStatus,
    PostToEdit,
    BulkEditChanges
} from '../../../services/api/bulk_edit.api';
import { UnifiedPost } from '../../schedule/hooks/useScheduleData';

// Шаги модалки
export type BulkEditStep = 'search' | 'results' | 'progress' | 'complete';

// Состояние формы поиска
export interface SearchFormState {
    searchFromDate: string;
    matchCriteria: {
        byDateTime: boolean;
        byText: boolean;
    };
    targetProjectIds: Set<string>;
    allProjectsSelected: boolean;
    targetPostTypes: {
        published: boolean;
        scheduled: boolean;
        system: boolean;
    };
}

// Состояние формы редактирования
export interface EditFormState {
    text: string;
    textChanged: boolean;
    images: PhotoAttachment[];
    imagesChanged: boolean;
    attachments: Attachment[];
    attachmentsChanged: boolean;
    date: string;
    dateChanged: boolean;
}

interface UseBulkEditProps {
    sourcePost: UnifiedPost;
    allProjects: Project[];
    onComplete: (affectedProjectIds: string[]) => void;
    onClose: () => void;
}

export const useBulkEdit = ({
    sourcePost,
    allProjects,
    onComplete,
    onClose
}: UseBulkEditProps) => {
    // === СОСТОЯНИЯ ===
    const [step, setStep] = useState<BulkEditStep>('search');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Результаты поиска
    const [searchResponse, setSearchResponse] = useState<BulkEditSearchResponse | null>(null);
    const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
    
    // Статус выполнения
    const [taskStatus, setTaskStatus] = useState<BulkEditTaskStatus | null>(null);
    
    // Форма поиска
    const [searchForm, setSearchForm] = useState<SearchFormState>(() => {
        // По умолчанию ищем начиная с даты исходного поста (а не с сегодня),
        // чтобы сам исходный пост и его копии гарантированно попали в выборку
        const postDate = 'date' in sourcePost 
            ? sourcePost.date 
            : (sourcePost as SystemPost).publication_date;
        const defaultDate = postDate 
            ? postDate.split('T')[0] 
            : new Date().toISOString().split('T')[0];
        
        return {
            searchFromDate: defaultDate,
            matchCriteria: {
                byDateTime: false,    // По умолчанию выключено
                byText: true          // По тексту включено
            },
            targetProjectIds: new Set(allProjects.map(p => p.id)),
            allProjectsSelected: true,
            targetPostTypes: {
                published: true,
                scheduled: true,
                system: true
            }
        };
    });
    
    // Форма редактирования (инициализируется из sourcePost)
    const [editForm, setEditForm] = useState<EditFormState>(() => ({
        text: sourcePost.text || '',
        textChanged: false,
        images: sourcePost.images || [],
        imagesChanged: false,
        attachments: sourcePost.attachments || [],
        attachmentsChanged: false,
        date: 'date' in sourcePost ? sourcePost.date : (sourcePost as SystemPost).publication_date,
        dateChanged: false
    }));

    // === ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ ===
    
    // Извлекаем ID вложений из исходного поста (для обратной совместимости)
    const sourceAttachmentIds = useMemo(() => {
        const ids: string[] = [];
        if (sourcePost.images) {
            ids.push(...sourcePost.images.map(img => img.id));
        }
        if (sourcePost.attachments) {
            ids.push(...sourcePost.attachments.map(att => att.id));
        }
        return ids;
    }, [sourcePost]);
    
    // Определяем тип исходного поста
    const sourcePostType = useMemo((): 'published' | 'scheduled' | 'system' => {
        if (sourcePost.postType === 'system') return 'system';
        if (sourcePost.postType === 'published') return 'published';
        return 'scheduled';
    }, [sourcePost]);
    
    // Дата исходного поста
    const sourceDate = useMemo(() => {
        return 'date' in sourcePost ? sourcePost.date : (sourcePost as SystemPost).publication_date;
    }, [sourcePost]);
    
    // Текст для подтверждения
    const confirmationText = useMemo(() => {
        const parts: string[] = [];
        if (editForm.textChanged) parts.push('текст');
        if (editForm.imagesChanged || editForm.attachmentsChanged) parts.push('вложения');
        if (editForm.dateChanged) parts.push('дату публикации');
        
        if (parts.length === 0) return '';
        
        const changesText = parts.join(' и ');
        const count = selectedPosts.size;
        
        return `Изменить ${changesText} в ${count} ${getPostsWord(count)}?`;
    }, [editForm, selectedPosts.size]);
    
    // Есть ли изменения
    const hasChanges = useMemo(() => {
        return editForm.textChanged || editForm.imagesChanged || 
               editForm.attachmentsChanged || editForm.dateChanged;
    }, [editForm]);

    // === ОБРАБОТЧИКИ ФОРМЫ ПОИСКА ===
    
    const updateSearchForm = useCallback((updates: Partial<SearchFormState>) => {
        setSearchForm(prev => ({ ...prev, ...updates }));
    }, []);
    
    const toggleMatchCriteria = useCallback((key: keyof SearchFormState['matchCriteria']) => {
        setSearchForm(prev => ({
            ...prev,
            matchCriteria: {
                ...prev.matchCriteria,
                [key]: !prev.matchCriteria[key]
            }
        }));
    }, []);
    
    const togglePostType = useCallback((key: keyof SearchFormState['targetPostTypes']) => {
        setSearchForm(prev => ({
            ...prev,
            targetPostTypes: {
                ...prev.targetPostTypes,
                [key]: !prev.targetPostTypes[key]
            }
        }));
    }, []);
    
    const toggleProject = useCallback((projectId: string) => {
        setSearchForm(prev => {
            const newSet = new Set(prev.targetProjectIds);
            if (newSet.has(projectId)) {
                newSet.delete(projectId);
            } else {
                newSet.add(projectId);
            }
            return {
                ...prev,
                targetProjectIds: newSet,
                allProjectsSelected: newSet.size === allProjects.length
            };
        });
    }, [allProjects.length]);
    
    const toggleAllProjects = useCallback(() => {
        setSearchForm(prev => {
            if (prev.allProjectsSelected) {
                return {
                    ...prev,
                    targetProjectIds: new Set(),
                    allProjectsSelected: false
                };
            } else {
                return {
                    ...prev,
                    targetProjectIds: new Set(allProjects.map(p => p.id)),
                    allProjectsSelected: true
                };
            }
        });
    }, [allProjects]);

    // === ОБРАБОТЧИКИ ФОРМЫ РЕДАКТИРОВАНИЯ ===
    
    const updateEditText = useCallback((text: string) => {
        setEditForm(prev => ({
            ...prev,
            text,
            textChanged: text !== sourcePost.text
        }));
    }, [sourcePost.text]);
    
    const updateEditImages = useCallback((images: PhotoAttachment[]) => {
        const originalImages = sourcePost.images || [];
        const changed = JSON.stringify(images.map(i => i.id)) !== 
                        JSON.stringify(originalImages.map(i => i.id));
        setEditForm(prev => ({
            ...prev,
            images,
            imagesChanged: changed
        }));
    }, [sourcePost.images]);
    
    const updateEditAttachments = useCallback((attachments: Attachment[]) => {
        const originalAttachments = sourcePost.attachments || [];
        const changed = JSON.stringify(attachments.map(a => a.id)) !== 
                        JSON.stringify(originalAttachments.map(a => a.id));
        setEditForm(prev => ({
            ...prev,
            attachments,
            attachmentsChanged: changed
        }));
    }, [sourcePost.attachments]);
    
    const updateEditDate = useCallback((date: string) => {
        setEditForm(prev => ({
            ...prev,
            date,
            dateChanged: date !== sourceDate
        }));
    }, [sourceDate]);
    
    const toggleDateChange = useCallback((enabled: boolean) => {
        if (!enabled) {
            // Сбрасываем дату на оригинальную
            setEditForm(prev => ({
                ...prev,
                date: sourceDate,
                dateChanged: false
            }));
        } else {
            setEditForm(prev => ({
                ...prev,
                dateChanged: true
            }));
        }
    }, [sourceDate]);

    // === ВЫБОР ПОСТОВ ===
    
    const togglePostSelection = useCallback((postId: string) => {
        setSelectedPosts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    }, []);
    
    const selectAllPosts = useCallback(() => {
        if (!searchResponse) return;
        const allIds = searchResponse.matchedPosts.map(p => p.id);
        setSelectedPosts(new Set(allIds));
    }, [searchResponse]);
    
    const deselectAllPosts = useCallback(() => {
        setSelectedPosts(new Set());
    }, []);

    // === ОСНОВНЫЕ ДЕЙСТВИЯ ===
    
    /**
     * Поиск совпадающих постов
     */
    const handleSearch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const request: BulkEditSearchRequest = {
                sourcePost: {
                    id: sourcePost.id,
                    postType: sourcePostType,
                    projectId: sourcePost.project_id || (sourcePost as ScheduledPost).project_id || '',
                    text: sourcePost.text || '',
                    date: sourceDate,
                    attachmentIds: sourceAttachmentIds
                },
                matchCriteria: searchForm.matchCriteria,
                searchFromDate: searchForm.searchFromDate + 'T00:00:00Z',
                targetProjectIds: Array.from(searchForm.targetProjectIds),
                targetPostTypes: searchForm.targetPostTypes
            };
            
            // === ДЕБАГ: Логируем запрос поиска ===
            console.log('[BULK_EDIT_DEBUG] ========== ПОИСК ==========');
            console.log('[BULK_EDIT_DEBUG] Исходный пост:', {
                id: request.sourcePost.id,
                postType: request.sourcePost.postType,
                projectId: request.sourcePost.projectId,
                textLength: request.sourcePost.text?.length || 0,
                textPreview: request.sourcePost.text?.substring(0, 80) || '(пусто)',
                date: request.sourcePost.date,
                attachmentIds: request.sourcePost.attachmentIds
            });
            console.log('[BULK_EDIT_DEBUG] Критерии:', request.matchCriteria);
            console.log('[BULK_EDIT_DEBUG] Дата начала поиска:', request.searchFromDate);
            console.log('[BULK_EDIT_DEBUG] Типы постов:', request.targetPostTypes);
            console.log('[BULK_EDIT_DEBUG] Проекты для поиска:', request.targetProjectIds.length, 'шт:', request.targetProjectIds);
            console.log('[BULK_EDIT_DEBUG] Полный запрос:', JSON.stringify(request, null, 2));
            // === /ДЕБАГ ===
            
            const response = await api.searchMatchingPosts(request);
            
            // === ДЕБАГ: Логируем ответ поиска ===
            console.log('[BULK_EDIT_DEBUG] ========== РЕЗУЛЬТАТ ПОИСКА ==========');
            console.log('[BULK_EDIT_DEBUG] Найдено постов:', response.matchedPosts?.length || 0);
            console.log('[BULK_EDIT_DEBUG] Статистика:', response.stats);
            console.log('[BULK_EDIT_DEBUG] Исходный пост в ответе:', response.sourcePost);
            if (response.matchedPosts?.length > 0) {
                console.log('[BULK_EDIT_DEBUG] Первые 5 найденных постов:');
                response.matchedPosts.slice(0, 5).forEach((p, i) => {
                    console.log(`[BULK_EDIT_DEBUG]   #${i + 1}: id=${p.id}, type=${p.postType}, project=${p.projectName}, date=${p.date}, text="${p.textPreview?.substring(0, 50)}"`);
                });
            } else {
                console.log('[BULK_EDIT_DEBUG] ⚠️ Совпадений НЕ найдено!');
            }
            console.log('[BULK_EDIT_DEBUG] Полный ответ:', JSON.stringify(response, null, 2));
            // === /ДЕБАГ ===
            
            setSearchResponse(response);
            
            // Автоматически выбираем все найденные посты
            setSelectedPosts(new Set(response.matchedPosts.map(p => p.id)));
            
            setStep('results');
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Ошибка поиска';
            // === ДЕБАГ: Логируем ошибку поиска ===
            console.error('[BULK_EDIT_DEBUG] ❌ ОШИБКА ПОИСКА:', e);
            console.error('[BULK_EDIT_DEBUG] Сообщение:', msg);
            if (e instanceof Error) {
                console.error('[BULK_EDIT_DEBUG] Стек:', e.stack);
            }
            // === /ДЕБАГ ===
            setError(msg);
            window.showAppToast?.(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [sourcePost, sourcePostType, sourceDate, sourceAttachmentIds, searchForm]);
    
    /**
     * Применение изменений
     */
    const handleApply = useCallback(async () => {
        // === ДЕБАГ: Проверка условий запуска ===
        console.log('[BULK_EDIT_DEBUG] ========== ПРИМЕНЕНИЕ ИЗМЕНЕНИЙ ==========');
        console.log('[BULK_EDIT_DEBUG] searchResponse:', !!searchResponse);
        console.log('[BULK_EDIT_DEBUG] selectedPosts.size:', selectedPosts.size);
        // === /ДЕБАГ ===
        
        if (!searchResponse || selectedPosts.size === 0) {
            console.warn('[BULK_EDIT_DEBUG] ⚠️ Отмена: нет ответа поиска или не выбраны посты');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setStep('progress');
        
        try {
            // Формируем список постов для редактирования
            const postsToEdit: PostToEdit[] = searchResponse.matchedPosts
                .filter(p => selectedPosts.has(p.id))
                .map(p => ({
                    id: p.id,
                    postType: p.postType,
                    projectId: p.projectId
                }));
            
            // Формируем изменения (только измененные поля)
            const changes: BulkEditChanges = {
                text: editForm.textChanged ? editForm.text : null,
                images: editForm.imagesChanged ? editForm.images : null,
                attachments: editForm.attachmentsChanged ? editForm.attachments : null,
                date: editForm.dateChanged ? editForm.date : null
            };
            
            // === ДЕБАГ: Логируем запрос на применение ===
            console.log('[BULK_EDIT_DEBUG] Посты для редактирования:', postsToEdit.length);
            postsToEdit.forEach((p, i) => {
                console.log(`[BULK_EDIT_DEBUG]   #${i + 1}: id=${p.id}, type=${p.postType}, projectId=${p.projectId}`);
            });
            console.log('[BULK_EDIT_DEBUG] Изменения:', {
                textChanged: editForm.textChanged,
                textPreview: changes.text ? changes.text.substring(0, 80) + '...' : '(не меняется)',
                imagesChanged: editForm.imagesChanged,
                imagesCount: changes.images?.length ?? '(не меняется)',
                attachmentsChanged: editForm.attachmentsChanged,
                attachmentsCount: changes.attachments?.length ?? '(не меняется)',
                dateChanged: editForm.dateChanged,
                newDate: changes.date || '(не меняется)'
            });
            console.log('[BULK_EDIT_DEBUG] Полный запрос apply:', JSON.stringify({ posts: postsToEdit, changes }, null, 2));
            // === /ДЕБАГ ===
            
            // Запускаем задачу
            const { taskId } = await api.applyBulkEdit({
                posts: postsToEdit,
                changes
            });
            
            // === ДЕБАГ: Получили taskId ===
            console.log('[BULK_EDIT_DEBUG] ✅ Задача создана, taskId:', taskId);
            console.log('[BULK_EDIT_DEBUG] Начинаю поллинг статуса...');
            // === /ДЕБАГ ===
            
            // Отслеживаем прогресс
            let pollCount = 0;
            const finalStatus = await api.pollBulkEditTask(taskId, (status) => {
                pollCount++;
                // === ДЕБАГ: Логируем каждый poll ===
                console.log(`[BULK_EDIT_DEBUG] Poll #${pollCount}: status=${status.status}, completed=${status.progress.completed}/${status.progress.total}, failed=${status.progress.failed}, current=${status.progress.current || 'N/A'}`);
                if (status.errors?.length > 0) {
                    console.warn('[BULK_EDIT_DEBUG] Ошибки на этом шаге:', status.errors);
                }
                // === /ДЕБАГ ===
                setTaskStatus(status);
            });
            
            // === ДЕБАГ: Финальный статус ===
            console.log('[BULK_EDIT_DEBUG] ========== ЗАВЕРШЕНИЕ ==========');
            console.log('[BULK_EDIT_DEBUG] Финальный статус:', finalStatus.status);
            console.log('[BULK_EDIT_DEBUG] Прогресс:', finalStatus.progress);
            console.log('[BULK_EDIT_DEBUG] Затронутые проекты:', finalStatus.affectedProjectIds);
            if (finalStatus.errors?.length > 0) {
                console.error('[BULK_EDIT_DEBUG] ❌ Ошибки:', JSON.stringify(finalStatus.errors, null, 2));
            }
            console.log('[BULK_EDIT_DEBUG] Всего poll-запросов:', pollCount);
            // === /ДЕБАГ ===
            
            setTaskStatus(finalStatus);
            setStep('complete');
            
            // Уведомляем о завершении
            if (finalStatus.status === 'done') {
                window.showAppToast?.(`Успешно отредактировано ${finalStatus.progress.completed} постов`, 'success');
            } else if (finalStatus.progress.failed > 0) {
                window.showAppToast?.(`Отредактировано ${finalStatus.progress.completed}, ошибок: ${finalStatus.progress.failed}`, 'warning');
            }
            
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Ошибка применения изменений';
            // === ДЕБАГ: Логируем ошибку применения ===
            console.error('[BULK_EDIT_DEBUG] ❌ ОШИБКА ПРИМЕНЕНИЯ:', e);
            console.error('[BULK_EDIT_DEBUG] Сообщение:', msg);
            if (e instanceof Error) {
                console.error('[BULK_EDIT_DEBUG] Стек:', e.stack);
            }
            // === /ДЕБАГ ===
            setError(msg);
            window.showAppToast?.(msg, 'error');
            setStep('results'); // Возвращаемся к результатам
        } finally {
            setIsLoading(false);
        }
    }, [searchResponse, selectedPosts, editForm]);
    
    /**
     * Завершение и закрытие
     */
    const handleComplete = useCallback(() => {
        if (taskStatus?.affectedProjectIds.length) {
            onComplete(taskStatus.affectedProjectIds);
        }
        onClose();
    }, [taskStatus, onComplete, onClose]);
    
    /**
     * Возврат к предыдущему шагу
     */
    const goBack = useCallback(() => {
        if (step === 'results') {
            setStep('search');
        } else if (step === 'complete') {
            handleComplete();
        }
    }, [step, handleComplete]);

    // === ВАЛИДАЦИЯ ===
    
    const canSearch = useMemo(() => {
        const hasCriteria = searchForm.matchCriteria.byDateTime || 
                           searchForm.matchCriteria.byText || 
                           searchForm.matchCriteria.byAttachments;
        const hasPostTypes = searchForm.targetPostTypes.published || 
                            searchForm.targetPostTypes.scheduled || 
                            searchForm.targetPostTypes.system;
        const hasProjects = searchForm.targetProjectIds.size > 0;
        
        return hasCriteria && hasPostTypes && hasProjects && !isLoading;
    }, [searchForm, isLoading]);
    
    const canApply = useMemo(() => {
        return selectedPosts.size > 0 && hasChanges && !isLoading;
    }, [selectedPosts.size, hasChanges, isLoading]);

    return {
        // Состояния
        step,
        isLoading,
        error,
        searchResponse,
        selectedPosts,
        taskStatus,
        searchForm,
        editForm,
        
        // Вычисляемые значения
        sourcePostType,
        sourceDate,
        confirmationText,
        hasChanges,
        canSearch,
        canApply,
        
        // Действия для формы поиска
        updateSearchForm,
        toggleMatchCriteria,
        togglePostType,
        toggleProject,
        toggleAllProjects,
        
        // Действия для формы редактирования
        updateEditText,
        updateEditImages,
        updateEditAttachments,
        updateEditDate,
        toggleDateChange,
        
        // Действия для выбора постов
        togglePostSelection,
        selectAllPosts,
        deselectAllPosts,
        
        // Основные действия
        handleSearch,
        handleApply,
        handleComplete,
        goBack
    };
};

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function getPostsWord(count: number): string {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return 'постах';
    }
    
    if (lastDigit === 1) {
        return 'посте';
    }
    
    if (lastDigit >= 2 && lastDigit <= 4) {
        return 'постах';
    }
    
    return 'постах';
}
