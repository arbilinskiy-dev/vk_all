/**
 * Тесты SalesDailyTable — таблица дневной статистики продаж.
 * Состояния: загрузка, пустые данные, данные + колонки, итоги, infinite scroll.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Мокаем dlvryFormatUtils
vi.mock('../../features/statistics/dlvry/dlvryFormatUtils', () => ({
    formatMoney: (v: number) => String(v),
    formatDateRu: (iso: string) => iso,
    plural: (_n: number, forms: string[]) => forms[1],
}));

import { SalesDailyTable } from '../../features/statistics/dlvry/SalesDailyTable';

// =============================================================================
// Хелперы
// =============================================================================

function createDayRow(overrides = {}) {
    return {
        date: '2026-01-15',
        orders_count: 10,
        revenue: 5000,
        avg_check: 500,
        first_orders: 3,
        unique_clients: 8,
        canceled: 1,
        canceled_sum: 400,
        cost: 2000,
        discount: 200,
        first_orders_sum: 1500,
        first_orders_cost: 600,
        count_payment_cash: 3,
        sum_cash: 1500,
        count_payment_card: 5,
        sum_card: 2500,
        count_payment_online: 2,
        sum_online_success: 1000,
        sum_online_fail: 0,
        source_vkapp: 4,
        sum_source_vkapp: 2000,
        source_site: 3,
        sum_source_site: 1500,
        source_ios: 2,
        sum_source_ios: 1000,
        source_android: 1,
        sum_source_android: 500,
        delivery_count: 6,
        delivery_sum: 600,
        delivery_self_count: 4,
        delivery_self_sum: 0,
        repeat_order_2: 2,
        repeat_order_3: 1,
        repeat_order_4: 0,
        repeat_order_5: 0,
        ...overrides,
    };
}

function createTotals(overrides = {}) {
    return {
        orders: 100,
        revenue: 50000,
        avg_check: 500,
        first_orders: 20,
        unique_clients: 50,
        canceled: 5,
        canceled_sum: 2000,
        cost: 10000,
        discount: 1000,
        first_orders_sum: 8000,
        first_orders_cost: 3000,
        count_payment_cash: 30,
        sum_cash: 15000,
        count_payment_card: 40,
        sum_card: 20000,
        count_payment_online: 30,
        sum_online_success: 14000,
        sum_online_fail: 1000,
        source_vkapp: 20,
        sum_source_vkapp: 10000,
        source_site: 30,
        sum_source_site: 15000,
        source_ios: 10,
        sum_source_ios: 5000,
        source_android: 15,
        sum_source_android: 7500,
        delivery_count: 50,
        delivery_sum: 5000,
        delivery_self_count: 25,
        delivery_self_sum: 0,
        repeat_order_2: 10,
        repeat_order_3: 5,
        repeat_order_4: 3,
        repeat_order_5: 1,
        ...overrides,
    };
}

const allGroups = new Set(['main', 'finance', 'payment', 'sources', 'delivery', 'repeat'] as const);

function createDefaultProps(overrides: any = {}) {
    return {
        days: [] as any[],
        totals: null as any,
        activeGroups: allGroups as any,
        isLoading: false,
        isLoadingMore: false,
        hasMore: false,
        totalCount: 0,
        isSyncing: false,
        tableScrollRef: { current: null } as any,
        onSync: vi.fn(),
        onLoadMore: vi.fn(),
        ...overrides,
    };
}

// =============================================================================
// Тесты
// =============================================================================

describe('SalesDailyTable', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── Загрузка ───────────────────────────────────────────────────────
    it('показывает лоадер при isLoading=true и пустых days', () => {
        const { container } = render(<SalesDailyTable {...createDefaultProps({ isLoading: true })} />);
        expect(container.querySelector('.loader')).toBeTruthy();
    });

    // ─── Пустое состояние ───────────────────────────────────────────────
    it('показывает пустое состояние при days=[] и isLoading=false', () => {
        render(<SalesDailyTable {...createDefaultProps()} />);
        expect(screen.getByText('Данных пока нет')).toBeInTheDocument();
    });

    it('показывает кнопку «Загрузить данные» в пустом состоянии', () => {
        render(<SalesDailyTable {...createDefaultProps()} />);
        expect(screen.getByText('Загрузить данные')).toBeInTheDocument();
    });

    it('кнопка «Загрузить данные» вызывает onSync', () => {
        const props = createDefaultProps();
        render(<SalesDailyTable {...props} />);
        fireEvent.click(screen.getByText('Загрузить данные'));
        expect(props.onSync).toHaveBeenCalledTimes(1);
    });

    it('кнопка заблокирована при isSyncing=true', () => {
        render(<SalesDailyTable {...createDefaultProps({ isSyncing: true })} />);
        const btn = screen.getByText('Загрузка...');
        expect(btn).toBeDisabled();
    });

    // ─── Таблица с данными ──────────────────────────────────────────────
    it('показывает таблицу при наличии данных', () => {
        render(
            <SalesDailyTable
                {...createDefaultProps({
                    days: [createDayRow()],
                    totalCount: 1,
                })}
            />,
        );
        expect(screen.getByText('Заказов')).toBeInTheDocument();
        expect(screen.getByText('Выручка')).toBeInTheDocument();
        expect(screen.getByText('Дата')).toBeInTheDocument();
    });

    it('отображает строку данных за день', () => {
        render(
            <SalesDailyTable
                {...createDefaultProps({
                    days: [createDayRow({ date: '2026-01-15', orders_count: 10, revenue: 5000 })],
                    totalCount: 1,
                })}
            />,
        );
        expect(screen.getByText('2026-01-15')).toBeInTheDocument(); // formatDateRu мок возвращает iso
        expect(screen.getByText('10')).toBeInTheDocument();
    });

    // ─── Колонки finance ────────────────────────────────────────────────
    it('показывает колонки «Финансы» если finance активна', () => {
        render(
            <SalesDailyTable
                {...createDefaultProps({
                    days: [createDayRow()],
                    totalCount: 1,
                })}
            />,
        );
        expect(screen.getByText('Себест.')).toBeInTheDocument();
        expect(screen.getByText('Скидки')).toBeInTheDocument();
    });

    it('скрывает колонки «Финансы» если finance не активна', () => {
        const groups = new Set(['main', 'payment', 'sources', 'delivery', 'repeat'] as const);
        render(
            <SalesDailyTable
                {...createDefaultProps({
                    days: [createDayRow()],
                    totalCount: 1,
                    activeGroups: groups,
                })}
            />,
        );
        expect(screen.queryByText('Себест.')).toBeNull();
        expect(screen.queryByText('Скидки')).toBeNull();
    });

    // ─── Колонки payment ────────────────────────────────────────────────
    it('показывает колонки «Оплата» если payment активна', () => {
        render(
            <SalesDailyTable
                {...createDefaultProps({
                    days: [createDayRow()],
                    totalCount: 1,
                })}
            />,
        );
        expect(screen.getByTitle('Наличные')).toBeInTheDocument();
        expect(screen.getByTitle('Картой')).toBeInTheDocument();
    });

    // ─── Колонки repeat ─────────────────────────────────────────────────
    it('показывает колонки «Повторные заказы» если repeat активна', () => {
        render(
            <SalesDailyTable
                {...createDefaultProps({
                    days: [createDayRow()],
                    totalCount: 1,
                })}
            />,
        );
        expect(screen.getByTitle('2-й заказ')).toBeInTheDocument();
        expect(screen.getByTitle('5+ заказов')).toBeInTheDocument();
    });

    // ─── Строка итогов ──────────────────────────────────────────────────
    it('отображает строку итогов если totals переданы', () => {
        render(
            <SalesDailyTable
                {...createDefaultProps({
                    days: [createDayRow()],
                    totals: createTotals(),
                    totalCount: 1,
                })}
            />,
        );
        expect(screen.getByText(/Итого/)).toBeInTheDocument();
    });

    it('НЕ отображает строку итогов если totals=null', () => {
        render(
            <SalesDailyTable
                {...createDefaultProps({
                    days: [createDayRow()],
                    totalCount: 1,
                })}
            />,
        );
        expect(screen.queryByText(/Итого/)).toBeNull();
    });

    // ─── hasMore / пагинация ────────────────────────────────────────────
    it('показывает «X из Y» когда hasMore=true', () => {
        render(
            <SalesDailyTable
                {...createDefaultProps({
                    days: [createDayRow()],
                    totals: createTotals(),
                    totalCount: 100,
                    hasMore: true,
                })}
            />,
        );
        // Текст «X из Y» встречается и в футере таблицы, и в блоке пагинации
        const matches = screen.getAllByText(/1 из 100/);
        expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    // ─── Только main группа ─────────────────────────────────────────────
    it('при только main — показывает базовые заголовки без дополнительных', () => {
        const mainOnly = new Set(['main'] as const);
        render(
            <SalesDailyTable
                {...createDefaultProps({
                    days: [createDayRow()],
                    totalCount: 1,
                    activeGroups: mainOnly,
                })}
            />,
        );
        expect(screen.getByText('Заказов')).toBeInTheDocument();
        expect(screen.queryByTitle('Наличные')).toBeNull();
        expect(screen.queryByText('Себест.')).toBeNull();
    });
});
