/**
 * usePromocodesTabLogic — вся логика вкладки «Промокоды».
 * Стейт, memo, обработчики — всё здесь. Компоненты получают state/actions через props.
 */

import { useState, useMemo, useCallback } from 'react';
import { usePromoLists } from '../../hooks/usePromoLists';
import { PromoList, PromoCodeCreate } from '../../../../services/api/promo_lists.api';

/** Режим работы панели */
export type TabMode = 'lists' | 'codes' | 'create-list' | 'edit-list' | 'add-codes';

interface UsePromocodesTabLogicProps {
    projectId: string | null;
}

export function usePromocodesTabLogic({ projectId }: UsePromocodesTabLogicProps) {
    const promoLists = usePromoLists({ projectId });
    const {
        lists,
        isLoadingLists,
        listsError,
        createList,
        updateList,
        removeList,
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
        isSaving,
        variables,
    } = promoLists;

    // === Состояние UI ===
    const [mode, setMode] = useState<TabMode>('lists');
    const [editingList, setEditingList] = useState<PromoList | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // --- Форма создания/редактирования списка ---
    const [formName, setFormName] = useState('');
    const [formSlug, setFormSlug] = useState('');
    const [formOneTime, setFormOneTime] = useState(true);

    // --- Форма добавления промокодов ---
    const [bulkText, setBulkText] = useState('');

    // --- Модалки подтверждения ---
    const [confirmDeleteList, setConfirmDeleteList] = useState<string | null>(null);
    const [confirmDeleteCode, setConfirmDeleteCode] = useState<string | null>(null);
    const [confirmDeleteAllFree, setConfirmDeleteAllFree] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Текущий выбранный список ---
    const selectedList = useMemo(
        () => lists.find(l => l.id === selectedListId) || null,
        [lists, selectedListId]
    );

    // --- Фильтрация списков по поиску ---
    const filteredLists = useMemo(() => {
        if (!searchQuery.trim()) return lists;
        const q = searchQuery.toLowerCase();
        return lists.filter(l => l.name.toLowerCase().includes(q) || l.slug.toLowerCase().includes(q));
    }, [lists, searchQuery]);

    // --- Авто-генерация slug из названия ---
    const generateSlug = useCallback((name: string) => {
        return name
            .toLowerCase()
            .replace(/[а-яё]/g, (char) => {
                const map: Record<string, string> = {
                    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
                    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
                    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
                    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
                    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
                };
                return map[char] || char;
            })
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '')
            .substring(0, 30);
    }, []);

    // === Обработчики: Списки ===
    const handleCreateList = useCallback(() => {
        setEditingList(null);
        setFormName('');
        setFormSlug('');
        setFormOneTime(true);
        setMode('create-list');
    }, []);

    const handleEditList = useCallback((list: PromoList) => {
        setEditingList(list);
        setFormName(list.name);
        setFormSlug(list.slug);
        setFormOneTime(list.is_one_time);
        setMode('edit-list');
    }, []);

    const handleSaveList = useCallback(async () => {
        if (!formName.trim() || !formSlug.trim()) return;
        try {
            if (editingList) {
                await updateList(editingList.id, { name: formName, slug: formSlug, is_one_time: formOneTime });
            } else {
                await createList({ name: formName, slug: formSlug, is_one_time: formOneTime });
            }
            setMode('lists');
            setEditingList(null);
        } catch (err: any) {
            alert(err?.message || 'Ошибка сохранения');
        }
    }, [formName, formSlug, formOneTime, editingList, createList, updateList]);

    const handleDeleteList = useCallback(async (listId: string) => {
        setIsDeleting(true);
        try {
            await removeList(listId);
            setMode('lists');
        } catch { /* ошибка в хуке */ } finally {
            setIsDeleting(false);
            setConfirmDeleteList(null);
        }
    }, [removeList]);

    const handleOpenCodes = useCallback((list: PromoList) => {
        selectList(list.id);
        setMode('codes');
    }, [selectList]);

    const handleBackToLists = useCallback(() => {
        selectList(null);
        setMode('lists');
    }, [selectList]);

    // === Обработчики: Промокоды ===
    const handleAddCodesMode = useCallback(() => {
        setBulkText('');
        setMode('add-codes');
    }, []);

    const handleSaveCodes = useCallback(async () => {
        if (!selectedListId || !bulkText.trim()) return;
        // Парсим: каждая строка — "код;описание" или просто "код"
        const lines = bulkText.split('\n').filter(l => l.trim());
        const codesData: PromoCodeCreate[] = lines.map(line => {
            const parts = line.split(';');
            return {
                code: parts[0]?.trim() || '',
                description: parts[1]?.trim() || '',
            };
        }).filter(c => c.code);

        if (codesData.length === 0) return;

        try {
            await addCodes(selectedListId, codesData);
            setMode('codes');
            setBulkText('');
        } catch (err: any) {
            alert(err?.message || 'Ошибка добавления');
        }
    }, [selectedListId, bulkText, addCodes]);

    const handleDeleteCode = useCallback(async (codeId: string) => {
        setIsDeleting(true);
        try {
            await removeCode(codeId);
        } catch { /* ошибка в хуке */ } finally {
            setIsDeleting(false);
            setConfirmDeleteCode(null);
        }
    }, [removeCode]);

    const handleDeleteAllFree = useCallback(async (listId: string) => {
        setIsDeleting(true);
        try {
            await removeAllFree(listId);
        } catch { /* ошибка в хуке */ } finally {
            setIsDeleting(false);
            setConfirmDeleteAllFree(null);
        }
    }, [removeAllFree]);

    // === Возвращаем state + actions ===
    return {
        state: {
            mode,
            lists,
            filteredLists,
            isLoadingLists,
            listsError,
            selectedList,
            selectedListId,
            codes,
            codesResponse,
            isLoadingCodes,
            statusFilter,
            isSaving,
            variables,
            editingList,
            searchQuery,
            formName,
            formSlug,
            formOneTime,
            bulkText,
            confirmDeleteList,
            confirmDeleteCode,
            confirmDeleteAllFree,
            isDeleting,
        },
        actions: {
            setMode,
            setSearchQuery,
            setFormName,
            setFormSlug,
            setFormOneTime,
            setBulkText,
            setStatusFilter,
            setConfirmDeleteList,
            setConfirmDeleteCode,
            setConfirmDeleteAllFree,
            generateSlug,
            handleCreateList,
            handleEditList,
            handleSaveList,
            handleDeleteList,
            handleOpenCodes,
            handleBackToLists,
            handleAddCodesMode,
            handleSaveCodes,
            handleDeleteCode,
            handleDeleteAllFree,
        },
    };
}
