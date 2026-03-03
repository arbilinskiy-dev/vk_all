/**
 * Хук для управления списками промокодов.
 * CRUD для списков и промокодов + состояние + фильтрация.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
    PromoList,
    PromoCode,
    PromoListCreate,
    PromoListUpdate,
    PromoCodeCreate,
    PromoCodesListResponse,
    PromoVariableInfo,
    getPromoLists,
    createPromoList,
    updatePromoList,
    deletePromoList,
    getPromoCodes,
    addPromoCodes,
    deletePromoCode,
    deleteAllFreeCodes,
    getPromoVariables,
} from '../../../services/api/promo_lists.api';

interface UsePromoListsParams {
    projectId: string | null;
}

export function usePromoLists({ projectId }: UsePromoListsParams) {
    // === Состояние списков ===
    const [lists, setLists] = useState<PromoList[]>([]);
    const [isLoadingLists, setIsLoadingLists] = useState(false);
    const [listsError, setListsError] = useState<string | null>(null);

    // === Состояние промокодов выбранного списка ===
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [codes, setCodes] = useState<PromoCode[]>([]);
    const [codesResponse, setCodesResponse] = useState<PromoCodesListResponse | null>(null);
    const [isLoadingCodes, setIsLoadingCodes] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // === Состояние переменных ===
    const [variables, setVariables] = useState<PromoVariableInfo[]>([]);

    // === Состояние операций ===
    const [isSaving, setIsSaving] = useState(false);

    // Предотвращаем загрузку данных для старого проекта
    const currentProjectIdRef = useRef(projectId);
    currentProjectIdRef.current = projectId;

    // --- Загрузка списков ---
    const loadLists = useCallback(async () => {
        if (!projectId) return;
        setIsLoadingLists(true);
        setListsError(null);
        try {
            const data = await getPromoLists(projectId);
            if (currentProjectIdRef.current === projectId) {
                setLists(data);
            }
        } catch (err) {
            console.error('[usePromoLists] Ошибка загрузки списков:', err);
            if (currentProjectIdRef.current === projectId) {
                setListsError('Не удалось загрузить списки промокодов');
            }
        } finally {
            if (currentProjectIdRef.current === projectId) {
                setIsLoadingLists(false);
            }
        }
    }, [projectId]);

    // Загрузка при смене проекта
    useEffect(() => {
        if (projectId) {
            loadLists();
            // Загружаем переменные
            getPromoVariables(projectId).then(setVariables).catch(() => {});
        } else {
            setLists([]);
            setVariables([]);
        }
        // Сброс выбранного списка
        setSelectedListId(null);
        setCodes([]);
        setCodesResponse(null);
    }, [projectId, loadLists]);

    // --- Загрузка промокодов выбранного списка ---
    const loadCodes = useCallback(async (listId?: string, filter?: string | null) => {
        const targetListId = listId || selectedListId;
        if (!targetListId) return;
        setIsLoadingCodes(true);
        try {
            const finalFilter = filter !== undefined ? filter : statusFilter;
            const data = await getPromoCodes(targetListId, finalFilter);
            setCodes(data.codes);
            setCodesResponse(data);
        } catch (err) {
            console.error('[usePromoLists] Ошибка загрузки промокодов:', err);
        } finally {
            setIsLoadingCodes(false);
        }
    }, [selectedListId, statusFilter]);

    // При смене выбранного списка или фильтра — перезагружаем промокоды
    useEffect(() => {
        if (selectedListId) {
            loadCodes(selectedListId, statusFilter);
        } else {
            setCodes([]);
            setCodesResponse(null);
        }
    }, [selectedListId, statusFilter]);

    // --- CRUD: Списки ---
    const createList = useCallback(async (data: PromoListCreate): Promise<PromoList | null> => {
        if (!projectId) return null;
        setIsSaving(true);
        try {
            const newList = await createPromoList(projectId, data);
            setLists(prev => [newList, ...prev]);
            // Обновляем переменные
            getPromoVariables(projectId).then(setVariables).catch(() => {});
            return newList;
        } catch (err) {
            console.error('[usePromoLists] Ошибка создания списка:', err);
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [projectId]);

    const updateList = useCallback(async (listId: string, data: PromoListUpdate): Promise<PromoList | null> => {
        setIsSaving(true);
        try {
            const updated = await updatePromoList(listId, data);
            setLists(prev => prev.map(l => l.id === listId ? updated : l));
            // Обновляем переменные (slug мог измениться)
            if (projectId) {
                getPromoVariables(projectId).then(setVariables).catch(() => {});
            }
            return updated;
        } catch (err) {
            console.error('[usePromoLists] Ошибка обновления списка:', err);
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [projectId]);

    const removeList = useCallback(async (listId: string): Promise<boolean> => {
        try {
            await deletePromoList(listId);
            setLists(prev => prev.filter(l => l.id !== listId));
            if (selectedListId === listId) {
                setSelectedListId(null);
                setCodes([]);
                setCodesResponse(null);
            }
            // Обновляем переменные
            if (projectId) {
                getPromoVariables(projectId).then(setVariables).catch(() => {});
            }
            return true;
        } catch (err) {
            console.error('[usePromoLists] Ошибка удаления списка:', err);
            throw err;
        }
    }, [selectedListId, projectId]);

    // --- CRUD: Промокоды ---
    const addCodes = useCallback(async (promoListId: string, codesData: PromoCodeCreate[]): Promise<number> => {
        setIsSaving(true);
        try {
            const result = await addPromoCodes(promoListId, codesData);
            // Перезагружаем промокоды и списки (чтобы обновились счётчики)
            await loadCodes(promoListId, statusFilter);
            await loadLists();
            return result.added_count;
        } catch (err) {
            console.error('[usePromoLists] Ошибка добавления промокодов:', err);
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [loadCodes, loadLists, statusFilter]);

    const removeCode = useCallback(async (codeId: string): Promise<boolean> => {
        try {
            await deletePromoCode(codeId);
            setCodes(prev => prev.filter(c => c.id !== codeId));
            // Обновляем счётчики в списках
            await loadLists();
            return true;
        } catch (err) {
            console.error('[usePromoLists] Ошибка удаления промокода:', err);
            throw err;
        }
    }, [loadLists]);

    const removeAllFree = useCallback(async (promoListId: string): Promise<number> => {
        try {
            const result = await deleteAllFreeCodes(promoListId);
            // Перезагружаем
            await loadCodes(promoListId, statusFilter);
            await loadLists();
            return result.deleted_count;
        } catch (err) {
            console.error('[usePromoLists] Ошибка удаления всех свободных:', err);
            throw err;
        }
    }, [loadCodes, loadLists, statusFilter]);

    // --- Выбор списка ---
    const selectList = useCallback((listId: string | null) => {
        setSelectedListId(listId);
        setStatusFilter(null);
    }, []);

    return {
        // Списки
        lists,
        isLoadingLists,
        listsError,
        createList,
        updateList,
        removeList,
        reloadLists: loadLists,

        // Промокоды
        selectedListId,
        selectList,
        codes,
        codesResponse,
        isLoadingCodes,
        statusFilter,
        setStatusFilter,
        addCodes,
        removeCode,
        removeAllFree,
        reloadCodes: loadCodes,

        // Переменные
        variables,

        // Общее
        isSaving,
    };
}
