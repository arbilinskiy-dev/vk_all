/**
 * Тесты: OutgoingStatsTab — вкладка «Исходящие».
 * Дочерние компоненты замоканы — проверяем рендер блоков и проброс пропсов.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OutgoingStatsTab } from '../../features/messages/components/stats/OutgoingStatsTab';

// Мокаем дочерние компоненты
vi.mock('../../features/messages/components/stats/MessageStatsHelpers', () => ({
    SummaryCard: ({ label, value }: any) => (
        <div data-testid={`summary-${label}`}>{label}: {value}</div>
    ),
}));

vi.mock('../../features/messages/components/stats/MessageStatsChart', () => ({
    MessageStatsChart: ({ data }: any) => (
        <div data-testid="outgoing-chart">Chart ({data?.length ?? 0} точек)</div>
    ),
}));

vi.mock('../../features/messages/components/stats/AdminStatsTable', () => ({
    AdminStatsTable: ({ adminStats }: any) => (
        <div data-testid="admin-table">AdminStatsTable ({adminStats?.length ?? 0} записей)</div>
    ),
}));

vi.mock('../../features/messages/components/stats/ProjectsStatsTable', () => ({
    ProjectsStatsTable: ({ filteredProjectsStats }: any) => (
        <div data-testid="projects-table">ProjectsStatsTable ({filteredProjectsStats?.length ?? 0} проектов)</div>
    ),
}));

// Минимальная сводка — имена полей из реального MessageStatsGlobalSummary
const makeSummary = (overrides = {}) => ({
    total_incoming: 0,
    incoming_text: 0,
    incoming_payload: 0,
    incoming_dialogs: 0,
    incoming_text_dialogs: 0,
    incoming_payload_dialogs: 0,
    unique_users: 0,
    unique_text_users: 0,
    unique_payload_users: 0,
    total_outgoing: 200,
    outgoing_system: 120,
    outgoing_bot: 80,
    outgoing_recipients: 55,
    outgoing_users: 50,
    unique_dialogs: 45,
    ...overrides,
});

// Дефолтные пропсы
const defaultProps = {
    displaySummary: makeSummary(),
    chartData: [],
    filteredProjectsStats: [],
    selectedProjectId: null,
    projectsMap: new Map(),
    expandedProjects: new Set<string>(),
    usersDataMap: {},
    directionFilter: 'all' as const,
    projectSearch: '',
    activeTab: 'outgoing' as const,
    toggleProjectExpand: vi.fn(),
    handleProjectFilter: vi.fn(),
    setProjectSearch: vi.fn(),
    filterUsersByDirection: vi.fn((users: any[]) => users),
    adminStats: [],
    expandedAdmins: new Set<string>(),
    adminDialogsMap: {},
    toggleAdminExpand: vi.fn(),
    onNavigateToChat: undefined,
    onSelectChatUser: vi.fn(),
    activeChatUser: null,
};

describe('OutgoingStatsTab', () => {

    it('рендерит 4 SummaryCard (исходящие метрики)', () => {
        render(<OutgoingStatsTab {...defaultProps} />);

        expect(screen.getByText(/Исходящих всего/)).toBeInTheDocument();
        expect(screen.getByText(/Администратор/)).toBeInTheDocument();
        // «Бот / рассылка» — замокано через SummaryCard
        expect(screen.getByText(/рассылка/)).toBeInTheDocument();
        expect(screen.getByText(/Получателей/)).toBeInTheDocument();
    });

    it('рендерит 3 detail-карточки (уник. пользователей, диалогов, проектов)', () => {
        render(<OutgoingStatsTab {...defaultProps} displaySummary={makeSummary({
            outgoing_users: 50,
            unique_dialogs: 45,
        })} />);

        // detail-карточки рендерят числа через toLocaleString()
        expect(screen.getByText('Уник. пользователей (исх.)')).toBeInTheDocument();
        expect(screen.getByText('Уник. диалогов')).toBeInTheDocument();
        expect(screen.getByText('Проектов с исходящими')).toBeInTheDocument();
    });

    it('рендерит график исходящих', () => {
        render(
            <OutgoingStatsTab
                {...defaultProps}
                chartData={[{ ts: 1 }, { ts: 2 }, { ts: 3 }] as any}
            />
        );
        expect(screen.getByTestId('outgoing-chart')).toHaveTextContent('3 точек');
    });

    it('рендерит таблицу администраторов', () => {
        render(
            <OutgoingStatsTab
                {...defaultProps}
                adminStats={[{ sender_id: 's1' }, { sender_id: 's2' }] as any}
            />
        );
        expect(screen.getByTestId('admin-table')).toHaveTextContent('2 записей');
    });

    it('рендерит таблицу проектов', () => {
        render(
            <OutgoingStatsTab
                {...defaultProps}
                filteredProjectsStats={[{ project_id: 'p1' }] as any}
            />
        );
        expect(screen.getByTestId('projects-table')).toHaveTextContent('1 проектов');
    });

    it('отображает значения из displaySummary в SummaryCard', () => {
        render(<OutgoingStatsTab {...defaultProps} displaySummary={makeSummary({ total_outgoing: 777 })} />);
        // SummaryCard замокан — рендерит label: value
        expect(screen.getByTestId('summary-Исходящих всего')).toHaveTextContent('777');
    });
});
