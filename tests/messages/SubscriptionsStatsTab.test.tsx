/**
 * Тесты: SubscriptionsStatsTab — вкладка «Подписки / Отписки».
 * Проверяем: лоадер, сводку, дочерние компоненты (замоканы).
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SubscriptionsStatsTab } from '../../features/messages/components/stats/SubscriptionsStatsTab';

// Мокаем дочерние компоненты — проверяем что они вызываются с пропсами
vi.mock('../../features/messages/components/stats/MessageStatsHelpers', () => ({
    SummaryCard: ({ label, value, color }: any) => (
        <div data-testid={`summary-${label}`}>{label}: {value} ({color})</div>
    ),
}));

vi.mock('../../features/messages/components/stats/SubscriptionsChart', () => ({
    SubscriptionsChart: ({ data }: any) => (
        <div data-testid="subs-chart">SubscriptionsChart ({data.length} точек)</div>
    ),
}));

vi.mock('../../features/messages/components/stats/SubscriptionsProjectsTable', () => ({
    SubscriptionsProjectsTable: ({ projects }: any) => (
        <div data-testid="subs-projects-table">SubscriptionsProjectsTable ({projects.length} проектов)</div>
    ),
}));

// Минимальные дефолтные пропсы
const defaultProps = {
    subsLoading: false,
    subsSummary: null,
    subsChart: [],
    selectedProjectId: null,
    projectsMap: new Map(),
    filteredSubsProjects: [],
    subsExpandedProjects: new Set<string>(),
    subsUsersMap: {},
    projectSearch: '',
    setProjectSearch: vi.fn(),
    toggleSubsProjectExpand: vi.fn(),
};

describe('SubscriptionsStatsTab', () => {

    it('показывает лоадер при subsLoading=true и нет данных', () => {
        render(<SubscriptionsStatsTab {...defaultProps} subsLoading={true} />);
        expect(screen.getByText('Загрузка данных подписок...')).toBeInTheDocument();
    });

    it('НЕ показывает лоадер если уже есть данные (subsSummary)', () => {
        render(
            <SubscriptionsStatsTab
                {...defaultProps}
                subsLoading={true}
                subsSummary={{ total_allow: 10, total_deny: 5 } as any}
            />
        );
        expect(screen.queryByText('Загрузка данных подписок...')).not.toBeInTheDocument();
    });

    it('рендерит сводку подписок/отписок при наличии subsSummary', () => {
        render(
            <SubscriptionsStatsTab
                {...defaultProps}
                subsSummary={{ total_allow: 42, total_deny: 7 } as any}
            />
        );
        // SummaryCard замокан — проверяем что label и value передались
        expect(screen.getByTestId('summary-Подписок (allow)')).toHaveTextContent('42');
        expect(screen.getByTestId('summary-Отписок (deny)')).toHaveTextContent('7');
    });

    it('рендерит график и таблицу при наличии subsSummary', () => {
        render(
            <SubscriptionsStatsTab
                {...defaultProps}
                subsSummary={{ total_allow: 10, total_deny: 5 } as any}
                subsChart={[{ date: '2026-01-01' }, { date: '2026-01-02' }] as any}
                filteredSubsProjects={[{ project_id: 'p1' }] as any}
            />
        );
        expect(screen.getByTestId('subs-chart')).toHaveTextContent('2 точек');
        expect(screen.getByTestId('subs-projects-table')).toHaveTextContent('1 проектов');
    });

    it('без subsSummary не рендерит ни сводку ни график', () => {
        render(<SubscriptionsStatsTab {...defaultProps} subsSummary={null} />);
        expect(screen.queryByTestId('summary-Подписок (allow)')).not.toBeInTheDocument();
        expect(screen.queryByTestId('subs-chart')).not.toBeInTheDocument();
    });

    it('заголовок графика содержит имя проекта при selectedProjectId', () => {
        const projectsMap = new Map([['proj-1', { id: 'proj-1', name: 'Мой проект' }]]);
        render(
            <SubscriptionsStatsTab
                {...defaultProps}
                subsSummary={{ total_allow: 1, total_deny: 0 } as any}
                selectedProjectId="proj-1"
                projectsMap={projectsMap as any}
            />
        );
        expect(screen.getByText(/Мой проект/)).toBeInTheDocument();
    });
});
