/**
 * Централизованный логгер для модуля «Сообщения сообщества».
 * 
 * Отслеживает:
 * - Жизненный цикл компонентов (маунт, рендер, размонтирование)
 * - Загрузку данных (диалоги, счётчики, история сообщений)
 * - SSE-события (new_message, message_read, user_typing, dialog_focus, all_read)
 * - Обновление счётчиков (по пользователям и в сайдбаре)
 * - Mark-as-read логику (при входе в диалог, при новом сообщении в открытом диалоге)
 * - Многопользовательский режим (dialog_focus, message_read от другого менеджера)
 * 
 * Для включения/отключения — переключить флаг ENABLED.
 * Для фильтрации по категориям — настроить ENABLED_CATEGORIES.
 */

// ============================================================================
// Настройки
// ============================================================================

/** Глобальный флаг включения логирования */
const ENABLED = true;

/** Категории логов */
export type LogCategory =
    | 'RENDER'          // Рендер компонентов (маунт/unmount/re-render)
    | 'CONVERSATIONS'   // Загрузка списка диалогов (useConversations)
    | 'UNREAD_COUNTS'   // Счётчики непрочитанных в сайдбаре (useUnreadDialogCounts)
    | 'GLOBAL_SSE'      // Глобальный SSE-стрим (useGlobalUnreadSSE)
    | 'PROJECT_SSE'     // SSE-стрим проекта (useMessagesSSE)
    | 'TYPING'          // Статус печати (useTypingState)
    | 'HISTORY'         // История сообщений (useMessageHistory)
    | 'MARK_READ'       // Пометка прочитанным (mark-as-read)
    | 'DIALOG_FOCUS'    // Фокус менеджера на диалоге
    | 'SIDEBAR'         // Рендер сайдбара диалогов (ConversationsSidebar);

/** Включённые категории (пустой Set = все включены) */
const ENABLED_CATEGORIES = new Set<LogCategory>([
    // Всё включено по умолчанию — закомментируй ненужные:
    'RENDER',
    'CONVERSATIONS',
    'UNREAD_COUNTS',
    'GLOBAL_SSE',
    'PROJECT_SSE',
    'TYPING',
    'HISTORY',
    'MARK_READ',
    'DIALOG_FOCUS',
    'SIDEBAR',
]);

// ============================================================================
// Стили для DevTools
// ============================================================================

/** Цвета категорий (для console.log с %c) */
const CATEGORY_COLORS: Record<LogCategory, string> = {
    RENDER:        'color: #8B5CF6; font-weight: bold',  // фиолетовый
    CONVERSATIONS: 'color: #3B82F6; font-weight: bold',  // синий
    UNREAD_COUNTS: 'color: #F59E0B; font-weight: bold',  // оранжевый
    GLOBAL_SSE:    'color: #10B981; font-weight: bold',  // зелёный
    PROJECT_SSE:   'color: #06B6D4; font-weight: bold',  // голубой
    TYPING:        'color: #EC4899; font-weight: bold',  // розовый
    HISTORY:       'color: #6366F1; font-weight: bold',  // индиго
    MARK_READ:     'color: #EF4444; font-weight: bold',  // красный
    DIALOG_FOCUS:  'color: #14B8A6; font-weight: bold',  // бирюзовый
    SIDEBAR:       'color: #78716C; font-weight: bold',  // серый
};

const RESET_STYLE = 'color: inherit; font-weight: normal';

// ============================================================================
// Утилиты
// ============================================================================

/** Формат timestamp для логов */
function getTimestamp(): string {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
}

/** Проверка, включена ли категория */
function isCategoryEnabled(category: LogCategory): boolean {
    if (!ENABLED) return false;
    if (ENABLED_CATEGORIES.size === 0) return true; // пустой Set = все включены
    return ENABLED_CATEGORIES.has(category);
}

// ============================================================================
// Дедупликация (React StrictMode в dev рендерит компоненты дважды)
// ============================================================================

let _lastDedupKey = '';
let _lastDedupTime = 0;
const DEDUP_WINDOW_MS = 50; // 50мс — окно дедупликации StrictMode

/** Дубликат ли этот лог? StrictMode шлёт каждый лог дважды ≤ 10мс */
function isDuplicateLog(category: string, message: string): boolean {
    const key = `${category}|${message}`;
    const now = performance.now();
    if (key === _lastDedupKey && now - _lastDedupTime < DEDUP_WINDOW_MS) {
        return true;
    }
    _lastDedupKey = key;
    _lastDedupTime = now;
    return false;
}

// ============================================================================
// Основные функции логирования
// ============================================================================

/**
 * Основная функция логирования.
 * Формат: [HH:MM:SS.mmm] [CATEGORY] сообщение
 */
export function msgLog(category: LogCategory, message: string, data?: unknown): void {
    if (!isCategoryEnabled(category)) return;
    if (isDuplicateLog(category, message)) return;

    const ts = getTimestamp();
    const prefix = `[${ts}] [MSG:${category}]`;
    const style = CATEGORY_COLORS[category];

    if (data !== undefined) {
        console.log(`%c${prefix}%c ${message}`, style, RESET_STYLE, data);
    } else {
        console.log(`%c${prefix}%c ${message}`, style, RESET_STYLE);
    }
}

/**
 * Логирование предупреждений.
 */
export function msgWarn(category: LogCategory, message: string, data?: unknown): void {
    if (!isCategoryEnabled(category)) return;
    if (isDuplicateLog(category, message)) return;

    const ts = getTimestamp();
    const prefix = `[${ts}] [MSG:${category}]`;

    if (data !== undefined) {
        console.warn(`${prefix} ⚠️ ${message}`, data);
    } else {
        console.warn(`${prefix} ⚠️ ${message}`);
    }
}

/**
 * Логирование ошибок.
 */
export function msgError(category: LogCategory, message: string, data?: unknown): void {
    if (!isCategoryEnabled(category)) return;

    const ts = getTimestamp();
    const prefix = `[${ts}] [MSG:${category}]`;

    if (data !== undefined) {
        console.error(`${prefix} ❌ ${message}`, data);
    } else {
        console.error(`${prefix} ❌ ${message}`);
    }
}

// ============================================================================
// Специализированные логгеры (удобные обёртки)
// ============================================================================

/** Группа логов (console.group) для сложных операций */
export function msgGroup(category: LogCategory, label: string): void {
    if (!isCategoryEnabled(category)) return;
    if (isDuplicateLog(category, label)) return;

    const ts = getTimestamp();
    const prefix = `[${ts}] [MSG:${category}]`;
    const style = CATEGORY_COLORS[category];
    console.groupCollapsed(`%c${prefix}%c ${label}`, style, RESET_STYLE);
}

export function msgGroupEnd(category: LogCategory): void {
    if (!isCategoryEnabled(category)) return;
    console.groupEnd();
}

/** Лог таблицы данных (console.table) */
export function msgTable(category: LogCategory, label: string, data: unknown): void {
    if (!isCategoryEnabled(category)) return;

    const ts = getTimestamp();
    const prefix = `[${ts}] [MSG:${category}]`;
    const style = CATEGORY_COLORS[category];
    console.log(`%c${prefix}%c ${label}:`, style, RESET_STYLE);
    console.table(data);
}

// ============================================================================
// Хелперы для форматирования данных
// ============================================================================

/** Формат vk_user_id для логов */
export function fmtUser(vkUserId: number | null | undefined): string {
    if (!vkUserId) return 'null';
    return `user:${vkUserId}`;
}

/** Формат projectId для логов */
export function fmtProject(projectId: string | null | undefined): string {
    if (!projectId) return 'null';
    // Показываем первые 8 символов если ID длинный
    return projectId.length > 12 ? `proj:${projectId.slice(0, 8)}…` : `proj:${projectId}`;
}

/** Формат счётчика для логов */
export function fmtCount(count: number): string {
    return count > 0 ? `📨 ${count}` : '✅ 0';
}

/** Формат Map/Record счётчиков */
export function fmtCountsMap(counts: Record<string, number>): string {
    const entries = Object.entries(counts);
    if (entries.length === 0) return '(пусто)';
    const nonZero = entries.filter(([, v]) => v > 0);
    return `всего проектов: ${entries.length}, с непрочитанными: ${nonZero.length}` +
        (nonZero.length > 0 ? ` → ${nonZero.map(([k, v]) => `${fmtProject(k)}=${v}`).join(', ')}` : '');
}
