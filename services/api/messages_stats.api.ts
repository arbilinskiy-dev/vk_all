/**
 * API-сервис для статистики нагрузки модуля сообщений.
 * Кросс-проектный мониторинг: сводка, графики пиковых нагрузок, детализация по пользователям.
 */

import { API_BASE_URL } from '../../shared/config';
import { getAuthHeaders } from '../../shared/utils/apiClient';

// =============================================================================
// Типы ответов API
// =============================================================================

/** Глобальная сводка по всем проектам */
export interface MessageStatsGlobalSummary {
    success: boolean;
    total_projects: number;
    total_incoming: number;
    total_outgoing: number;
    total_messages: number;
    unique_users: number;
    incoming_users: number;
    outgoing_users: number;
    // --- Расширенные поля мониторинга ---
    /** Входящие: по кнопке/боту (с payload) */
    incoming_payload: number;
    /** Входящие: живые (набранные вручную) */
    incoming_text: number;
    /** Исходящие: системные (отправлены админом) */
    outgoing_system: number;
    /** Исходящие: бот/рассылка */
    outgoing_bot: number;
    /** Уникальные пользователи, писавшие вручную */
    unique_text_users: number;
    /** Уникальные пользователи, нажимавшие кнопки */
    unique_payload_users: number;
    /** Уникальные диалоги (пара project × user) */
    unique_dialogs: number;
    /** Диалоги входящих (text ∪ payload) */
    incoming_dialogs: number;
    /** Диалоги с реальными сообщениями */
    dialogs_with_text: number;
    /** Диалоги с нажатием кнопки */
    dialogs_with_payload: number;
    /** Уникальных получателей исходящих */
    outgoing_recipients: number;
}

/** Сводка по одному проекту */
export interface MessageStatsProjectSummary {
    project_id: string;
    total_incoming: number;
    total_outgoing: number;
    total_messages: number;
    unique_users: number;
    incoming_users: number;
    outgoing_users: number;
    // --- Расширенные поля мониторинга ---
    incoming_payload: number;
    incoming_text: number;
    outgoing_system: number;
    outgoing_bot: number;
    unique_text_users: number;
    unique_payload_users: number;
    unique_dialogs: number;
    incoming_dialogs: number;
    dialogs_with_text: number;
    dialogs_with_payload: number;
    outgoing_recipients: number;
}

/** Ответ: сводка по всем проектам */
export interface MessageStatsProjectsResponse {
    success: boolean;
    projects: MessageStatsProjectSummary[];
}

/** Точка на графике (часовой слот) */
export interface MessageStatsChartPoint {
    hour_slot: string;
    incoming: number;
    outgoing: number;
    total: number;
    unique_users: number;
    /** Входящие с payload (нажатия кнопок/ботов) */
    incoming_payload?: number;
    /** Входящие «живые» текстовые */
    incoming_text?: number;
    /** Исходящие системные (менеджер) */
    outgoing_system?: number;
    /** Исходящие от бота/рассылки */
    outgoing_bot?: number;
    /** Диалоги входящих (уник. юзеры с входящими) за час */
    incoming_dialogs?: number;
    /** Уник. юзеры, написавшие текст за час */
    unique_text_users?: number;
    /** Уник. юзеры, нажавшие кнопку за час */
    unique_payload_users?: number;
    /** Уник. получатели исходящих за час */
    outgoing_recipients?: number;
}

/** Ответ: данные графика */
export interface MessageStatsChartResponse {
    success: boolean;
    chart: MessageStatsChartPoint[];
}

/** Пользователь в детализации */
export interface MessageStatsUserItem {
    vk_user_id: number;
    incoming_count: number;
    outgoing_count: number;
    total_messages: number;
    first_message_at: number | null;
    last_message_at: number | null;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
}

/** Ответ: список пользователей проекта */
export interface MessageStatsUsersResponse {
    success: boolean;
    total_count: number;
    users: MessageStatsUserItem[];
}

// =============================================================================
// API-функции
// =============================================================================

/** Получить глобальную сводку по всем проектам */
export async function fetchMessageStatsSummary(params?: {
    dateFrom?: string;
    dateTo?: string;
}): Promise<MessageStatsGlobalSummary> {
    const searchParams = new URLSearchParams();
    if (params?.dateFrom) searchParams.set('date_from', params.dateFrom);
    if (params?.dateTo) searchParams.set('date_to', params.dateTo);
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/messages/stats/summary${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки сводки: ${res.status}`);
    return res.json();
}

/** Получить сводку по каждому проекту */
export async function fetchMessageStatsProjects(params?: {
    dateFrom?: string;
    dateTo?: string;
}): Promise<MessageStatsProjectsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.dateFrom) searchParams.set('date_from', params.dateFrom);
    if (params?.dateTo) searchParams.set('date_to', params.dateTo);
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/messages/stats/projects${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки проектов: ${res.status}`);
    return res.json();
}

/** Получить сводку по конкретному проекту */
export async function fetchMessageStatsProject(projectId: string): Promise<MessageStatsGlobalSummary> {
    const res = await fetch(`${API_BASE_URL}/messages/stats/project/${projectId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки проекта: ${res.status}`);
    return res.json();
}

/** Получить данные графика пиковых нагрузок */
export async function fetchMessageStatsChart(params?: {
    projectId?: string;
    dateFrom?: string;
    dateTo?: string;
}): Promise<MessageStatsChartResponse> {
    const searchParams = new URLSearchParams();
    if (params?.projectId) searchParams.set('project_id', params.projectId);
    if (params?.dateFrom) searchParams.set('date_from', params.dateFrom);
    if (params?.dateTo) searchParams.set('date_to', params.dateTo);

    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/messages/stats/chart${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки графика: ${res.status}`);
    return res.json();
}

/** Получить список пользователей проекта */
export async function fetchMessageStatsUsers(
    projectId: string,
    params?: {
        sortBy?: string;
        sortOrder?: string;
        limit?: number;
        offset?: number;
        dateFrom?: string;
        dateTo?: string;
        /** Тип сообщений: text (реальные) или payload (кнопки) */
        messageType?: string;
    }
): Promise<MessageStatsUsersResponse> {
    const searchParams = new URLSearchParams();
    if (params?.sortBy) searchParams.set('sort_by', params.sortBy);
    if (params?.sortOrder) searchParams.set('sort_order', params.sortOrder);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.dateFrom) searchParams.set('date_from', params.dateFrom);
    if (params?.dateTo) searchParams.set('date_to', params.dateTo);
    if (params?.messageType) searchParams.set('message_type', params.messageType);

    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/messages/stats/project/${projectId}/users${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки пользователей: ${res.status}`);
    return res.json();
}

/** Ответ запуска синхронизации из callback-логов (фоновая задача) */
export interface SyncFromLogsStartResponse {
    taskId: string;
}

/** Ответ синхронизации из callback-логов (обратная совместимость) */
export interface SyncFromLogsResponse {
    success: boolean;
    synced: number;
    skipped: number;
    errors: number;
    details: string;
}

/** Прогресс синхронизации из callback-логов */
export interface SyncFromLogsProgress {
    taskId: string;
    status: 'pending' | 'fetching' | 'processing' | 'done' | 'error';
    loaded?: number;
    total?: number;
    message?: string;
    error?: string;
    sub_loaded?: number;
    sub_total?: number;
    sub_message?: string;
}

/**
 * Запускает фоновую синхронизацию статистики из callback-логов.
 * Возвращает taskId для отслеживания прогресса.
 */
export async function syncMessageStatsFromLogs(): Promise<SyncFromLogsStartResponse> {
    const res = await fetch(`${API_BASE_URL}/messages/stats/sync-from-logs`, {
        method: 'POST',
        headers: getAuthHeaders(false),
    });
    if (!res.ok) throw new Error(`Ошибка синхронизации: ${res.status}`);
    return res.json();
}

/**
 * Получает статус фоновой задачи синхронизации.
 * Использует общий эндпоинт getTaskStatus.
 */
export async function getSyncFromLogsStatus(taskId: string): Promise<SyncFromLogsProgress> {
    const res = await fetch(`${API_BASE_URL}/lists/system/getTaskStatus/${taskId}`, {
        cache: 'no-store',
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Ошибка получения статуса: ${res.status}`);
    return res.json();
}

// =============================================================================
// Сверка с VK API (Reconciliation) — SSE-стриминг
// =============================================================================

/** Итоговые stats сверки */
export interface ReconcileStats {
    projects_total: number;
    projects_processed: number;
    projects_skipped: number;
    users_total: number;
    users_processed: number;
    users_errors: number;
    hourly_corrections: number;
    user_corrections: number;
    details: string;
}

/** Старый интерфейс для обратной совместимости */
export interface ReconcileResponse extends ReconcileStats {
    success: boolean;
}

/** Событие SSE-стрима сверки */
export type ReconcileEvent =
    | { type: 'start'; total_dialogs: number; total_projects: number }
    | { type: 'progress'; processed: number; total: number; current_project: string; stats: ReconcileStats }
    | { type: 'complete'; stats: ReconcileStats }
    | { type: 'error'; message: string; stats: ReconcileStats };

/** Колбэк для событий прогресса сверки */
export type ReconcileProgressCallback = (event: ReconcileEvent) => void;

/**
 * Сверить статистику с реальными данными VK API (SSE-стриминг).
 * Читает поток событий и вызывает onProgress для каждого события.
 * Возвращает финальный ReconcileResponse.
 */
export async function reconcileMessageStats(params?: {
    dateFrom?: string;
    dateTo?: string;
    onProgress?: ReconcileProgressCallback;
}): Promise<ReconcileResponse> {
    const searchParams = new URLSearchParams();
    if (params?.dateFrom) searchParams.set('date_from', params.dateFrom);
    if (params?.dateTo) searchParams.set('date_to', params.dateTo);
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/messages/stats/reconcile${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, { method: 'POST', headers: getAuthHeaders(false) });
    if (!res.ok) throw new Error(`Ошибка сверки: ${res.status}`);

    // Читаем SSE-поток
    const reader = res.body?.getReader();
    if (!reader) throw new Error('Сервер не вернул поток данных');

    const decoder = new TextDecoder();
    let buffer = '';
    let finalStats: ReconcileStats | null = null;
    let errorMessage: string | null = null;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Парсим SSE-события из буфера (формат: "data: {...}\n\n")
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || ''; // Последний (возможно неполный) фрагмент остаётся в буфере

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data: ')) continue;

                try {
                    const event: ReconcileEvent = JSON.parse(trimmed.slice(6));
                    params?.onProgress?.(event);

                    if (event.type === 'complete') {
                        finalStats = event.stats;
                    } else if (event.type === 'error') {
                        errorMessage = event.message;
                        finalStats = event.stats;
                    }
                } catch {
                    // Пропускаем битые JSON-строки
                }
            }
        }
    } finally {
        reader.releaseLock();
    }

    if (errorMessage && !finalStats?.details) {
        throw new Error(errorMessage);
    }

    return {
        success: !errorMessage,
        ...(finalStats || {
            projects_total: 0, projects_processed: 0, projects_skipped: 0,
            users_total: 0, users_processed: 0, users_errors: 0,
            hourly_corrections: 0, user_corrections: 0, details: 'Нет данных.',
        }),
    };
}

// =============================================================================
// Администраторы — мониторинг исходящих
// =============================================================================

/** Строка таблицы администраторов */
export interface AdminStatsItem {
    sender_id: string;
    sender_name: string;
    messages_sent: number;
    unique_dialogs: number;
    projects_count: number;
}

/** Ответ: список администраторов */
export interface AdminStatsResponse {
    success: boolean;
    admins: AdminStatsItem[];
}

/** Диалог администратора */
export interface AdminDialogItem {
    project_id: string;
    vk_user_id: number;
    messages_sent: number;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
}

/** Ответ: детализация диалогов администратора */
export interface AdminDialogsResponse {
    success: boolean;
    sender_id: string;
    sender_name: string;
    dialogs: AdminDialogItem[];
}

/** Получить статистику по администраторам */
export async function fetchAdminStats(params?: {
    dateFrom?: string;
    dateTo?: string;
}): Promise<AdminStatsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.dateFrom) searchParams.set('date_from', params.dateFrom);
    if (params?.dateTo) searchParams.set('date_to', params.dateTo);
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/messages/stats/admins${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки администраторов: ${res.status}`);
    return res.json();
}

/** Получить диалоги конкретного администратора */
export async function fetchAdminDialogs(
    senderId: string,
    params?: {
        dateFrom?: string;
        dateTo?: string;
    },
): Promise<AdminDialogsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.dateFrom) searchParams.set('date_from', params.dateFrom);
    if (params?.dateTo) searchParams.set('date_to', params.dateTo);
    const qs = searchParams.toString();
    const url = `${API_BASE_URL}/messages/stats/admin/${senderId}/dialogs${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Ошибка загрузки диалогов: ${res.status}`);
    return res.json();
}
