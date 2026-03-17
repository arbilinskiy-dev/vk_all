/**
 * Константы для страницы «АМ Анализ».
 */

// ─── Период ──────────────────────────────────────────────────────

export const PERIOD_OPTIONS = [
    { label: '7 дней', value: 7 },
    { label: '14 дней', value: 14 },
    { label: '30 дней', value: 30 },
    { label: '90 дней', value: 90 },
];

// ─── Цвета для групп действий ───────────────────────────────────

/** HEX-цвета для групп действий */
export const GROUP_COLORS: Record<string, string> = {
    dialogs: '#6366f1',    // indigo
    messages: '#10b981',   // emerald
    labels: '#f59e0b',     // amber
    templates: '#8b5cf6',  // violet
    promocodes: '#ef4444', // red
};
