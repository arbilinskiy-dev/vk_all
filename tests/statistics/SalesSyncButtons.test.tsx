/**
 * Тесты SalesSyncButtons — кнопки синхронизации и прогресс-индикатор.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Мокаем dlvryFormatUtils
vi.mock('../../features/statistics/dlvry/dlvryFormatUtils', () => ({
    formatMoney: (v: number) => v.toLocaleString('ru-RU'),
    plural: (n: number, forms: string[]) => forms[1],
}));

import { SalesSyncButtons } from '../../features/statistics/dlvry/SalesSyncButtons';

// =============================================================================
// Тесты
// =============================================================================

describe('SalesSyncButtons', () => {
    const defaultProps = {
        isSyncing: false,
        onSync: vi.fn(),
        onFullSync: vi.fn(),
        fullSyncProgress: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── Рендер кнопок ──────────────────────────────────────────────────
    it('отображает кнопку «Обновить данные»', () => {
        render(<SalesSyncButtons {...defaultProps} />);
        expect(screen.getByText('Обновить данные')).toBeInTheDocument();
    });

    it('отображает кнопку «Полная загрузка»', () => {
        render(<SalesSyncButtons {...defaultProps} />);
        expect(screen.getByText('Полная загрузка')).toBeInTheDocument();
    });

    it('отображает подсказку про автообновление', () => {
        render(<SalesSyncButtons {...defaultProps} />);
        expect(screen.getByText('Обновляется автоматически раз в сутки')).toBeInTheDocument();
    });

    // ─── Клики ──────────────────────────────────────────────────────────
    it('вызывает onSync при клике на «Обновить данные»', () => {
        render(<SalesSyncButtons {...defaultProps} />);
        fireEvent.click(screen.getByText('Обновить данные'));
        expect(defaultProps.onSync).toHaveBeenCalledTimes(1);
    });

    it('вызывает onFullSync при клике на «Полная загрузка»', () => {
        render(<SalesSyncButtons {...defaultProps} />);
        fireEvent.click(screen.getByText('Полная загрузка'));
        expect(defaultProps.onFullSync).toHaveBeenCalledTimes(1);
    });

    // ─── isSyncing = true ───────────────────────────────────────────────
    it('показывает «Синхронизация...» при isSyncing=true', () => {
        render(<SalesSyncButtons {...defaultProps} isSyncing={true} />);
        expect(screen.getByText('Синхронизация...')).toBeInTheDocument();
    });

    it('кнопки заблокированы при isSyncing=true', () => {
        render(<SalesSyncButtons {...defaultProps} isSyncing={true} />);
        const buttons = screen.getAllByRole('button');
        buttons.forEach(btn => {
            expect(btn).toBeDisabled();
        });
    });

    // ─── Прогресс стриминга ─────────────────────────────────────────────
    it('не показывает прогресс если fullSyncProgress=null', () => {
        const { container } = render(<SalesSyncButtons {...defaultProps} />);
        expect(container.querySelector('.animate-pulse')).toBeNull();
    });

    it('показывает промежуточный прогресс (done=false)', () => {
        render(
            <SalesSyncButtons
                {...defaultProps}
                fullSyncProgress={{
                    done: false,
                    chunk: 3,
                    synced_days: 45,
                    total_orders: 120,
                    total_revenue: 65000,
                }}
            />,
        );
        expect(screen.getByText(/Чанк 3/)).toBeInTheDocument();
        expect(screen.getByText(/45 дн/)).toBeInTheDocument();
    });

    it('показывает финальный прогресс (done=true)', () => {
        render(
            <SalesSyncButtons
                {...defaultProps}
                fullSyncProgress={{
                    done: true,
                    synced_days: 90,
                    total_orders: 250,
                    total_revenue: 125000,
                }}
            />,
        );
        expect(screen.getByText(/Готово/)).toBeInTheDocument();
        expect(screen.getByText(/90/)).toBeInTheDocument();
    });
});
