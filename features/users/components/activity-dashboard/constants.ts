// ==========================================
// Константы дашборда активности пользователей
// ==========================================

/** Маппинг event_type на русское название */
export const EVENT_LABELS: Record<string, string> = {
    login_success: 'Входы',
    login_failed: 'Неудачные входы',
    logout: 'Выходы',
    timeout: 'Таймауты',
    force_logout: 'Принудительные выходы',
};

/** Цвета для типов событий — SVG stroke (hex для SVG) и Tailwind bg-класс */
export const EVENT_COLORS: Record<string, { stroke: string; bg: string }> = {
    login_success: { stroke: '#22c55e', bg: 'bg-green-500' },
    login_failed:  { stroke: '#ef4444', bg: 'bg-red-500' },
    logout:        { stroke: '#3b82f6', bg: 'bg-blue-500' },
    timeout:       { stroke: '#f59e0b', bg: 'bg-amber-500' },
    force_logout:  { stroke: '#a855f7', bg: 'bg-purple-500' },
};

export const FALLBACK_COLOR = { stroke: '#94a3b8', bg: 'bg-gray-400' };

/** Русские названия категорий действий */
export const CATEGORY_LABELS: Record<string, string> = {
    posts: 'Посты',
    messages: 'Сообщения',
    ai: 'AI-генерация',
    market: 'Товары',
    automations: 'Автоматизации',
    settings: 'Настройки',
};

/** Цвета категорий */
export const CATEGORY_COLORS: Record<string, string> = {
    posts: '#6366f1',
    messages: '#3b82f6',
    ai: '#8b5cf6',
    market: '#f97316',
    automations: '#22c55e',
    settings: '#6b7280',
};

/** Русские названия типов действий */
export const ACTION_LABELS: Record<string, string> = {
    post_save: 'Сохранение поста',
    post_schedule: 'Планирование поста',
    post_publish: 'Публикация поста',
    post_delete: 'Удаление поста',
    post_delete_published: 'Удаление опубликованного',
    post_pin: 'Закрепление поста',
    post_unpin: 'Открепление поста',
    message_send: 'Отправка сообщения',
    ai_generate: 'AI-генерация текста',
    ai_generate_batch: 'AI-пакетная генерация',
    ai_correct: 'AI-коррекция текста',
    ai_bulk_correct: 'AI-массовая коррекция',
    ai_process_text: 'AI-обработка текста',
    ai_variable_setup: 'AI-настройка переменных',
    market_create_item: 'Создание товара',
    market_create_items: 'Массовое создание товаров',
    market_update_item: 'Обновление товара',
    market_update_items: 'Массовое обновление товаров',
    market_delete_items: 'Удаление товаров',
    market_create_album: 'Создание подборки',
    market_delete_album: 'Удаление подборки',
    bulk_edit_apply: 'Массовое редактирование',
};

/** Варианты периодов для переключателя */
export const PERIOD_OPTIONS = [
    { label: '7 дней', value: 7 },
    { label: '14 дней', value: 14 },
    { label: '30 дней', value: 30 },
    { label: '90 дней', value: 90 },
] as const;
