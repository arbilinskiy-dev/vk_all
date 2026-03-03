import {
    CallbackCurrentStateResponse,
    CallbackSetupResponse,
} from '../../../../../services/api/vk.api';
import { CallbackEventCategory } from '../../../../../shared/utils/callbackEvents';

// ─── Типы ────────────────────────────────────────────────────────

export type TunnelMode = 'ngrok' | 'ssh-tunnel';

/** Состояние проверки интеграционных требований */
export interface IntegrationRequirementsState {
    /** Проверка завершена */
    isChecked: boolean;
    /** Идёт проверка */
    isChecking: boolean;
    /** Все требования выполнены — можно включать автоматизацию */
    isReady: boolean;
    /** Ошибка проверки */
    error: string | null;

    // ─── Токен сообщества ────────────────────────────
    /** Есть ли токен сообщества */
    hasToken: boolean;
    /** Название группы VK */
    groupName: string | null;
    /** Короткое имя группы (screen_name) */
    groupShortName: string | null;
    /** ID группы VK */
    groupId: number | null;

    // ─── Callback API ────────────────────────────────
    /** Найден ли наш callback-сервер */
    hasCallback: boolean;
    /** Название callback-сервера */
    serverName: string | null;
    /** URL callback-сервера */
    serverUrl: string | null;
    /** Статус callback-сервера (ok / wait / failed / unconfigured) */
    callbackStatus: string | null;
    /** Количество включённых событий */
    enabledEventsCount: number;
    /** Список включённых событий (для дополнения при включении wall_post_new) */
    enabledEvents: string[];

    // ─── wall_post_new ───────────────────────────────
    /** Включено ли событие wall_post_new */
    hasWallPostNew: boolean;
}

/** Действия для интеграционных требований */
export interface IntegrationRequirementsActions {
    /** Включить событие wall_post_new (дополнить текущие настройки) */
    enableWallPostNew: () => Promise<void>;
    /** Идёт включение wall_post_new */
    isEnabling: boolean;
    /** Сохранить токен сообщества прямо из этого блока */
    saveToken: (token: string) => Promise<void>;
    /** Идёт сохранение токена */
    isSavingToken: boolean;
    /** Повторная проверка всех требований */
    recheck: () => Promise<void>;
    /** Данные проекта для формирования ссылок (vkGroupShortName, vkProjectId) */
    projectData: { vkGroupShortName?: string; vkProjectId?: number } | null;
}

// ─── Состояние и действия автонастройки Callback ─────────────────

/** Состояние инлайн-автонастройки callback (переиспользует логику из IntegrationsSection) */
export interface CallbackSetupState {
    /** Идёт автонастройка */
    isSettingUp: boolean;
    /** Результат автонастройки */
    setupResult: CallbackSetupResponse | null;
    /** Ошибка сети при автонастройке */
    setupError: string | null;
    /** Режим туннеля (ngrok / ssh-tunnel) */
    tunnelMode: TunnelMode;
    /** Статус проверки SSH tunnel */
    tunnelStatus: { checked: boolean; active: boolean; message?: string };
    /** Идёт проверка tunnel */
    isCheckingTunnel: boolean;
    /** Выбранные события для подписки */
    selectedEvents: Set<string>;
    /** Показывать селектор событий */
    showEventSelector: boolean;
    /** Все события выбраны */
    allSelected: boolean;
    /** Текущее состояние callback-сервера из VK */
    currentState: CallbackCurrentStateResponse | null;
    /** Загрузка текущего состояния */
    isLoadingCurrent: boolean;
    /** Ошибка загрузки текущего состояния */
    loadCurrentError: string | null;
    /** Локальная среда */
    isLocal: boolean;
    /** Доступна ли автонастройка (есть токен + ID группы) */
    canAutoSetup: boolean;
    /** Есть ли ID группы VK */
    hasGroupId: boolean;
}

/** Действия инлайн-автонастройки callback */
export interface CallbackSetupActions {
    /** Запустить автонастройку callback-сервера */
    handleAutoSetup: () => Promise<void>;
    /** Сменить режим туннеля */
    handleTunnelModeChange: (mode: TunnelMode) => void;
    /** Проверить SSH tunnel */
    checkTunnelStatus: () => Promise<void>;
    /** Переключить событие */
    toggleEvent: (key: string) => void;
    /** Переключить категорию событий */
    toggleCategory: (category: CallbackEventCategory) => void;
    /** Выбрать все события */
    selectAll: () => void;
    /** Снять все события */
    deselectAll: () => void;
    /** Показать/скрыть селектор событий */
    toggleEventSelector: () => void;
    /** Загрузить текущие настройки из VK */
    loadCurrentSettings: () => Promise<void>;
}
