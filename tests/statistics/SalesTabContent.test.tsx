/**
 * Тесты SalesTabContent — хаб-контейнер «Статистика продаж».
 * Мокаем хук useSalesTabLogic и все дочерние компоненты,
 * проверяем что хаб корректно собирает UI.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Мок хука ────────────────────────────────────────────────────────────────
const mockState = {
    days: [],
    aggregated: null,
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    totalCount: 0,
    isSyncing: false,
    error: null,
    lastSyncResult: null,
    dateFrom: '2026-01-01',
    dateTo: '2026-01-31',
    fullSyncProgress: null,
    availableMonths: new Set<string>(),
    activePreset: 'this_month' as const,
    ymYear: 2026,
    ymMonth: 0,
    yearDropdownOpen: false,
    activeGroups: new Set(['main', 'finance', 'payment', 'sources', 'delivery', 'repeat']),
    totals: null,
    tableScrollRef: { current: null },
    yearDropdownRef: { current: null },
};

const mockActions = {
    setDateFrom: vi.fn(),
    setDateTo: vi.fn(),
    loadMore: vi.fn(),
    applyPreset: vi.fn(),
    applyYearMonth: vi.fn(),
    setYmYear: vi.fn(),
    setYmMonth: vi.fn(),
    setYearDropdownOpen: vi.fn(),
    toggleGroup: vi.fn(),
    handleSync: vi.fn(),
    handleFullSync: vi.fn(),
};

const mockUseSalesTabLogic = vi.fn(() => ({
    state: { ...mockState },
    actions: { ...mockActions },
}));

vi.mock('../../features/statistics/dlvry/useSalesTabLogic', () => ({
    useSalesTabLogic: (...args: any[]) => mockUseSalesTabLogic(...args),
}));

// ── Моки подкомпонентов ─────────────────────────────────────────────────────
vi.mock('../../features/statistics/dlvry/SalesSyncButtons', () => ({
    SalesSyncButtons: (props: any) => <div data-testid="sales-sync-buttons" data-syncing={props.isSyncing} />,
}));

vi.mock('../../features/statistics/dlvry/SalesPeriodSelector', () => ({
    SalesPeriodSelector: (props: any) => <div data-testid="sales-period-selector" data-preset={props.activePreset} />,
}));

vi.mock('../../features/statistics/dlvry/SalesDailyTable', () => ({
    SalesDailyTable: (props: any) => <div data-testid="sales-daily-table" data-loading={props.isLoading} />,
}));

vi.mock('../../features/statistics/dlvry/SalesAggregatedCards', () => ({
    SalesAggregatedCards: () => <div data-testid="sales-aggregated-cards" />,
}));

vi.mock('../../features/statistics/dlvry/SourcesInfographic', () => ({
    SourcesInfographic: () => <div data-testid="sources-infographic" />,
}));

import { SalesTabContent } from '../../features/statistics/dlvry/SalesTabContent';

// =============================================================================
// Фикстуры
// =============================================================================

function createProject(overrides = {}) {
    return {
        id: 'proj-1',
        name: 'Тест',
        vk_group_id: '123',
        access_token: 'tok',
        team: 'Команда',
        dlvry_affiliate_id: 'aff-1',
        ...overrides,
    } as any;
}

// =============================================================================
// Тесты
// =============================================================================

describe('SalesTabContent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseSalesTabLogic.mockReturnValue({
            state: { ...mockState },
            actions: { ...mockActions },
        });
    });

    // ─── Вызов хука ─────────────────────────────────────────────────────
    it('вызывает useSalesTabLogic с projectId из project.id', () => {
        render(<SalesTabContent project={createProject({ id: 'proj-42' })} />);
        expect(mockUseSalesTabLogic).toHaveBeenCalledWith({ projectId: 'proj-42' });
    });

    it('конвертирует числовой project.id в строку', () => {
        render(<SalesTabContent project={createProject({ id: 123 })} />);
        expect(mockUseSalesTabLogic).toHaveBeenCalledWith({ projectId: '123' });
    });

    // ─── Рендер подкомпонентов ──────────────────────────────────────────
    it('рендерит SalesSyncButtons', () => {
        render(<SalesTabContent project={createProject()} />);
        expect(screen.getByTestId('sales-sync-buttons')).toBeInTheDocument();
    });

    it('рендерит SalesPeriodSelector', () => {
        render(<SalesTabContent project={createProject()} />);
        expect(screen.getByTestId('sales-period-selector')).toBeInTheDocument();
    });

    it('рендерит SalesDailyTable', () => {
        render(<SalesTabContent project={createProject()} />);
        expect(screen.getByTestId('sales-daily-table')).toBeInTheDocument();
    });

    it('рендерит SalesAggregatedCards', () => {
        render(<SalesTabContent project={createProject()} />);
        expect(screen.getByTestId('sales-aggregated-cards')).toBeInTheDocument();
    });

    it('рендерит SourcesInfographic', () => {
        render(<SalesTabContent project={createProject()} />);
        expect(screen.getByTestId('sources-infographic')).toBeInTheDocument();
    });

    // ─── Фильтры колонок ────────────────────────────────────────────────
    it('отображает чипы групп колонок', () => {
        render(<SalesTabContent project={createProject()} />);
        expect(screen.getByText('Колонки:')).toBeInTheDocument();
        expect(screen.getByText('Основное')).toBeInTheDocument();
        expect(screen.getByText('Финансы')).toBeInTheDocument();
    });

    it('клик по чипу колонки вызывает toggleGroup', () => {
        render(<SalesTabContent project={createProject()} />);
        fireEvent.click(screen.getByText('Финансы'));
        expect(mockActions.toggleGroup).toHaveBeenCalledWith('finance');
    });

    it('чип «Основное» заблокирован (disabled)', () => {
        render(<SalesTabContent project={createProject()} />);
        const mainBtn = screen.getByText('Основное');
        expect(mainBtn).toBeDisabled();
    });

    // ─── Ошибка ─────────────────────────────────────────────────────────
    it('НЕ показывает блок ошибки если error = null', () => {
        render(<SalesTabContent project={createProject()} />);
        expect(screen.queryByText(/ошибка/i)).toBeNull();
    });

    it('показывает блок ошибки если error задан', () => {
        mockUseSalesTabLogic.mockReturnValue({
            state: { ...mockState, error: 'Что-то пошло не так' },
            actions: { ...mockActions },
        });
        render(<SalesTabContent project={createProject()} />);
        expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument();
    });
});
