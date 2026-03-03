/**
 * API-модуль для работы со списками промокодов.
 * CRUD для списков и промокодов + получение переменных для шаблонов.
 */

import { callApi } from '../../shared/utils/apiClient';

// --- Типы ---

/** Один промокод */
export interface PromoCode {
    id: string;
    promo_list_id: string;
    code: string;
    description: string | null;
    status: 'free' | 'issued';
    issued_to_user_id: number | null;
    issued_to_user_name: string | null;
    issued_at: string | null;
    issued_in_project_id: string | null;
    issued_message_id: string | null;
    sort_order: number;
    created_at: string | null;
}

/** Список промокодов */
export interface PromoList {
    id: string;
    project_id: string;
    name: string;
    slug: string;
    is_one_time: boolean;
    created_at: string | null;
    updated_at: string | null;
    total_count: number;
    free_count: number;
    issued_count: number;
}

/** Данные для создания списка */
export interface PromoListCreate {
    name: string;
    slug: string;
    is_one_time: boolean;
}

/** Данные для обновления списка */
export interface PromoListUpdate {
    name?: string;
    slug?: string;
    is_one_time?: boolean;
}

/** Данные для создания одного промокода */
export interface PromoCodeCreate {
    code: string;
    description?: string;
}

/** Ответ со списком промокодов */
export interface PromoCodesListResponse {
    codes: PromoCode[];
    total: number;
    free_count: number;
    issued_count: number;
}

/** Информация о переменной промокода для шаблонов */
export interface PromoVariableInfo {
    list_name: string;
    slug: string;
    code_variable: string;
    description_variable: string;
    free_count: number;
}

// --- API: Списки ---

/** Получить все списки промокодов проекта */
export const getPromoLists = async (projectId: string): Promise<PromoList[]> => {
    return callApi<PromoList[]>('promo-lists/list', { projectId });
};

/** Создать список промокодов */
export const createPromoList = async (projectId: string, data: PromoListCreate): Promise<PromoList> => {
    return callApi<PromoList>('promo-lists/create', { projectId, data });
};

/** Обновить список промокодов */
export const updatePromoList = async (listId: string, data: PromoListUpdate): Promise<PromoList> => {
    return callApi<PromoList>('promo-lists/update', { listId, data });
};

/** Удалить список промокодов */
export const deletePromoList = async (listId: string): Promise<{ success: boolean }> => {
    return callApi<{ success: boolean }>('promo-lists/delete', { listId });
};

// --- API: Промокоды ---

/** Получить промокоды списка */
export const getPromoCodes = async (
    promoListId: string,
    statusFilter?: string | null,
): Promise<PromoCodesListResponse> => {
    return callApi<PromoCodesListResponse>('promo-lists/codes/list', {
        promoListId,
        statusFilter: statusFilter || null,
    });
};

/** Добавить промокоды в список (bulk) */
export const addPromoCodes = async (
    promoListId: string,
    codes: PromoCodeCreate[],
): Promise<{ success: boolean; added_count: number }> => {
    return callApi<{ success: boolean; added_count: number }>('promo-lists/codes/add', {
        promoListId,
        codes,
    });
};

/** Удалить один промокод */
export const deletePromoCode = async (codeId: string): Promise<{ success: boolean }> => {
    return callApi<{ success: boolean }>('promo-lists/codes/delete', { codeId });
};

/** Удалить все свободные промокоды */
export const deleteAllFreeCodes = async (promoListId: string): Promise<{ success: boolean; deleted_count: number }> => {
    return callApi<{ success: boolean; deleted_count: number }>('promo-lists/codes/delete-all-free', { promoListId });
};

// --- API: Переменные ---

/** Получить доступные переменные промокодов для шаблонов */
export const getPromoVariables = async (projectId: string): Promise<PromoVariableInfo[]> => {
    return callApi<PromoVariableInfo[]>('promo-lists/variables', { projectId });
};
