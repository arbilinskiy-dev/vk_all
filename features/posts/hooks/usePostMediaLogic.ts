
import React, { useState, useRef, useEffect, useCallback, DragEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as api from '../../../services/api';
import { PhotoAttachment, Photo } from '../../../shared/types';
import { UploadingFile } from '../components/modals/media/types';
import { PostMediaSectionProps } from '../components/modals/media/types';

// Параметры хука — пропсы основного компонента
type UsePostMediaLogicParams = Pick<
    PostMediaSectionProps,
    'mode' | 'editedImages' | 'onImagesChange' | 'onUploadStateChange' | 'onAttachmentsChange' | 'projectId' | 'collapsible' | 'onVideoFileStored'
>;

export function usePostMediaLogic({
    mode,
    editedImages,
    onImagesChange,
    onUploadStateChange,
    onAttachmentsChange,
    projectId,
    collapsible = false,
    onVideoFileStored,
}: UsePostMediaLogicParams) {
    // ─── State ───
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Состояние загрузки видео (отдельно от фото, т.к. видео попадает в attachments)
    const [isVideoUploading, setIsVideoUploading] = useState(false);
    const [videoUploadError, setVideoUploadError] = useState<string | null>(null);

    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [filesToConfirm, setFilesToConfirm] = useState<File[]>([]);
    
    // Состояние для сортировки (индекс перетаскиваемого элемента)
    const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
    
    const [previewImage, setPreviewImage] = useState<PhotoAttachment | null>(null);

    const [hoveredImage, setHoveredImage] = useState<{ url: string; rect: DOMRect } | null>(null);
    const [isExitingPreview, setIsExitingPreview] = useState(false);

    // ─── Refs ───
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    // AbortController для возможности отмены загрузки видео пользователем
    const videoUploadAbortRef = useRef<AbortController | null>(null);
    const dragCounter = useRef(0);
    const exitTimeoutRef = useRef<number | null>(null);

    // ─── Derived state ───
    const isEditable = mode === 'edit' || mode === 'copy';
    const totalItems = editedImages.length + uploadingFiles.length;
    const COLLAPSE_LIMIT = 4;
    const shouldCollapse = collapsible && !isExpanded && totalItems > COLLAPSE_LIMIT;
    const hiddenCount = totalItems - (COLLAPSE_LIMIT - 1);

    // ─── Effects ───
    useEffect(() => {
        const currentlyUploading = uploadingFiles.some(f => f.status === 'uploading') || isVideoUploading;
        onUploadStateChange(currentlyUploading);
    }, [uploadingFiles, isVideoUploading, onUploadStateChange]);

    // ─── Handlers: загрузка фото ───
    const uploadFiles = useCallback((files: File[]) => {
        files.forEach(file => {
            const tempId = uuidv4();
            const newUpload: UploadingFile = { tempId, status: 'uploading', file };
            
            setUploadingFiles(prev => [...prev, newUpload]);

            api.uploadPhoto(file, projectId)
                .then(newPhotoAttachment => {
                    onImagesChange(prev => [...prev, newPhotoAttachment]);
                    setUploadingFiles(prev => prev.filter(f => f.tempId !== tempId));
                })
                .catch(error => {
                    const errorMessage = error instanceof Error ? error.message : 'Ошибка';
                    setUploadingFiles(prev => prev.map(f => 
                        f.tempId === tempId 
                          ? { ...f, status: 'failed', error: errorMessage }
                          : f
                    ));
                    setTimeout(() => {
                        setUploadingFiles(prev => prev.filter(f => f.tempId !== tempId));
                    }, 5000);
                });
        });
    }, [projectId, onImagesChange]);

    const handleAddImagesFromGallery = (photos: Photo[]) => {
        onImagesChange(currentImages => {
            const existingIds = new Set(currentImages.map(img => img.id));
            const newAttachments: PhotoAttachment[] = photos
                .map(photo => ({ id: `photo${photo.id}`, url: photo.url, type: 'photo' as const }))
                .filter(attachment => !existingIds.has(attachment.id));

            return [...currentImages, ...newAttachments];
        });
        setIsGalleryOpen(false);
    };
    
    const handleRemoveItem = (idToRemove: string) => {
        onImagesChange(prev => prev.filter(item => item.id !== idToRemove));
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;
        uploadFiles(files);
        if (event.target) event.target.value = '';
    };

    // ─── Handlers: загрузка видео ───
    const uploadVideoFile = useCallback((file: File) => {
        // Создаём AbortController для возможности отмены
        const abortController = new AbortController();
        videoUploadAbortRef.current = abortController;
        
        setIsVideoUploading(true);
        setVideoUploadError(null);

        api.uploadVideo(file, projectId, abortController.signal)
            .then(videoAttachment => {
                videoUploadAbortRef.current = null;
                // Видео добавляется в attachments (не в images)
                onAttachmentsChange(prev => [...prev, videoAttachment]);
                // Сохраняем оригинальный File для мультипроектной перезагрузки
                onVideoFileStored?.(videoAttachment.id, file);
                setIsVideoUploading(false);
            })
            .catch(error => {
                videoUploadAbortRef.current = null;
                const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки видео';
                // Если отменено пользователем — не показываем ошибку
                if (abortController.signal.aborted) {
                    setIsVideoUploading(false);
                    return;
                }
                setVideoUploadError(errorMessage);
                setIsVideoUploading(false);
                // Автоматически скрываем ошибку через 5 секунд
                setTimeout(() => setVideoUploadError(null), 5000);
            });
    }, [projectId, onAttachmentsChange, onVideoFileStored]);

    // Отмена загрузки видео пользователем
    const cancelVideoUpload = useCallback(() => {
        if (videoUploadAbortRef.current) {
            videoUploadAbortRef.current.abort();
            videoUploadAbortRef.current = null;
        }
    }, []);

    const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;
        // Загружаем только первый файл (видео загружаются по одному)
        uploadVideoFile(files[0]);
        if (event.target) event.target.value = '';
    };

    // ─── Handlers: DnD для загрузки файлов ───
    const handleContainerDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        // Если мы перетаскиваем внутренний элемент (картинку), не включаем режим загрузки
        if (draggedImageIndex !== null) return;
        
        dragCounter.current++;
        if (isEditable && e.dataTransfer.items?.length > 0) setIsDraggingOver(true);
    };

    const handleContainerDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        if (draggedImageIndex !== null) return;

        dragCounter.current--;
        if (dragCounter.current === 0) setIsDraggingOver(false);
    };

    const handleContainerDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
    };

    const handleContainerDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation();
        if (draggedImageIndex !== null) return; // Если это сортировка, игнорируем дроп контейнера

        dragCounter.current = 0;
        if (!isEditable) return;
        setIsDraggingOver(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        // Разделяем файлы на изображения и видео
        const imageFiles = droppedFiles.filter((file: File) => file.type.startsWith('image/'));
        const videoFiles = droppedFiles.filter((file: File) => file.type.startsWith('video/'));
        
        // Изображения — через модалку подтверждения
        if (imageFiles.length > 0) setFilesToConfirm(imageFiles);
        // Видео — загружаем сразу (по одному)
        if (videoFiles.length > 0) {
            uploadVideoFile(videoFiles[0]);
        }
    };
    
    const handleConfirmUpload = () => {
        uploadFiles(filesToConfirm);
        setFilesToConfirm([]);
    };

    // ─── Handlers: DnD для сортировки картинок ───
    const handleItemDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedImageIndex(index);
        // Необходимый хак для Firefox, чтобы drag работал
        e.dataTransfer.effectAllowed = "move"; 
    };

    const handleItemDragOver = (e: React.DragEvent<HTMLDivElement>, _index: number) => {
        e.preventDefault();
        // Можно добавить визуальный эффект (например, смещение)
    };

    const handleItemDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (draggedImageIndex === null || draggedImageIndex === targetIndex) {
            setDraggedImageIndex(null);
            return;
        }

        const newImages = [...editedImages];
        const [movedItem] = newImages.splice(draggedImageIndex, 1);
        newImages.splice(targetIndex, 0, movedItem);

        onImagesChange(newImages);
        setDraggedImageIndex(null);
    };

    // ─── Handlers: Hover-предпросмотр ───
    const handleImageMouseEnter = (e: React.MouseEvent<HTMLDivElement>, url: string) => {
        if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
        setIsExitingPreview(false);
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        setHoveredImage({ url, rect });
    };

    const handleImageMouseLeave = () => {
        setIsExitingPreview(true);
        exitTimeoutRef.current = window.setTimeout(() => {
            setHoveredImage(null);
            setIsExitingPreview(false);
        }, 300);
    };

    // ─── Return ───
    return {
        state: {
            isGalleryOpen,
            uploadingFiles,
            isExpanded,
            isVideoUploading,
            videoUploadError,
            isDraggingOver,
            filesToConfirm,
            previewImage,
            hoveredImage,
            isExitingPreview,
            isEditable,
            totalItems,
            shouldCollapse,
            hiddenCount,
            COLLAPSE_LIMIT,
        },
        actions: {
            setIsGalleryOpen,
            setIsExpanded,
            setPreviewImage,
            setFilesToConfirm,
            uploadFiles,
            handleAddImagesFromGallery,
            handleRemoveItem,
            handleFileSelect,
            handleVideoSelect,
            uploadVideoFile,
            cancelVideoUpload,
            handleContainerDragEnter,
            handleContainerDragLeave,
            handleContainerDragOver,
            handleContainerDrop,
            handleConfirmUpload,
            handleItemDragStart,
            handleItemDragOver,
            handleItemDrop,
            handleImageMouseEnter,
            handleImageMouseLeave,
        },
        refs: {
            fileInputRef,
            videoInputRef,
        },
    };
}
