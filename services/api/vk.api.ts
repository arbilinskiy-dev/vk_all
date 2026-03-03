import { API_BASE_URL } from '../../shared/config';

export interface VkCallbackLog {
    id: number;
    type: string;
    group_id: number;
    group_name?: string | null; // Название группы из базы данных
    payload: string; // JSON string
    timestamp: string;
}

// ─── Интерфейсы для автонастройки Callback ────────────────────────

export interface CallbackSetupRequest {
    project_id: string;
    is_local: boolean;
    use_tunnel: boolean;  // SSH reverse tunnel через VM (без ngrok)
    events?: string[];    // Список событий для подписки (undefined = все)
}

export interface CallbackSetupResponse {
    success: boolean;
    confirmation_code: string;
    server_name: string;
    server_id: number;
    callback_url: string;
    action: string;
    message: string;
    ngrok_url: string | null;
    error_code: number | null;
    vk_group_short_name: string | null;
    events_count?: number;
}

export interface NgrokDetectResponse {
    detected: boolean;
    url: string | null;
    message?: string;
}

/** Ответ эндпоинта /detect-tunnel */
export interface TunnelDetectResponse {
    detected: boolean;
    url: string | null;
    message?: string;
}

export interface CallbackServer {
    id: number;
    title: string;
    creator_id: number;
    url: string;
    secret_key: string;
    status: 'unconfigured' | 'failed' | 'wait' | 'ok';
}

/** Ответ эндпоинта /callback-current/{project_id} — текущее состояние callback-сервера */
export interface CallbackCurrentStateResponse {
    found: boolean;
    server: CallbackServer | null;
    events: Record<string, number>;    // {"message_new": 1, "wall_post_new": 0, ...}
    enabled_events: string[];          // ["message_new", "wall_repost", ...]
    enabled_count: number;
}

// ─── Автонастройка Callback API ──────────────────────────────────

/**
 * Автоматическая настройка Callback-сервера VK.
 * Создаёт/обновляет сервер "smmit" (прод) или "smmitloc" (локалка).
 */
export const setupCallbackAuto = async (request: CallbackSetupRequest): Promise<CallbackSetupResponse> => {
    const response = await fetch(`${API_BASE_URL}/vk/setup-callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Ошибка сервера' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json();
};

/**
 * Проверяет, запущен ли ngrok на локальной машине.
 */
export const detectNgrok = async (): Promise<NgrokDetectResponse> => {
    const response = await fetch(`${API_BASE_URL}/vk/detect-ngrok`);
    if (!response.ok) {
        throw new Error('Не удалось проверить ngrok');
    }
    return response.json();
};

/**
 * Проверяет, активен ли SSH reverse tunnel на VM.
 */
export const detectTunnel = async (): Promise<TunnelDetectResponse> => {
    const response = await fetch(`${API_BASE_URL}/vk/detect-tunnel`);
    if (!response.ok) {
        throw new Error('Не удалось проверить SSH tunnel');
    }
    return response.json();
};

/**
 * Получает список Callback-серверов проекта из VK.
 */
export const getCallbackServers = async (projectId: string): Promise<CallbackServer[]> => {
    const response = await fetch(`${API_BASE_URL}/vk/callback-servers/${projectId}`);
    if (!response.ok) {
        throw new Error('Не удалось получить список серверов');
    }
    const data = await response.json();
    return data.servers || [];
};

/**
 * Получает текущее состояние callback-сервера проекта из VK:
 * какой сервер настроен (smmit/smmitloc) и на какие события подписан.
 */
export const getCurrentCallbackState = async (projectId: string, isLocal: boolean = false): Promise<CallbackCurrentStateResponse> => {
    const response = await fetch(`${API_BASE_URL}/vk/callback-current/${projectId}?is_local=${isLocal}`);
    if (!response.ok) {
        throw new Error('Не удалось получить текущие настройки callback');
    }
    return response.json();
};

// Ответ бэкенда с логами и общим количеством записей в БД
export interface CallbackLogsResponse {
    logs: VkCallbackLog[];
    total_count: number;
}

export const getCallbackLogs = async (limit: number = 50, offset: number = 0): Promise<CallbackLogsResponse | VkCallbackLog[]> => {
    const response = await fetch(`${API_BASE_URL}/vk/logs?limit=${limit}&offset=${offset}`);
    if (!response.ok) {
        throw new Error('Failed to fetch callback logs');
    }
    return response.json();
};

export const deleteAllCallbackLogs = async (): Promise<{ deleted: number }> => {
    const response = await fetch(`${API_BASE_URL}/vk/logs`, { method: 'DELETE' });
    if (!response.ok) {
        throw new Error('Failed to delete all logs');
    }
    return response.json();
};

export const deleteCallbackLog = async (logId: number): Promise<{ deleted: number }> => {
    const response = await fetch(`${API_BASE_URL}/vk/logs/${logId}`, { method: 'DELETE' });
    if (!response.ok) {
        throw new Error('Failed to delete log');
    }
    return response.json();
};

export const deleteBatchCallbackLogs = async (ids: number[]): Promise<{ deleted: number }> => {
    const response = await fetch(`${API_BASE_URL}/vk/logs/delete-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids)
    });
    if (!response.ok) {
        throw new Error('Failed to delete batch logs');
    }
    return response.json();
};
