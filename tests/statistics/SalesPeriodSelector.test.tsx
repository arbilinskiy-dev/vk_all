/**
 * Тесты SalesPeriodSelector — pill-пресеты, режим «По месяцам»,
 * режим «Свой период».
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Мокаем CustomDatePicker — рендерим простой input
vi.mock('../../shared/components/pickers/CustomDatePicker', () => ({
    CustomDatePicker: ({ value, onChange, placeholder }: any) => (
        <input
            data-testid={`date-picker-${placeholder}`}
            value={value}
            onChange={(e: any) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    ),
}));

import { SalesPeriodSelector } from '../../features/statistics/dlvry/SalesPeriodSelector';
import { PERIOD_PRESETS } from '../../features/statistics/dlvry/salesTabConstants';

// =============================================================================
// Фикстуры
// =============================================================================

function createDefaultProps(overrides: Partial<React.ComponentProps<typeof SalesPeriodSelector>> = {}) {
    return {
        activePreset: 'this_month' as const,
        onPresetChange: vi.fn(),
        ymYear: 2026,
        ymMonth: 0,
        yearDropdownOpen: false,
        yearDropdownRef: { current: null } as React.RefObject<HTMLDivElement>,
        availableMonths: new Set(['2026-1', '2026-2', '2025-12']),
        onYmYearChange: vi.fn(),
        onYmMonthChange: vi.fn(),
        onYearDropdownToggle: vi.fn(),
        onApplyYearMonth: vi.fn(),
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
        onDateFromChange: vi.fn(),
        onDateToChange: vi.fn(),
        ...overrides,
    };
}

// =============================================================================
// Тесты
// =============================================================================

describe('SalesPeriodSelector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── Отображение пресетов ───────────────────────────────────────────
    it('отображает лейбл «Период:»', () => {
        render(<SalesPeriodSelector {...createDefaultProps()} />);
        expect(screen.getByText('Период:')).toBeInTheDocument();
    });

    it('отображает все 13 пресетных кнопок', () => {
        render(<SalesPeriodSelector {...createDefaultProps()} />);
        for (const p of PERIOD_PRESETS) {
            expect(screen.getByText(p.label)).toBeInTheDocument();
        }
    });

    it('активный пресет имеет класс bg-indigo-100', () => {
        render(<SalesPeriodSelector {...createDefaultProps({ activePreset: 'today' })} />);
        const btn = screen.getByText('Сегодня');
        expect(btn.className).toContain('bg-indigo-100');
    });

    it('неактивный пресет НЕ имеет класс bg-indigo-100', () => {
        render(<SalesPeriodSelector {...createDefaultProps({ activePreset: 'today' })} />);
        const btn = screen.getByText('Вчера');
        expect(btn.className).not.toContain('bg-indigo-100');
    });

    // ─── Клик по пресету ────────────────────────────────────────────────
    it('клик по пресету вызывает onPresetChange', () => {
        const props = createDefaultProps();
        render(<SalesPeriodSelector {...props} />);
        fireEvent.click(screen.getByText('Вчера'));
        expect(props.onPresetChange).toHaveBeenCalledWith('yesterday');
    });

    it('клик по «Всё время» вызывает onPresetChange(null)', () => {
        const props = createDefaultProps();
        render(<SalesPeriodSelector {...props} />);
        fireEvent.click(screen.getByText('Всё время'));
        expect(props.onPresetChange).toHaveBeenCalledWith(null);
    });

    // ─── Режим «По месяцам» ─────────────────────────────────────────────
    it('НЕ отображает секцию месяцев если activePreset !== year_month', () => {
        render(<SalesPeriodSelector {...createDefaultProps({ activePreset: 'today' })} />);
        expect(screen.queryByText('Янв')).toBeNull();
    });

    it('отображает 12 месяцев если activePreset = year_month', () => {
        render(<SalesPeriodSelector {...createDefaultProps({ activePreset: 'year_month' })} />);
        expect(screen.getByText('Янв')).toBeInTheDocument();
        expect(screen.getByText('Дек')).toBeInTheDocument();
    });

    it('отображает кнопку выбора года', () => {
        render(<SalesPeriodSelector {...createDefaultProps({ activePreset: 'year_month' })} />);
        expect(screen.getByText('2026')).toBeInTheDocument();
    });

    it('клик по году открывает дропдаун', () => {
        const props = createDefaultProps({ activePreset: 'year_month' });
        render(<SalesPeriodSelector {...props} />);
        fireEvent.click(screen.getByText('2026'));
        expect(props.onYearDropdownToggle).toHaveBeenCalledWith(true);
    });

    it('показывает список годов при yearDropdownOpen=true', () => {
        render(
            <SalesPeriodSelector {...createDefaultProps({ activePreset: 'year_month', yearDropdownOpen: true })} />,
        );
        // Должен быть год 2017 (последний в списке)
        expect(screen.getByText('2017')).toBeInTheDocument();
    });

    it('клик по месяцу вызывает onApplyYearMonth', () => {
        const props = createDefaultProps({
            activePreset: 'year_month',
            availableMonths: new Set(['2026-1', '2026-2', '2026-3']),
        });
        render(<SalesPeriodSelector {...props} />);
        fireEvent.click(screen.getByText('Фев'));
        expect(props.onYmMonthChange).toHaveBeenCalledWith(1);
        expect(props.onApplyYearMonth).toHaveBeenCalledWith(2026, 1);
    });

    // ─── Режим «Свой период» ────────────────────────────────────────────
    it('НЕ отображает date-pickers если activePreset !== custom', () => {
        render(<SalesPeriodSelector {...createDefaultProps({ activePreset: 'today' })} />);
        expect(screen.queryByTestId('date-picker-Начало')).toBeNull();
    });

    it('отображает два date-picker если activePreset = custom', () => {
        render(<SalesPeriodSelector {...createDefaultProps({ activePreset: 'custom' })} />);
        expect(screen.getByTestId('date-picker-Начало')).toBeInTheDocument();
        expect(screen.getByTestId('date-picker-Конец')).toBeInTheDocument();
    });

    it('изменение dateFrom вызывает onDateFromChange', () => {
        const props = createDefaultProps({ activePreset: 'custom' });
        render(<SalesPeriodSelector {...props} />);
        fireEvent.change(screen.getByTestId('date-picker-Начало'), { target: { value: '2026-02-01' } });
        expect(props.onDateFromChange).toHaveBeenCalledWith('2026-02-01');
    });

    it('изменение dateTo вызывает onDateToChange', () => {
        const props = createDefaultProps({ activePreset: 'custom' });
        render(<SalesPeriodSelector {...props} />);
        fireEvent.change(screen.getByTestId('date-picker-Конец'), { target: { value: '2026-02-28' } });
        expect(props.onDateToChange).toHaveBeenCalledWith('2026-02-28');
    });
});
