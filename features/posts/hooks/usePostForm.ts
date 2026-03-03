import { useState, useEffect, useMemo, useRef } from 'react';
import { ScheduledPost, PhotoAttachment, Attachment } from '../../../shared/types';
import { useDirtyCheck } from './useDirtyCheck';
import { useBulkCreationManager } from './useBulkCreationManager';
import { ChatTurn } from './useAIGenerator';

export const usePostForm = (
    post: ScheduledPost, 
    initialMode: 'view' | 'edit' | 'copy', 
    projectId: string,
    postType?: 'scheduled' | 'published' | 'system'
) => {
    // Ref для хранения оригинальных File-объектов загруженных видео.
    // Используется при мультипроектной публикации: видео нужно перезагрузить
    // в каждую целевую группу VK, для чего нужен оригинальный файл.
    // Map: attachmentId (например "video-123_456") → File
    const videoFilesRef = useRef<Map<string, File>>(new Map());

    // Callback для сохранения File видео после успешной загрузки
    const storeVideoFile = (attachmentId: string, file: File) => {
        videoFilesRef.current.set(attachmentId, file);
        console.log(`📁 [VideoFiles] Сохранён файл для ${attachmentId} (${file.name}, ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
    };

    // Callback для удаления File видео при удалении аттачмента
    const removeVideoFile = (attachmentId: string) => {
        if (videoFilesRef.current.has(attachmentId)) {
            videoFilesRef.current.delete(attachmentId);
            console.log(`📁 [VideoFiles] Удалён файл для ${attachmentId}`);
        }
    };

    // Form state
    const getInitialPublicationMethod = (): 'system' | 'vk' | 'now' => {
        const isNew = post.id.startsWith('new-post-');
        
        if (isNew || initialMode === 'copy') {
            return 'system'; // Новые или скопированные посты всегда по умолчанию системные.
        }

        // Если это существующий пост из VK (отложенный ИЛИ опубликованный),
        // то при редактировании мы должны использовать VK API.
        if (postType === 'scheduled' || postType === 'published') {
            return 'vk';
        }

        // Во всех остальных случаях (например, редактирование существующего системного поста) - метод системный.
        return 'system'; 
    };

    const [publicationMethod, setPublicationMethod] = useState<'system' | 'vk' | 'now'>(getInitialPublicationMethod());
    const [editedText, setEditedText] = useState(post.text);
    const [editedImages, setEditedImages] = useState<PhotoAttachment[]>(post.images);
    const [editedAttachments, setEditedAttachments] = useState<Attachment[]>(post.attachments || []);
    
    // Cyclic state
    const [isCyclic, setIsCyclic] = useState(post.is_cyclic || false);
    const [recurrenceInterval, setRecurrenceInterval] = useState(post.recurrence_interval || 1);
    const [recurrenceType, setRecurrenceType] = useState<'minutes' | 'hours' | 'days' | 'weeks' | 'months'>(post.recurrence_type || 'days');
    
    // Pin state — закрепить пост на стене
    const [isPinned, setIsPinned] = useState(post.is_pinned || false);

    // First Comment state — первый комментарий от имени сообщества
    const [firstCommentEnabled, setFirstCommentEnabled] = useState(Boolean(post.first_comment_text));
    const [firstCommentText, setFirstCommentText] = useState(post.first_comment_text || '');
    
    // Enhanced Cyclic state
    const [recurrenceEndType, setRecurrenceEndType] = useState<'infinite' | 'count' | 'date'>(post.recurrence_end_type || 'infinite');
    const [recurrenceEndCount, setRecurrenceEndCount] = useState<number>(post.recurrence_end_count || 5);
    const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>(post.recurrence_end_date || '');
    const [recurrenceFixedDay, setRecurrenceFixedDay] = useState<number | ''>(post.recurrence_fixed_day || '');
    const [recurrenceIsLastDay, setRecurrenceIsLastDay] = useState<boolean>(post.recurrence_is_last_day || false);

    // AI Multi-Generation State
    const [isAiMultiMode, setIsAiMultiMode] = useState(false);
    const [selectedAiTurn, setSelectedAiTurn] = useState<ChatTurn | null>(null);

    // 1. Хук для управления режимами массового/мультипроектного создания
    const {
        bulkState,
        bulkActions,
        isFutureDate
    } = useBulkCreationManager(post, initialMode, projectId);

    const { dateSlots, isBulkMode, isMultiProjectMode, selectedProjectIds, timeShiftEnabled, timeShiftDays, timeShiftHours, timeShiftMinutes, orderedProjectIds, projectDateTimes, customOverrideIds } = bulkState;
    const { setIsBulkMode, setIsMultiProjectMode, setSelectedProjectIds, handleAddDateSlot, handleRemoveDateSlot, handleDateSlotChange, handleToggleTimeShift, setTimeShiftDays, setTimeShiftHours, setTimeShiftMinutes, reorderProjects, setProjectDateTime, resetProjectDateTime } = bulkActions;

    // 2. Хук для определения "грязного" состояния формы
    // ВНИМАНИЕ: useDirtyCheck пока не учитывает новые циклические поля. 
    // Для упрощения считаем форму грязной при изменении флагов цикличности вручную.
    const basicIsDirty = useDirtyCheck({
        originalPost: post,
        initialMode,
        currentProjectId: projectId,
        editedText,
        editedImages,
        editedAttachments,
        isBulkMode,
        isMultiProjectMode,
        dateSlots,
        selectedProjectIds,
    });
    
    const isCyclicDirty = isCyclic !== (post.is_cyclic || false) || 
                          recurrenceInterval !== (post.recurrence_interval || 1) ||
                          recurrenceType !== (post.recurrence_type || 'days') ||
                          recurrenceEndType !== (post.recurrence_end_type || 'infinite') ||
                          recurrenceEndCount !== (post.recurrence_end_count || 5) ||
                          recurrenceEndDate !== (post.recurrence_end_date || '') ||
                          recurrenceFixedDay !== (post.recurrence_fixed_day || '') ||
                          recurrenceIsLastDay !== (post.recurrence_is_last_day || false);

    const isPinnedDirty = isPinned !== (post.is_pinned || false);

    const isFirstCommentDirty = firstCommentEnabled !== Boolean(post.first_comment_text) ||
                                firstCommentText !== (post.first_comment_text || '');
                          
    const isDirty = basicIsDirty || isCyclicDirty || isPinnedDirty || isFirstCommentDirty;


    // Синхронизация: если выбрана публикация "сейчас", а дата уходит в будущее,
    // переключаемся обратно на системную публикацию, чтобы избежать путаницы.
    useEffect(() => {
        if (isFutureDate && publicationMethod === 'now') {
            setPublicationMethod('system');
        }
    }, [isFutureDate, publicationMethod]);

    useEffect(() => {
        // При переключении на "опубликовать сейчас" нужно выключить режим массового создания и цикличности
        if (publicationMethod === 'now') {
            setIsBulkMode(false);
            setIsCyclic(false);
        }
        // При переключении на "VK", цикличность недоступна, первый комментарий тоже
        if (publicationMethod === 'vk') {
             setIsCyclic(false);
             setFirstCommentEnabled(false);
             setFirstCommentText('');
        }
    }, [publicationMethod, isBulkMode, setIsBulkMode]);
    
    // Блокируем массовое создание, если включена цикличность
    useEffect(() => {
        if (isCyclic && isBulkMode) {
            setIsBulkMode(false);
        }
    }, [isCyclic, isBulkMode, setIsBulkMode]);

    return {
        formState: {
            publicationMethod,
            editedText,
            editedImages,
            editedAttachments,
            isBulkMode,
            dateSlots,
            isMultiProjectMode,
            selectedProjectIds,
            isDirty,
            isFutureDate,
            // Cyclic
            isCyclic,
            recurrenceInterval,
            recurrenceType,
            recurrenceEndType,
            recurrenceEndCount,
            recurrenceEndDate,
            recurrenceFixedDay,
            recurrenceIsLastDay,
            // Pin
            isPinned,
            // First Comment
            firstCommentEnabled,
            firstCommentText,
            // AI Multi
            isAiMultiMode,
            selectedAiTurn,
            // Сдвиг времени при мультипроектной публикации
            timeShiftEnabled,
            timeShiftDays,
            timeShiftHours,
            timeShiftMinutes,
            orderedProjectIds,
            // Индивидуальные даты проектов
            projectDateTimes,
            customOverrideIds,
        },
        formActions: {
            setPublicationMethod,
            setEditedText,
            setEditedImages,
            setEditedAttachments,
            setIsBulkMode,
            setIsMultiProjectMode,
            setSelectedProjectIds,
            handleAddDateSlot,
            handleRemoveDateSlot,
            handleDateSlotChange,
            // Cyclic
            setIsCyclic,
            setRecurrenceInterval,
            setRecurrenceType,
            setRecurrenceEndType,
            setRecurrenceEndCount,
            setRecurrenceEndDate,
            setRecurrenceFixedDay,
            setRecurrenceIsLastDay,
            // Pin
            setIsPinned,
            // First Comment
            setFirstCommentEnabled,
            setFirstCommentText,
            // AI Multi
            setIsAiMultiMode,
            setSelectedAiTurn,
            // Сдвиг времени при мультипроектной публикации
            handleToggleTimeShift,
            setTimeShiftDays,
            setTimeShiftHours,
            setTimeShiftMinutes,
            reorderProjects,
            // Индивидуальные даты проектов
            setProjectDateTime,
            resetProjectDateTime,
        },
        // Хранилище видеофайлов для мультипроектной перезагрузки
        videoFilesRef,
        storeVideoFile,
        removeVideoFile,
    };
};