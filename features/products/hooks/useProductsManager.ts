import { useMemo, useState, useCallback } from 'react';
import { useProductData } from './useProductData';
import { useProductFiltering } from './useProductFiltering';
import { useProductSelection } from './useProductSelection';
import { useProductEditing } from './useProductEditing';
import { useProductSaving } from './useProductSaving';
import { useProductModals } from './useProductModals';
import { useProductAI } from './useProductAI';
import { useProductBulkActions } from './useProductBulkActions';
import * as api from '../../../services/api';
import { NewProductRow } from '../types';
import { MarketItem } from '../../../shared/types';

/**
 * Главный композитный хук ("хаб") для вкладки "Товары".
 */
export const useProductsManager = (projectId: string) => {
    // 1. Управление данными
    const { dataState, dataActions } = useProductData(projectId);

    // 2. Управление фильтрацией
    // FIX: Изменено dataState.columns на dataState.albums, так как dataState не содержит columns, а useProductFiltering ожидает список альбомов вторым аргументом.
    const { filterState, filterActions } = useProductFiltering(dataState.items, dataState.albums);
    
    // 3. Управление режимом выбора
    const { selectionState, selectionActions } = useProductSelection(filterState.filteredItems);

    // 4. Управление редактированием
    const { editingState, editingActions } = useProductEditing();

    // 5. Управление модальными окнами
    const { modalState, modalActions } = useProductModals();

    // 6. Управление логикой сохранения
    const { savingState, savingActions } = useProductSaving({
        projectId,
        items: dataState.items,
        albums: dataState.albums,
        editedItems: editingState.editedItems,
        pendingPhotos: editingState.pendingPhotos,
        itemsToDelete: editingState.itemsToDelete,
        setItems: dataActions.setItems,
        setAlbums: dataActions.setAlbums,
        setEditedItems: editingActions.setEditedItems,
        setPendingPhotos: editingActions.setPendingPhotos,
        setItemsToDelete: editingActions.setItemsToDelete,
        setCachedData: dataActions.setCachedData,
        setItemToSave: modalActions.setItemToSave,
        setSaveResult: modalActions.setSaveResult,
        setValidationErrors: editingActions.setValidationErrors,
    });
    
    // 7. Управление AI-логикой
    const { aiState, aiActions } = useProductAI({
        projectId,
        items: dataState.items,
        selectedItemIds: selectionState.selectedItemIds,
        setAiSuggestionState: modalActions.setAiSuggestionState,
    });

    // 8. Управление массовыми операциями
    const { bulkActions } = useProductBulkActions({
        items: dataState.items,
        selectedItemIds: selectionState.selectedItemIds,
        editedItems: editingState.editedItems,
        setEditedItems: editingActions.setEditedItems,
        setItems: dataActions.setItems,
        setAlbums: dataActions.setAlbums,
        modalActions,
        aiActions,
        selectionActions,
    });
    
    // Новая логика для загрузки файлов с маппингом
    const [fileGrid, setFileGrid] = useState<string[][] | null>(null);
    const [isFileMappingModalOpen, setIsFileMappingModalOpen] = useState(false);
    const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
    const [newAlbumTitle, setNewAlbumTitle] = useState('');
    const [isRefreshingCategories, setIsRefreshingCategories] = useState(false);
    // Состояние для редактирования подборки (инлайн)
    const [editingAlbumId, setEditingAlbumId] = useState<number | null>(null);
    const [editingAlbumTitle, setEditingAlbumTitle] = useState('');
    // Защита от двойных нажатий при операциях с подборками
    const [isSavingAlbum, setIsSavingAlbum] = useState(false);

    const handleCreateAlbum = async () => {
        if (!newAlbumTitle.trim() || isSavingAlbum) return;
        setIsSavingAlbum(true);
        try {
            const newAlbum = await api.createMarketAlbum(projectId, newAlbumTitle);
            setIsCreatingAlbum(false);
            setNewAlbumTitle('');
            dataActions.setAlbums(prev => [...prev, newAlbum]);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Произошла ошибка';
            window.showAppToast?.(`Не удалось создать подборку: ${msg}`, 'error');
            await dataActions.handleRefreshAll();
        } finally {
            setIsSavingAlbum(false);
        }
    };

    // Начать инлайн-редактирование подборки
    const handleStartEditAlbum = (albumId: number, currentTitle: string) => {
        setEditingAlbumId(albumId);
        setEditingAlbumTitle(currentTitle);
    };

    // Сохранить новое название подборки
    const handleSaveEditAlbum = async () => {
        if (!editingAlbumId || !editingAlbumTitle.trim() || isSavingAlbum) return;
        setIsSavingAlbum(true);
        try {
            const updatedAlbum = await api.editMarketAlbum(projectId, editingAlbumId, editingAlbumTitle.trim());
            dataActions.setAlbums(prev => prev.map(a => a.id === editingAlbumId ? updatedAlbum : a));
            setEditingAlbumId(null);
            setEditingAlbumTitle('');
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Произошла ошибка';
            window.showAppToast?.(`Не удалось переименовать подборку: ${msg}`, 'error');
        } finally {
            setIsSavingAlbum(false);
        }
    };

    // Отменить редактирование подборки
    const handleCancelEditAlbum = () => {
        setEditingAlbumId(null);
        setEditingAlbumTitle('');
    };

    // Удалить подборку
    const handleDeleteAlbum = async (albumId: number) => {
        try {
            await api.deleteMarketAlbum(projectId, albumId);
            dataActions.setAlbums(prev => prev.filter(a => a.id !== albumId));
            // Если удалённая подборка была активным фильтром — сбрасываем на "Все"
            if (filterState.activeAlbumId === String(albumId)) {
                filterActions.setActiveAlbumId('all');
            }
            window.showAppToast?.('Подборка удалена', 'success');
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Произошла ошибка';
            window.showAppToast?.(`Не удалось удалить подборку: ${msg}`, 'error');
        }
    };

    const handleCreateSingleProduct = async (productData: any) => {
        try {
            const { photoFile, photoUrl, useDefaultImage, ...itemData } = productData;
            const newItem = await api.createMarketItem(projectId, itemData, photoFile, photoUrl, useDefaultImage);
            
            // Показываем предупреждение, если фото было автоматически увеличено
            if (newItem.photo_resized_warning) {
                window.showAppToast?.(newItem.photo_resized_warning, 'warning');
            }
            
            modalActions.setIsCreateSingleModalOpen(false);
            modalActions.setItemToCopy(null);
            dataActions.setItems(prev => [newItem, ...prev]);
            // Обновляем все данные с сервера для актуализации счётчиков подборок
            dataActions.handleRefreshAll().catch(err => {
                console.error('Не удалось обновить данные после создания товара:', err);
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Произошла ошибка';
            window.showAppToast?.(`Не удалось создать товар: ${msg}`, 'error');
        }
    };

    const handleCreateMultipleProducts = async (
        productsData: NewProductRow[],
        onProgress?: (progress: { current: number; total: number; currentName: string; status: 'processing' | 'done' | 'error' }) => void,
        signal?: AbortSignal
    ): Promise<{ successfulTempIds: string[], failed: { tempId: string, error: string }[] }> => {
        const successfulTempIds: string[] = [];
        const failed: { tempId: string, error: string }[] = [];
        const newItems: MarketItem[] = [];
        let resizedPhotosCount = 0;

        for (let i = 0; i < productsData.length; i++) {
            // Проверяем, не была ли отменена операция
            if (signal?.aborted) {
                // Все оставшиеся товары помечаем как отменённые
                for (let j = i; j < productsData.length; j++) {
                    failed.push({ tempId: productsData[j].tempId, error: 'Отменено пользователем' });
                }
                break;
            }

            const row = productsData[i];
            const currentName = row.title || `Товар ${i + 1}`;
            
            // Сообщаем о начале обработки текущего товара
            onProgress?.({
                current: i + 1,
                total: productsData.length,
                currentName,
                status: 'processing'
            });

            try {
                const itemPayload = {
                    name: row.title!,
                    description: row.description!,
                    price: Number(row.price),
                    old_price: row.old_price ? Number(row.old_price) : undefined,
                    sku: row.sku,
                    categoryId: row.category?.id, 
                    albumId: row.album_ids?.[0],
                    photoUrl: !row.photoFile ? row.photoUrl : undefined,
                    useDefaultImage: row.useDefaultImage
                };

                const createdItem = await api.createMarketItem(projectId, itemPayload, row.photoFile, itemPayload.photoUrl, row.useDefaultImage);
                newItems.push(createdItem);
                successfulTempIds.push(row.tempId);
                
                // Собираем предупреждения о ресайзе фото
                if (createdItem.photo_resized_warning) {
                    resizedPhotosCount++;
                }
                
                // Сообщаем об успехе
                onProgress?.({
                    current: i + 1,
                    total: productsData.length,
                    currentName,
                    status: 'done'
                });
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Неизвестная ошибка';
                failed.push({ tempId: row.tempId, error: errorMsg });
                
                // Сообщаем об ошибке
                onProgress?.({
                    current: i + 1,
                    total: productsData.length,
                    currentName,
                    status: 'error'
                });
            }
        }
        
        if (newItems.length > 0) {
            // Сначала добавляем товары локально для мгновенного отображения
            dataActions.setItems(prev => [...newItems, ...prev]);
            // Затем обновляем все данные с сервера — для актуализации счётчиков подборок
            dataActions.handleRefreshAll().catch(err => {
                console.error('Не удалось обновить данные после создания товаров:', err);
            });
        }
        
        // Показываем предупреждение о ресайзе фото одним сообщением в конце
        if (resizedPhotosCount > 0) {
            window.showAppToast?.(
                `У ${resizedPhotosCount} товаров фото были меньше 400×400 px и были автоматически увеличены. Качество могло пострадать — проверьте результат.`,
                'warning'
            );
        }
        
        return { successfulTempIds, failed };
    };
    
    const handleSingleDescriptionCorrection = (itemId: number, currentDescription: string) => {
        return aiActions.handleAiCorrectSingleDescription(itemId, currentDescription);
    };
    
    const handleBulkUpdateFromFile = (updates: Record<number, Partial<MarketItem>>) => {
        editingActions.setEditedItems(prev => {
            const newEdits = { ...prev };
            for (const itemIdStr in updates) {
                const itemId = Number(itemIdStr);
                const originalItem = dataState.items.find(i => i.id === itemId);
                if (originalItem) {
                    newEdits[itemId] = { ...(prev[itemId] || {}), ...updates[itemId] };
                }
            }
            return newEdits;
        });
        filterActions.setActiveAlbumId('all');
    };

    const handleRefreshAll = useCallback(async () => {
        editingActions.setEditedItems({});
        editingActions.setPendingPhotos({});
        editingActions.setItemsToDelete(new Set());
        editingActions.setValidationErrors({});
        selectionActions.clearSelection();
        await dataActions.handleRefreshAll();
    }, [editingActions, selectionActions, dataActions]);
    
    const handleRefreshCategories = useCallback(async () => {
        setIsRefreshingCategories(true);
        try {
            await api.refreshMarketCategories();
        } catch (error) {
            console.error("Failed to refresh categories:", error);
            window.showAppToast?.(`Не удалось обновить категории: ${error instanceof Error ? error.message : 'Ошибка'}`, 'error');
        } finally {
            setIsRefreshingCategories(false);
        }
    }, []);

    const state = useMemo(() => ({
        ...dataState,
        ...filterState,
        ...selectionState,
        ...editingState,
        ...savingState,
        ...modalState,
        ...aiState,
        isCreatingAlbum,
        newAlbumTitle,
        isRefreshingCategories,
        editingAlbumId,
        editingAlbumTitle,
        isSavingAlbum,
        fileGrid,
        isFileMappingModalOpen
    }), [dataState, filterState, selectionState, editingState, savingState, modalState, aiState, isCreatingAlbum, newAlbumTitle, isRefreshingCategories, editingAlbumId, editingAlbumTitle, isSavingAlbum, fileGrid, isFileMappingModalOpen]);

    const actions = useMemo(() => ({
        ...dataActions,
        ...filterActions,
        ...selectionActions,
        ...editingActions,
        ...savingActions,
        ...modalActions,
        ...aiActions,
        ...bulkActions,
        setIsCreatingAlbum,
        setNewAlbumTitle,
        handleCreateAlbum,
        handleStartEditAlbum,
        handleSaveEditAlbum,
        handleCancelEditAlbum,
        setEditingAlbumTitle,
        handleDeleteAlbum,
        handleCreateSingleProduct,
        handleCreateMultipleProducts,
        onPhotoUrlChange: editingActions.handlePhotoUrlChange,
        onClearNewPhoto: editingActions.clearPendingPhoto,
        handleSingleDescriptionCorrection,
        handleBulkUpdateFromFile,
        handleRefreshAll,
        handleRefreshCategories,
        setFileGrid,
        setIsFileMappingModalOpen
    }), [dataActions, filterActions, selectionActions, editingActions, savingActions, modalActions, aiActions, bulkActions, handleSingleDescriptionCorrection, handleRefreshAll, handleRefreshCategories]);

    return { state, actions };
};
