/**
 * API-сервис для меток (ярлыков) диалогов.
 * CRUD меток + назначение/снятие с диалогов.
 */

import { API_BASE_URL } from '../../shared/config';

// =============================================================================
// Типы
// =============================================================================

/** Метка диалога */
export interface DialogLabel {
    id: string;
    project_id: string;
    name: string;
    color: string;
    sort_order: number;
    /** Количество диалогов с этой меткой */
    dialog_count: number;
    created_at: string | null;
}

/** Ответ списка меток */
export interface DialogLabelsListResponse {
    success: boolean;
    labels: DialogLabel[];
}

/** Ответ создания/обновления метки */
export interface DialogLabelResponse {
    success: boolean;
    label: DialogLabel;
}

// =============================================================================
// CRUD меток
// =============================================================================

/** Получить все метки проекта */
export async function getDialogLabels(projectId: string): Promise<DialogLabelsListResponse> {
    const params = new URLSearchParams({ project_id: projectId });
    const response = await fetch(`${API_BASE_URL}/dialog-labels/list?${params}`);
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Ошибка загрузки меток: ${response.status}`);
    }
    return response.json();
}

/** Создать метку */
export async function createDialogLabel(
    projectId: string,
    name: string,
    color: string = '#6366f1',
): Promise<DialogLabelResponse> {
    const response = await fetch(`${API_BASE_URL}/dialog-labels/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, name, color }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Ошибка создания метки: ${response.status}`);
    }
    return response.json();
}

/** Обновить метку */
export async function updateDialogLabel(
    labelId: string,
    data: { name?: string; color?: string; sort_order?: number },
): Promise<DialogLabelResponse> {
    const response = await fetch(`${API_BASE_URL}/dialog-labels/${labelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Ошибка обновления метки: ${response.status}`);
    }
    return response.json();
}

/** Удалить метку */
export async function deleteDialogLabel(labelId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/dialog-labels/${labelId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Ошибка удаления метки: ${response.status}`);
    }
    return response.json();
}

// =============================================================================
// Назначение / снятие меток
// =============================================================================

/** Назначить метку диалогу */
export async function assignDialogLabel(
    projectId: string, vkUserId: number, labelId: string,
): Promise<{ success: boolean; created: boolean }> {
    const response = await fetch(`${API_BASE_URL}/dialog-labels/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, vk_user_id: vkUserId, label_id: labelId }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Ошибка назначения метки: ${response.status}`);
    }
    return response.json();
}

/** Снять метку с диалога */
export async function unassignDialogLabel(
    projectId: string, vkUserId: number, labelId: string,
): Promise<{ success: boolean; removed: boolean }> {
    const response = await fetch(`${API_BASE_URL}/dialog-labels/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, vk_user_id: vkUserId, label_id: labelId }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Ошибка снятия метки: ${response.status}`);
    }
    return response.json();
}

/** Установить полный набор меток диалога (полная замена) */
export async function setDialogLabels(
    projectId: string, vkUserId: number, labelIds: string[],
): Promise<{ success: boolean; label_ids: string[] }> {
    const response = await fetch(`${API_BASE_URL}/dialog-labels/set-dialog-labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, vk_user_id: vkUserId, label_ids: labelIds }),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Ошибка установки меток: ${response.status}`);
    }
    return response.json();
}
