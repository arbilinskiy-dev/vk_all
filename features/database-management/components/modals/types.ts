// ─── Типы для массовой настройки Callback-серверов ─────────────

/** Результат настройки одного проекта */
export interface ProjectSetupResult {
    projectId: string;
    projectName: string;
    vkProjectId?: number;     // ID группы VK (для ссылки на настройки)
    success: boolean;
    action?: string;          // "created" | "updated" | "events_updated"
    message: string;
    errorCode?: number | null;
    serverName?: string;
    callbackUrl?: string;
}

/** Режим локального туннеля */
export type TunnelMode = 'ngrok' | 'ssh-tunnel';

/** Статус проверки туннеля */
export interface TunnelStatus {
    checked: boolean;
    active: boolean;
    message?: string;
}

/** Статистика результатов массовой настройки */
export interface BulkSetupStats {
    success: number;
    errors: number;
    created: number;
    updated: number;
    eventsUpdated: number;
}
