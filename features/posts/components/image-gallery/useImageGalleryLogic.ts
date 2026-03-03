
import React, { useState, useEffect, useCallback, useRef, useMemo, DragEvent } from 'react';
import { Album, Photo } from '../../../../shared/types';
import * as api from '../../../../services/api';
import { v4 as uuidv4 } from 'uuid';
import { UploadingPhoto } from './types';

interface UseImageGalleryLogicParams {
    projectId: string;
}

export const useImageGalleryLogic = ({ projectId }: UseImageGalleryLogicParams) => {
    const [tab, setTab] = useState<'project' | 'agency'>('project');
    
    const [albums, setAlbums] = useState<Album[]>([]);
    const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
    const [isLoadingAlbums, setIsLoadingAlbums] = useState(false);
    const [albumError, setAlbumError] = useState<string | null>(null);
    const [isCreateAlbumModalOpen, setIsCreateAlbumModalOpen] = useState(false);

    const [photos, setPhotos] = useState<Photo[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [uploadingPhotos, setUploadingPhotos] = useState<UploadingPhoto[]>([]);
    
    const [selection, setSelection] = useState<Photo[]>([]);
    const [previewImage, setPreviewImage] = useState<Photo | null>(null);
    const [gridSize, setGridSize] = useState(3);
    
    // Drag & Drop State
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [filesToConfirm, setFilesToConfirm] = useState<File[]>([]);
    const dragCounter = useRef(0);
    
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const selectedAlbum = useMemo(() => albums.find(a => a.id === selectedAlbumId), [albums, selectedAlbumId]);

    // === ЗАГРУЗКА АЛЬБОМОВ ===
    const fetchAlbums = useCallback(async (isRefresh = false) => {
        if (tab === 'agency') {
            setAlbums([]);
            setSelectedAlbumId(null);
            setAlbumError("Галерея агентства пока не реализована.");
            return;
        }
        setIsLoadingAlbums(true);
        setAlbumError(null);
        try {
            const apiCall = isRefresh ? api.refreshAlbums : api.getAlbums;
            const newAlbums = await apiCall(projectId);
            setAlbums(newAlbums);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Не удалось загрузить альбомы.";
            setAlbumError(msg);
        } finally {
            setIsLoadingAlbums(false);
        }
    }, [projectId, tab]);

    useEffect(() => {
        fetchAlbums(false);
    }, [fetchAlbums]);

    // === ЗАГРУЗКА ФОТОГРАФИЙ ===
    const fetchPhotos = useCallback(async (albumId: string, forPage: number, isRefresh = false) => {
        if (!albumId) return;
        
        setIsLoadingPhotos(true);
        setPhotoError(null);
        try {
            const apiCall = isRefresh ? api.refreshPhotos : api.getPhotos;
            const { photos: newPhotos, hasMore: newHasMore } = await apiCall(projectId, albumId, forPage);
            
            setPhotos(prev => forPage === 1 ? newPhotos : [...prev, ...newPhotos]);
            setHasMore(newHasMore);
            setPage(forPage);

        } catch (err) {
            const msg = err instanceof Error ? err.message : "Не удалось загрузить фотографии.";
            setPhotoError(msg);
        } finally {
            setIsLoadingPhotos(false);
        }
    }, [projectId]);

    // === ПАГИНАЦИЯ (IntersectionObserver) ===
    const handleLoadMore = useCallback(() => {
        if (selectedAlbumId && !isLoadingPhotos && hasMore) {
            fetchPhotos(selectedAlbumId, page + 1);
        }
    }, [selectedAlbumId, isLoadingPhotos, hasMore, page, fetchPhotos]);
    
    useEffect(() => {
        if (isLoadingPhotos || !hasMore) return;
        const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) handleLoadMore(); }, { threshold: 1.0 });
        const currentRef = loadMoreRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, [handleLoadMore, hasMore, isLoadingPhotos]);

    // === НАВИГАЦИЯ ===
    const handleSelectAlbum = (albumId: string) => {
        setSelectedAlbumId(albumId);
        setPhotos([]);
        setPage(1);
        setHasMore(true);
        fetchPhotos(albumId, 1, false);
    };
    
    const handleBackToAlbums = () => {
        setSelectedAlbumId(null);
        setPhotos([]);
        setSelection([]);
    };
    
    const handleRefreshPhotos = useCallback((albumId: string) => {
        if (!isLoadingPhotos) {
            setPhotos([]);
            fetchPhotos(albumId, 1, true);
        }
    }, [isLoadingPhotos, fetchPhotos]);

    // === ВЫДЕЛЕНИЕ ФОТО ===
    const handleImageSelect = (photo: Photo) => {
        setSelection(prev => 
            prev.some(p => p.id === photo.id)
                ? prev.filter(p => p.id !== photo.id)
                : [...prev, photo]
        );
    };

    // === ЗАГРУЗКА ФАЙЛОВ В АЛЬБОМ ===
    const uploadFilesToAlbum = useCallback(async (files: File[]) => {
        if (!selectedAlbumId) return;
    
        const newUploads: UploadingPhoto[] = files.map(file => ({
            tempId: uuidv4(),
            file,
            status: 'uploading',
        }));
    
        setUploadingPhotos(prev => [...newUploads, ...prev]);
    
        const uploadPromises = newUploads.map(upload => 
            api.uploadPhotoToAlbum(upload.file, projectId, selectedAlbumId)
                .then(() => {
                    setUploadingPhotos(prev => prev.filter(u => u.tempId !== upload.tempId));
                })
                .catch(error => {
                    const errorMessage = error instanceof Error ? error.message : 'Ошибка';
                    setUploadingPhotos(prev => prev.map(u => u.tempId === upload.tempId ? { ...u, status: 'failed', error: errorMessage } : u));
                    setTimeout(() => {
                        setUploadingPhotos(prev => prev.filter(u => u.tempId !== upload.tempId));
                    }, 5000);
                })
        );
    
        await Promise.allSettled(uploadPromises);
        // Сначала обновляем список альбомов, чтобы получить актуальный `size`
        await fetchAlbums(true);
        // Затем обновляем фотографии в текущем альбоме, чтобы увидеть новые
        handleRefreshPhotos(selectedAlbumId);
    }, [projectId, selectedAlbumId, fetchAlbums, handleRefreshPhotos]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length > 0) {
            uploadFilesToAlbum(files);
        }
        if (event.target) event.target.value = '';
    };

    // === DRAG & DROP ===
    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (selectedAlbumId && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDraggingOver(true);
        }
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDraggingOver(false);
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current = 0;
        if (!selectedAlbumId) return;
        setIsDraggingOver(false);
        const droppedFiles = Array.from(e.dataTransfer.files).filter((file: File) => file.type.startsWith('image/'));
        if (droppedFiles.length > 0) {
            setFilesToConfirm(droppedFiles);
        }
    };
    
    const handleConfirmUpload = () => {
        uploadFilesToAlbum(filesToConfirm);
        setFilesToConfirm([]);
    };

    return {
        state: {
            tab, albums, selectedAlbumId, selectedAlbum,
            isLoadingAlbums, albumError, isCreateAlbumModalOpen,
            photos, hasMore, isLoadingPhotos, photoError, uploadingPhotos,
            selection, previewImage, gridSize,
            isDraggingOver, filesToConfirm,
        },
        actions: {
            setTab, setGridSize, setPreviewImage,
            setIsCreateAlbumModalOpen,
            fetchAlbums,
            handleSelectAlbum, handleBackToAlbums, handleRefreshPhotos,
            handleImageSelect, handleFileSelect,
            handleDragEnter, handleDragLeave, handleDragOver, handleDrop,
            handleConfirmUpload, setFilesToConfirm,
        },
        refs: {
            loadMoreRef, fileInputRef,
        },
    };
};
