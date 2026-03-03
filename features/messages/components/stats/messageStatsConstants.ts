/**
 * Константы и утилиты для страницы статистики сообщений.
 * Типы периодов, pill-опции, вычисление диапазонов дат, форматирование.
 */

// --- Типы периодов ---
export type PeriodType = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'all' | 'custom';
export type DirectionFilter = 'all' | 'incoming' | 'outgoing';

/** Вкладка аналитики: входящие, исходящие или подписки */
export type StatsTab = 'incoming' | 'outgoing' | 'subscriptions';

/** Суб-фильтр входящих: все / реальные набранные (text) / кнопочные (payload) */
export type IncomingSubFilter = 'all' | 'text' | 'payload';

export const STATS_TAB_OPTIONS: { value: StatsTab; label: string; color: string }[] = [
    { value: 'incoming', label: 'Входящие', color: 'green' },
    { value: 'outgoing', label: 'Исходящие', color: 'orange' },
    { value: 'subscriptions', label: 'Подписки', color: 'blue' },
];

export const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
    { value: 'today', label: 'Сегодня' },
    { value: 'yesterday', label: 'Вчера' },
    { value: 'this_week', label: 'Эта неделя' },
    { value: 'last_week', label: 'Прошлая неделя' },
    { value: 'this_month', label: 'Этот месяц' },
    { value: 'last_month', label: 'Прошлый месяц' },
    { value: 'all', label: 'Всё время' },
    { value: 'custom', label: 'Свой период' },
];

/** Возвращает понедельник текущей недели */
function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    // getDay() возвращает 0 для воскресенья, корректируем для понедельника
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    return d;
}

/** Вычисляет dateFrom/dateTo по типу периода */
export function computeDateRange(period: PeriodType, customFrom: string, customTo: string): { dateFrom: string; dateTo: string } {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    switch (period) {
        case 'today':
            return { dateFrom: fmt(today), dateTo: fmt(today) };
        case 'yesterday': {
            const y = new Date(today);
            y.setDate(y.getDate() - 1);
            return { dateFrom: fmt(y), dateTo: fmt(y) };
        }
        case 'this_week': {
            // С понедельника текущей недели по сегодня
            const monday = getMonday(today);
            return { dateFrom: fmt(monday), dateTo: fmt(today) };
        }
        case 'last_week': {
            // Прошлая неделя: понедельник — воскресенье
            const thisMonday = getMonday(today);
            const lastMonday = new Date(thisMonday);
            lastMonday.setDate(lastMonday.getDate() - 7);
            const lastSunday = new Date(thisMonday);
            lastSunday.setDate(lastSunday.getDate() - 1);
            return { dateFrom: fmt(lastMonday), dateTo: fmt(lastSunday) };
        }
        case 'this_month': {
            // С 1-го числа текущего месяца по сегодня
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            return { dateFrom: fmt(firstDay), dateTo: fmt(today) };
        }
        case 'last_month': {
            // Прошлый месяц: 1-е — последнее число
            const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            return { dateFrom: fmt(firstDayLastMonth), dateTo: fmt(lastDayLastMonth) };
        }
        case 'custom':
            return { dateFrom: customFrom, dateTo: customTo };
        default: // 'all'
            return { dateFrom: '', dateTo: '' };
    }
}

/** Форматирование Unix timestamp */
export function formatTs(ts: number | null): string {
    if (!ts) return '—';
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
