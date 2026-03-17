/**
 * Константы и типы для таба «Заказы» — переключаемые группы колонок.
 * Аналог salesTabConstants.ts для таблицы заказов.
 */

// ─── Определение групп колонок ──────────────────────────────────────────────
export type OrderColGroup = 'finance' | 'client' | 'extra';

export interface OrderColGroupDef {
    key: OrderColGroup;
    label: string;
    icon: string;
}

/** Группы колонок для таблицы заказов (основные всегда видны) */
export const ORDER_COLUMN_GROUPS: OrderColGroupDef[] = [
    { key: 'finance', label: 'Финансы', icon: '💰' },
    { key: 'client', label: 'Клиент / VK', icon: '👤' },
    { key: 'extra', label: 'Дополнительно', icon: '📋' },
];

/** Ключ для сохранения в localStorage */
export const ORDERS_COL_GROUPS_STORAGE_KEY = 'dlvry_orders_col_groups';

/** Загрузить активные группы из localStorage */
export function loadOrderColGroups(): Set<OrderColGroup> {
    try {
        const raw = localStorage.getItem(ORDERS_COL_GROUPS_STORAGE_KEY);
        if (raw) {
            const arr = JSON.parse(raw) as OrderColGroup[];
            return new Set(arr);
        }
    } catch { /* игнор */ }
    return new Set<OrderColGroup>();
}

/** Сохранить активные группы в localStorage */
export function saveOrderColGroups(groups: Set<OrderColGroup>): void {
    localStorage.setItem(ORDERS_COL_GROUPS_STORAGE_KEY, JSON.stringify([...groups]));
}
