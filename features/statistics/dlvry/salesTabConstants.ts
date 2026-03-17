/**
 * Константы, типы и хелперы для таба «Статистика продаж».
 */

// ─── Определение групп колонок ──────────────────────────────────────────────
export type ColGroup = 'main' | 'finance' | 'payment' | 'sources' | 'delivery' | 'repeat';

export interface ColGroupDef {
    key: ColGroup;
    label: string;
}

export const COLUMN_GROUPS: ColGroupDef[] = [
    { key: 'main', label: 'Основное' },
    { key: 'finance', label: 'Финансы' },
    { key: 'payment', label: 'Оплата' },
    { key: 'sources', label: 'Источники' },
    { key: 'delivery', label: 'Доставка' },
    { key: 'repeat', label: 'Повторные заказы' },
];

// ─── Пресеты периодов ───────────────────────────────────────────────────────
export type PeriodPreset = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'custom' | 'year_month' | null;

export const PERIOD_PRESETS: { key: PeriodPreset; label: string }[] = [
    { key: null, label: 'Всё время' },
    { key: 'today', label: 'Сегодня' },
    { key: 'yesterday', label: 'Вчера' },
    { key: 'this_week', label: 'Эта неделя' },
    { key: 'last_week', label: 'Пр. неделя' },
    { key: 'this_month', label: 'Этот месяц' },
    { key: 'last_month', label: 'Пр. месяц' },
    { key: 'this_quarter', label: 'Этот квартал' },
    { key: 'last_quarter', label: 'Пр. квартал' },
    { key: 'this_year', label: 'Этот год' },
    { key: 'last_year', label: 'Пр. год' },
    { key: 'year_month', label: 'По месяцам' },
    { key: 'custom', label: 'Свой период' },
];

export const MONTH_NAMES_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

/** Диапазон доступных годов: от 2017 до текущего */
export function getAvailableYears(): number[] {
    const current = new Date().getFullYear();
    const years: number[] = [];
    for (let y = current; y >= 2017; y--) years.push(y);
    return years;
}

/** Вычисляет локальную дату в формате YYYY-MM-DD (без сдвига UTC) */
export function localDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}
