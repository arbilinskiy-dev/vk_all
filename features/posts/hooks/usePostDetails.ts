import { useState, useCallback, useEffect, useRef } from 'react';
import { ScheduledPost, Project, SystemPost, GlobalVariableDefinition, ProjectGlobalVariableValue, PhotoAttachment, Attachment } from '../../../shared/types';
import * as api from '../../../services/api';
import { usePostForm } from './usePostForm';
import { UnifiedPost } from '../../schedule/hooks/useScheduleData';
import { RefreshType } from '../components/modals/PostDetailsModal';

// Props for the hook, should match the modal's props
interface UsePostDetailsProps {
    post: UnifiedPost;
    isPublished: boolean;
    projectId: string;
    onClose: () => void;
    onSaveComplete: (affectedProjectIds: string[], refreshType: RefreshType) => void;
    onDelete: (post: ScheduledPost | SystemPost) => void;
    onPublishNow: (post: ScheduledPost | SystemPost) => void;
    initialMode?: 'view' | 'edit' | 'copy';
}

export const usePostDetails = ({
    post,
    isPublished,
    projectId,
    onClose,
    onSaveComplete,
    onDelete,
    onPublishNow,
    initialMode = 'view',
}: UsePostDetailsProps) => {
    // --- STATE MANAGEMENT ---

    // Приводим системный пост к типу ScheduledPost для работы с формой
    const formPost: ScheduledPost = 'post_type' in post && post.postType === 'system' ? {
        ...post,
        date: post.publication_date,
        vkPostUrl: undefined,
        tags: [],
    } : post;

    const isNewPost = formPost.id.startsWith('new-post-');
    const isCopyMode = initialMode === 'copy';
    const [mode, setMode] = useState<'view' | 'edit' | 'copy'>(isNewPost || isCopyMode ? 'edit' : initialMode);
    
    // Вся логика формы теперь инкапсулирована в usePostForm
    const { formState, formActions, videoFilesRef, storeVideoFile, removeVideoFile } = usePostForm(formPost, initialMode, projectId, post.postType);

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showUnsavedChangesConfirm, setShowUnsavedChangesConfirm] = useState(false);
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);

    // === СОСТОЯНИЕ RETRY ДЛЯ МУЛЬТИПРОЕКТНОЙ ПЕРЕЗАГРУЗКИ МЕДИА ===
    // Если при перезагрузке медиа некоторые проекты упали (таймаут, ошибка VK),
    // мы сохраняем посты для успешных проектов и предлагаем повторить для упавших.
    const [reuploadRetryInfo, setReuploadRetryInfo] = useState<{
        failedProjects: { project_id: string; error: string }[];
        successProjectIds: string[];  // Проекты, уже успешно сохранённые
    } | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);

    // Ref для хранения параметров сохранения (нужны при retry)
    const saveContextRef = useRef<{
        isPublishingNow: boolean;
        shouldScheduleInVk: boolean;
        datesToPostOn: { date: string; time: string }[];
        nonVideoAttachments: Attachment[];
    } | null>(null);

    // Новые состояния, поднятые из PostTextSection
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const [showVariables, setShowVariables] = useState(true);
    const [variables, setVariables] = useState<{ name: string; value: string }[] | null>(null);
    const [isLoadingVariables, setIsLoadingVariables] = useState(false);
    const [globalVariables, setGlobalVariables] = useState<GlobalVariableDefinition[] | null>(null);
    const [isLoadingGlobalVariables, setIsLoadingGlobalVariables] = useState(false);
    // Значения глобальных переменных для текущего проекта (для превью)
    const [globalVariableValues, setGlobalVariableValues] = useState<ProjectGlobalVariableValue[]>([]);

    // Автозагрузка переменных при монтировании (переменные всегда видны)
    useEffect(() => {
        const loadVariables = async () => {
            // Загружаем переменные проекта
            const storageKey = `variables-${projectId}`;
            const cachedData = sessionStorage.getItem(storageKey);
            if (cachedData) {
                setVariables(JSON.parse(cachedData));
            } else {
                setIsLoadingVariables(true);
                try {
                    const fetchedVariables = await api.getProjectVariables(projectId);
                    setVariables(fetchedVariables);
                    sessionStorage.setItem(storageKey, JSON.stringify(fetchedVariables));
                } catch (error) {
                    console.error("Не удалось загрузить переменные:", error);
                } finally {
                    setIsLoadingVariables(false);
                }
            }

            // Загружаем глобальные переменные (определения + значения для проекта)
            setIsLoadingGlobalVariables(true);
            try {
                const { definitions, values } = await api.getGlobalVariablesForProject(projectId);
                setGlobalVariables(definitions);
                setGlobalVariableValues(values);
            } catch (error) {
                console.error("Не удалось загрузить глобальные переменные:", error);
            } finally {
                setIsLoadingGlobalVariables(false);
            }
        };
        loadVariables();
    }, [projectId]);


    // --- DERIVED STATE & DATA ---

    const isLocked = false; // Верификация убрана — посты больше не блокируются в промежуточном состоянии
    
    const modalTitle = isNewPost ? 'Создать пост'
        : isCopyMode ? 'Копирование поста'
        : mode === 'edit' ? 'Редактировать пост'
        : 'Просмотр поста';

    const totalPostCount = (formState.isMultiProjectMode ? formState.selectedProjectIds.size : 1) * (formState.isBulkMode ? formState.dateSlots.length : 1);

    // --- HANDLERS & ACTIONS ---

    const handleClose = () => {
        // ОБНОВЛЕННАЯ ЛОГИКА: Показываем подтверждение, если есть изменения ИЛИ открыты панели
        if (mode === 'edit' && !isSaving && (formState.isDirty || showAIGenerator || showVariables)) {
            setShowUnsavedChangesConfirm(true);
        } else {
            onClose();
        }
    };

    const handleToggleVariables = async (forceRefetch = false) => {
        const shouldOpen = !showVariables;
        setShowVariables(shouldOpen);

        // Fetch Global Variables
        if (shouldOpen && !globalVariables) {
            setIsLoadingGlobalVariables(true);
            try {
                const fetchedGlobalVars = await api.getAllGlobalVariableDefinitions();
                setGlobalVariables(fetchedGlobalVars);
            } catch (error) {
                console.error("Не удалось загрузить глобальные переменные:", error);
            } finally {
                setIsLoadingGlobalVariables(false);
            }
        }
        
        // Fetch Project Variables
        if (shouldOpen && (!variables || forceRefetch)) {
            const storageKey = `variables-${projectId}`;
            if (forceRefetch) {
                sessionStorage.removeItem(storageKey);
            } else {
                const cachedData = sessionStorage.getItem(storageKey);
                if (cachedData) {
                    setVariables(JSON.parse(cachedData));
                    return;
                }
            }
            
            setIsLoadingVariables(true);
            try {
                const fetchedVariables = await api.getProjectVariables(projectId);
                setVariables(fetchedVariables);
                sessionStorage.setItem(storageKey, JSON.stringify(fetchedVariables));
            } catch (error) {
                console.error("Не удалось загрузить переменные:", error);
                window.showAppToast?.("Не удалось загрузить переменные проекта. Пожалуйста, попробуйте снова.", "error");
            } finally {
                setIsLoadingVariables(false);
            }
        }
    };
     const handleReloadVariables = async () => {
        if (!showVariables) setShowVariables(true);
        await handleToggleVariables(true);
    };


    // === УТИЛИТА: Сохранение постов для списка проектов ===
    // Выделена для переиспользования в handleSave и handleRetryReupload.
    const savePostsForProjects = async (
        projectIds: string[],
        mediaMapping: Record<string, { images: any[]; attachments: any[] }>,
        ctx: {
            isPublishingNow: boolean;
            shouldScheduleInVk: boolean;
            datesToPostOn: { date: string; time: string }[];
            nonVideoAttachments: Attachment[];
        },
    ): Promise<{ projectId: string; success: boolean; error?: string }[]> => {
        const results: { projectId: string; success: boolean; error?: string }[] = [];
        let projectIndex = 0;

        for (const projId of projectIds) {
            for (let idx = 0; idx < ctx.datesToPostOn.length; idx++) {
                const slot = ctx.datesToPostOn[idx];
                let textToUse = formState.editedText;

                // ВАЛИДАЦИЯ ПЕРЕД ОТПРАВКОЙ
                const hasAttachments = formState.editedImages.length > 0 || (formState.editedAttachments && formState.editedAttachments.length > 0);
                if (!textToUse?.trim() && !hasAttachments) {
                    throw new Error("Текст поста не может быть пустым. Введите текст.");
                }

                // Расчет времени публикации (с учетом индивидуальных настроек проекта)
                let saveDateTime: string;
                if (ctx.isPublishingNow) {
                    saveDateTime = new Date().toISOString();
                } else {
                    const projectDT = formState.isMultiProjectMode && formState.projectDateTimes[projId];
                    if (projectDT && formState.isBulkMode) {
                        const baseSlot = formState.dateSlots[0];
                        const baseMs = new Date(`${baseSlot.date}T${baseSlot.time}:00`).getTime();
                        const projMs = new Date(`${projectDT.date}T${projectDT.time}:00`).getTime();
                        const shiftMs = projMs - baseMs;
                        const slotMs = new Date(`${slot.date}T${slot.time}:00`).getTime();
                        saveDateTime = new Date(slotMs + shiftMs).toISOString();
                    } else if (projectDT) {
                        const projDate = new Date(`${projectDT.date}T${projectDT.time}:00`);
                        saveDateTime = projDate.toISOString();
                    } else {
                        const baseDate = new Date(`${slot.date}T${slot.time}:00`);
                        saveDateTime = baseDate.toISOString();
                    }
                }

                // Определяем медиа: исходный проект → оригинальные ID, доп. проекты → из маппинга
                const useRemapped = projId !== projectId && mediaMapping[projId];

                const postData: ScheduledPost = {
                    id: (isNewPost || isCopyMode) ? `new-post-${Date.now()}-${projectIndex}-${idx}` : formPost.id,
                    text: textToUse,
                    date: saveDateTime,
                    images: useRemapped ? mediaMapping[projId].images : formState.editedImages,
                    attachments: useRemapped
                        ? [...mediaMapping[projId].attachments, ...ctx.nonVideoAttachments]
                        : formState.editedAttachments,
                    is_cyclic: formState.isCyclic,
                    recurrence_interval: formState.isCyclic ? formState.recurrenceInterval : undefined,
                    recurrence_type: formState.isCyclic ? formState.recurrenceType : undefined,
                    recurrence_end_type: formState.isCyclic ? formState.recurrenceEndType : undefined,
                    recurrence_end_count: formState.isCyclic ? formState.recurrenceEndCount : undefined,
                    recurrence_end_date: formState.isCyclic ? formState.recurrenceEndDate : undefined,
                    recurrence_fixed_day: formState.isCyclic && formState.recurrenceFixedDay !== '' ? Number(formState.recurrenceFixedDay) : undefined,
                    recurrence_is_last_day: formState.isCyclic ? formState.recurrenceIsLastDay : undefined,
                    is_pinned: formState.isPinned || false,
                    first_comment_text: formState.firstCommentEnabled ? formState.firstCommentText : undefined,
                };

                console.log(`📝 [Post] Сохранение в проект ${projId}:`, {
                    date: saveDateTime,
                    imagesCount: postData.images.length,
                    attachmentsCount: postData.attachments?.length || 0,
                    remapped: !!useRemapped,
                });

                try {
                    if (ctx.isPublishingNow) {
                        const { taskId } = await api.publishPost(postData, projId);
                        await api.pollPostTask(taskId);
                        results.push({ projectId: projId, success: true });
                    } else {
                        await api.savePost(postData, projId, false, ctx.shouldScheduleInVk);
                        results.push({ projectId: projId, success: true });
                    }
                } catch (err) {
                    const errorMsg = err instanceof Error ? err.message : String(err);
                    console.error(`❌ [Post] Ошибка сохранения в проект ${projId}:`, err);
                    results.push({ projectId: projId, success: false, error: errorMsg });
                }
            }
            projectIndex++;
        }

        return results;
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);
        setReuploadRetryInfo(null);
        try {
            const isPublishingNow = formState.publicationMethod === 'now';
            const shouldScheduleInVk = formState.publicationMethod === 'vk';
            // Используем orderedProjectIds для сохранения порядка при сдвиге времени
            const projectsToPostIn: string[] = formState.timeShiftEnabled 
                ? formState.orderedProjectIds 
                : Array.from(formState.selectedProjectIds);
            const datesToPostOn = formState.isBulkMode ? formState.dateSlots : [formState.dateSlots[0]];
            
            // === ЛОГИРОВАНИЕ МУЛЬТИПРОЕКТНОЙ ПУБЛИКАЦИИ ===
            console.group('🚀 [MultiProject Save] Начало сохранения');
            console.log('📋 Настройки:', {
                timeShiftEnabled: formState.timeShiftEnabled,
                timeShiftDays: formState.timeShiftDays,
                timeShiftHours: formState.timeShiftHours,
                timeShiftMinutes: formState.timeShiftMinutes,
                publicationMethod: formState.publicationMethod,
                isBulkMode: formState.isBulkMode,
            });
            console.log('📦 Проекты для публикации:', projectsToPostIn);
            console.log('📅 Слоты дат:', datesToPostOn);
            console.groupEnd();
            
            // === РАЗДЕЛЯЕМ МЕДИА ===
            const videoAttachments = formState.editedAttachments.filter(a => a.type === 'video');
            const nonVideoAttachments = formState.editedAttachments.filter(a => a.type !== 'video');
            const hasMedia = formState.editedImages.length > 0 || videoAttachments.length > 0;
            const additionalProjectIds = projectsToPostIn.filter(pid => pid !== projectId);

            // Сохраняем контекст для retry
            const saveCtx = {
                isPublishingNow,
                shouldScheduleInVk,
                datesToPostOn,
                nonVideoAttachments,
            };
            saveContextRef.current = saveCtx;

            // === ШАГ 1: СОХРАНЯЕМ ИСХОДНЫЙ ПРОЕКТ ПЕРВЫМ ===
            // Это защита от потери данных: даже если контейнер упадёт при перезагрузке
            // медиа для доп. проектов, пост в исходном проекте уже будет сохранён.
            const allSuccessProjectIds: string[] = [];
            
            if (projectsToPostIn.includes(projectId)) {
                console.log(`💾 [Шаг 1] Сохраняем пост в исходный проект ${projectId}...`);
                const origResults = await savePostsForProjects([projectId], {}, saveCtx);
                const origFailed = origResults.filter(r => !r.success);
                if (origFailed.length > 0) {
                    throw new Error(`Ошибка сохранения в основной проект: ${origFailed[0].error}`);
                }
                allSuccessProjectIds.push(projectId);
                console.log(`✅ [Шаг 1] Исходный проект сохранён`);
            }

            // === ШАГ 2: ПЕРЕЗАГРУЗКА МЕДИА ДЛЯ ДОП. ПРОЕКТОВ ===
            let mediaMapping: Record<string, { images: any[]; attachments: any[] }> = {};
            let reuploadFailed: { project_id: string; error: string }[] = [];

            if (additionalProjectIds.length > 0 && hasMedia) {
                console.log(`🔄 [Шаг 2] Перезагрузка медиа для ${additionalProjectIds.length} проектов...`);
                try {
                    const reuploadResult = await api.reuploadForProjects(
                        additionalProjectIds,
                        formState.editedImages,
                        videoFilesRef.current,
                        videoAttachments.map(a => a.id),
                    );
                    mediaMapping = reuploadResult.mapping || {};
                    reuploadFailed = reuploadResult.failed || [];
                    
                    console.log(`✅ [Шаг 2] Успешно: ${Object.keys(mediaMapping).length}, Ошибки: ${reuploadFailed.length}`);
                } catch (reuploadError) {
                    // Полный провал запроса (сеть, контейнер упал, и т.д.)
                    const errMsg = reuploadError instanceof Error ? reuploadError.message : String(reuploadError);
                    console.error(`❌ [Шаг 2] Полная ошибка перезагрузки:`, reuploadError);
                    // Все дополнительные проекты помечаем как failed
                    reuploadFailed = additionalProjectIds.map(pid => ({
                        project_id: pid,
                        error: errMsg,
                    }));
                }
            }

            // === ШАГ 3: СОХРАНЯЕМ ПОСТЫ ДЛЯ ДОП. ПРОЕКТОВ С УСПЕШНОЙ ПЕРЕЗАГРУЗКОЙ ===
            const succeededAdditionalIds = additionalProjectIds.filter(pid => mediaMapping[pid]);
            // Проекты без медиа можно сохранять напрямую (текстовые посты)
            const noMediaAdditionalIds = additionalProjectIds.filter(pid => !hasMedia && !mediaMapping[pid]);
            const projectsToSaveNow = [...succeededAdditionalIds, ...noMediaAdditionalIds];

            if (projectsToSaveNow.length > 0) {
                console.log(`💾 [Шаг 3] Сохранение постов для ${projectsToSaveNow.length} доп. проектов...`);
                const addResults = await savePostsForProjects(projectsToSaveNow, mediaMapping, saveCtx);
                const addSucceeded = addResults.filter(r => r.success).map(r => r.projectId);
                allSuccessProjectIds.push(...addSucceeded);
                
                const addFailed = addResults.filter(r => !r.success);
                if (addFailed.length > 0) {
                    window.showAppToast?.(
                        `Не удалось сохранить посты для ${addFailed.length} проектов. Проверьте консоль.`,
                        "error"
                    );
                }
            }

            // === ШАГ 4: ОБРАБОТКА ОШИБОК ПЕРЕЗАГРУЗКИ ===
            if (reuploadFailed.length > 0) {
                console.warn(`⚠️ [Шаг 4] Не удалось перезагрузить медиа для ${reuploadFailed.length} проектов:`,
                    reuploadFailed.map(f => `${f.project_id}: ${f.error}`));
                
                // Сохраняем информацию для retry
                setReuploadRetryInfo({
                    failedProjects: reuploadFailed,
                    successProjectIds: allSuccessProjectIds,
                });
                
                // НЕ вызываем onSaveComplete — модалка остаётся открытой для retry
                setIsSaving(false);
                return; // Выходим, ждём retry или skip
            }

            // === ВСЕ УСПЕШНО — ЗАВЕРШАЕМ ===
            console.log(`🎉 [Готово] Все ${allSuccessProjectIds.length} проектов сохранены`);
            
            let refreshType: RefreshType = 'scheduled';
            if (formState.publicationMethod === 'system') {
              refreshType = 'system';
            } else if (formState.publicationMethod === 'now') {
              refreshType = 'published';
            } else if (formState.publicationMethod === 'vk') {
              if (isPublished && !isCopyMode) {
                refreshType = 'published'; 
              } else {
                refreshType = 'scheduled';
              }
            }

            onSaveComplete(allSuccessProjectIds, refreshType);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setSaveError(`Не удалось сохранить: ${errorMessage}`);
            console.error("Ошибка сохранения:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // === ПОВТОРНАЯ ПОПЫТКА ПЕРЕЗАГРУЗКИ МЕДИА ===
    // Вызывается из UI, когда пользователь нажимает «Повторить» для упавших проектов.
    const handleRetryReupload = async () => {
        if (!reuploadRetryInfo || !saveContextRef.current) return;
        
        setIsRetrying(true);
        const failedIds = reuploadRetryInfo.failedProjects.map(f => f.project_id);
        const ctx = saveContextRef.current;
        const videoAttachments = formState.editedAttachments.filter(a => a.type === 'video');
        
        console.log(`🔄 [Retry] Повторная перезагрузка для ${failedIds.length} проектов...`);
        
        try {
            const reuploadResult = await api.reuploadForProjects(
                failedIds,
                formState.editedImages,
                videoFilesRef.current,
                videoAttachments.map(a => a.id),
            );
            
            const mapping = reuploadResult.mapping || {};
            const stillFailed = reuploadResult.failed || [];
            
            // Сохраняем посты для только что успешно перезагруженных проектов
            const justSucceeded = failedIds.filter(pid => mapping[pid]);
            const newSuccessIds = [...reuploadRetryInfo.successProjectIds];
            
            if (justSucceeded.length > 0) {
                console.log(`💾 [Retry] Сохранение постов для ${justSucceeded.length} проектов...`);
                const saveResults = await savePostsForProjects(justSucceeded, mapping, ctx);
                const savedOk = saveResults.filter(r => r.success).map(r => r.projectId);
                newSuccessIds.push(...savedOk);
            }
            
            if (stillFailed.length > 0) {
                // Ещё есть ошибки — обновляем state для следующего retry
                console.warn(`⚠️ [Retry] Всё ещё не удалось для ${stillFailed.length} проектов`);
                setReuploadRetryInfo({
                    failedProjects: stillFailed,
                    successProjectIds: newSuccessIds,
                });
                window.showAppToast?.(
                    `Перезагружено: ${justSucceeded.length}. Ещё ошибки: ${stillFailed.length}.`,
                    justSucceeded.length > 0 ? "warning" : "error"
                );
            } else {
                // Все проекты успешны — закрываем модалку
                console.log(`🎉 [Retry] Все проекты сохранены!`);
                setReuploadRetryInfo(null);
                
                let refreshType: RefreshType = 'scheduled';
                if (formState.publicationMethod === 'system') refreshType = 'system';
                else if (formState.publicationMethod === 'now') refreshType = 'published';
                else if (formState.publicationMethod === 'vk') {
                    refreshType = isPublished && !isCopyMode ? 'published' : 'scheduled';
                }
                
                onSaveComplete(newSuccessIds, refreshType);
            }
        } catch (retryError) {
            const errMsg = retryError instanceof Error ? retryError.message : String(retryError);
            console.error(`❌ [Retry] Полная ошибка:`, retryError);
            window.showAppToast?.(`Ошибка при повторной загрузке: ${errMsg}`, "error");
        } finally {
            setIsRetrying(false);
        }
    };

    // === ПРОПУСТИТЬ УПАВШИЕ ПРОЕКТЫ ===
    // Пользователь решил не повторять — завершаем с тем, что есть.
    const handleSkipFailedReupload = () => {
        if (!reuploadRetryInfo) return;
        
        const doneIds = reuploadRetryInfo.successProjectIds;
        const skippedCount = reuploadRetryInfo.failedProjects.length;
        
        console.log(`⏭️ [Skip] Пропускаем ${skippedCount} проектов, завершаем с ${doneIds.length} успешными`);
        setReuploadRetryInfo(null);
        
        if (doneIds.length > 0) {
            window.showAppToast?.(
                `Сохранено для ${doneIds.length} проектов. ${skippedCount} проектов пропущено (медиа не загружено).`,
                "warning"
            );
            
            let refreshType: RefreshType = 'scheduled';
            if (formState.publicationMethod === 'system') refreshType = 'system';
            else if (formState.publicationMethod === 'now') refreshType = 'published';
            else if (formState.publicationMethod === 'vk') {
                refreshType = isPublished && !isCopyMode ? 'published' : 'scheduled';
            }
            
            onSaveComplete(doneIds, refreshType);
        } else {
            window.showAppToast?.(`Ни один пост не был сохранён.`, "error");
        }
    };
    
    const handlePublishNowClick = async () => {
        setIsSaving(true);
        try {
            const postData = {
                ...formPost,
                date: new Date(`${formState.dateSlots[0].date}T${formState.dateSlots[0].time}:00`).toISOString(),
                text: formState.editedText,
                images: formState.editedImages,
                attachments: formState.editedAttachments,
                first_comment_text: formState.firstCommentEnabled ? formState.firstCommentText : undefined,
            };

            const { taskId } = await api.publishPost(postData, projectId);
            
            await api.pollPostTask(taskId, (progress) => {
                console.log("Publishing progress:", progress);
            });

            onSaveComplete([projectId], 'published');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            window.showAppToast?.(`Ошибка публикации: ${errorMessage}`, "error");
            console.error("Publishing failed:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = () => {
        onDelete(post);
    }
    
    const switchToEditMode = () => {
        setMode('edit');
    };
    
    const confirmClose = () => {
        setShowUnsavedChangesConfirm(false);
        onClose();
    };
    
    const cancelClose = () => {
        setShowUnsavedChangesConfirm(false);
    };


    return {
        // Состояния для рендеринга
        state: {
            formPost, // Original post data, normalized
            mode,
            isNewPost,
            isCopyMode,
            isSaving,
            saveError,
            showUnsavedChangesConfirm,
            isLocked,
            isUploadingMedia,
            modalTitle,
            totalPostCount,
            formState, // State from usePostForm
            // Новые состояния для PostTextSection
            showAIGenerator,
            showVariables,
            variables,
            isLoadingVariables,
            globalVariables,
            isLoadingGlobalVariables,
            globalVariableValues,
            // Retry перезагрузки медиа
            reuploadRetryInfo,
            isRetrying,
        },
        // Действия для вызова из UI
        actions: {
            handleClose,
            handleSave,
            handlePublishNowClick,
            handleDeleteClick,
            switchToEditMode,
            confirmClose,
            cancelClose,
            setIsUploadingMedia,
            formActions, // Actions from usePostForm
             // Новые действия для PostTextSection
            setShowAIGenerator,
            handleToggleVariables,
            handleReloadVariables,
            // Мультипроектная перезагрузка видео
            storeVideoFile,
            removeVideoFile,
            // Retry при ошибках перезагрузки медиа
            handleRetryReupload,
            handleSkipFailedReupload,
        },
    };
};