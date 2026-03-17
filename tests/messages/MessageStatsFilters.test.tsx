/**
 * @file MessageStatsFilters.test.tsx
 * @description Тесты компонента MessageStatsFilters — фильтры периода и проекта для статистики сообщений.
 * Проверяет pill-кнопки периодов, дейтпикеры при custom, бейдж выбранного проекта.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MessageStatsFilters } from '../../features/messages/components/stats/MessageStatsFilters';

// Мок CustomDatePicker — рендерит простой input с data-testid
vi.mock('../../shared/components/pickers/CustomDatePicker', () => ({
    CustomDatePicker: ({ value, onChange, placeholder }: any) => (
        <input
            data-testid={`date-${placeholder}`}
            value={value}
            onChange={(e: any) => onChange(e.target.value)}
        />
    ),
}));

// Дефолтные пропсы
const defaultProps = {
    periodType: 'today' as const,
    onPeriodChange: vi.fn(),
    customStartDate: '',
    customEndDate: '',
    onCustomStartDateChange: vi.fn(),
    onCustomEndDateChange: vi.fn(),
    selectedProjectId: null as string | null,
    projectsMap: new Map<string, any>(),
    onClearProjectFilter: vi.fn(),
};

// Названия всех 8 pill-кнопок периодов
const PERIOD_LABELS = [
    'Сегодня',
    'Вчера',
    'Эта неделя',
    'Прошлая неделя',
    'Этот месяц',
    'Прошлый месяц',
    'Всё время',
    'Свой период',
];

describe('MessageStatsFilters', () => {
    it('рендерит label "Период:" и все 8 pill-кнопок', () => {
        render(<MessageStatsFilters {...defaultProps} />);

        expect(screen.getByText('Период:')).toBeInTheDocument();

        for (const label of PERIOD_LABELS) {
            expect(screen.getByText(label)).toBeInTheDocument();
        }
    });

    it('активная кнопка (today / "Сегодня") визуально выделена цветом', () => {
        render(<MessageStatsFilters {...defaultProps} periodType="today" />);

        // Активная pill-кнопка получает bg-indigo-100 text-indigo-700
        const activeBtn = screen.getByText('Сегодня').closest('button');
        expect(activeBtn).toHaveClass('bg-indigo-100');
        expect(activeBtn).toHaveClass('text-indigo-700');
    });

    it('неактивная кнопка НЕ имеет индиго-фона', () => {
        render(<MessageStatsFilters {...defaultProps} periodType="today" />);

        const inactiveBtn = screen.getByText('Вчера').closest('button');
        expect(inactiveBtn).toHaveClass('text-gray-600');
        expect(inactiveBtn).not.toHaveClass('bg-indigo-100');
    });

    it('клик по "Вчера" вызывает onPeriodChange("yesterday")', () => {
        const onPeriodChange = vi.fn();
        render(<MessageStatsFilters {...defaultProps} onPeriodChange={onPeriodChange} />);

        fireEvent.click(screen.getByText('Вчера'));
        expect(onPeriodChange).toHaveBeenCalledWith('yesterday');
    });

    it('при periodType="custom" рендерит 2 дейтпикера', () => {
        render(<MessageStatsFilters {...defaultProps} periodType={'custom' as any} />);

        // Дейтпикеры замоканы — ищем по data-testid с placeholder
        const datePickers = screen.getAllByTestId(/^date-/);
        expect(datePickers).toHaveLength(2);
    });

    it('при selectedProjectId рендерит бейдж проекта и клик закрытия вызывает onClearProjectFilter', () => {
        const projectsMap = new Map([
            ['proj-1', { id: 'proj-1', name: 'Тестовый проект' }],
        ]);
        const onClearProjectFilter = vi.fn();

        render(
            <MessageStatsFilters
                {...defaultProps}
                selectedProjectId="proj-1"
                projectsMap={projectsMap}
                onClearProjectFilter={onClearProjectFilter}
            />
        );

        // Бейдж с названием проекта
        expect(screen.getByText('Тестовый проект')).toBeInTheDocument();

        // Кнопка закрытия бейджа (SVG-иконка с title)
        const closeBtn = screen.getByTitle('Сбросить фильтр проекта');
        fireEvent.click(closeBtn);
        expect(onClearProjectFilter).toHaveBeenCalledTimes(1);
    });

    it('без selectedProjectId бейдж проекта не рендерится', () => {
        render(<MessageStatsFilters {...defaultProps} selectedProjectId={null} />);
        expect(screen.queryByTitle('Сбросить фильтр проекта')).not.toBeInTheDocument();
    });
});
