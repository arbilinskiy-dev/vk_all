/**
 * API-сервис для управления DLVRY-филиалами (affiliates).
 * Один проект может иметь несколько филиалов DLVRY.
 */

import { API_BASE_URL } from '../../shared/config';
import { getAuthHeaders } from '../../shared/utils/apiClient';

// =============================================================================
// Типы
// =============================================================================

export interface DlvryAffiliate {
    id: string;
    project_id: string;
    affiliate_id: string;
    name: string | null;
    is_active: boolean;
    created_at: string | null;
}

export interface DlvryAffiliateCreatePayload {
    affiliate_id: string;
    name?: string;
}

export interface DlvryAffiliateUpdatePayload {
    name?: string;
    is_active?: boolean;
}

// =============================================================================
// API-функции
// =============================================================================

/**
 * Получить все филиалы проекта.
 */
export async function fetchDlvryAffiliates(projectId: string): Promise<DlvryAffiliate[]> {
    const url = `${API_BASE_URL}/dlvry/affiliates/${projectId}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки филиалов: ${res.status}`);
    return res.json();
}

/**
 * Добавить филиал к проекту.
 */
export async function createDlvryAffiliate(
    projectId: string,
    payload: DlvryAffiliateCreatePayload,
): Promise<DlvryAffiliate> {
    const url = `${API_BASE_URL}/dlvry/affiliates/${projectId}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Ошибка создания филиала: ${res.status}`);
    }
    return res.json();
}

/**
 * Обновить филиал (имя / активность).
 */
export async function updateDlvryAffiliate(
    recordId: string,
    payload: DlvryAffiliateUpdatePayload,
): Promise<DlvryAffiliate> {
    const url = `${API_BASE_URL}/dlvry/affiliates/record/${recordId}`;
    const res = await fetch(url, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Ошибка обновления филиала: ${res.status}`);
    }
    return res.json();
}

/**
 * Удалить филиал.
 */
export async function deleteDlvryAffiliate(recordId: string): Promise<{ success: boolean }> {
    const url = `${API_BASE_URL}/dlvry/affiliates/record/${recordId}`;
    const res = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Ошибка удаления филиала: ${res.status}`);
    return res.json();
}
