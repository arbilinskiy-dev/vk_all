/**
 * Тесты: IncomingStatsTab — вкладка «Входящие».
 * Дочерние компоненты замоканы — проверяем рендер блоков и проброс пропсов.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IncomingStatsTab } from '../../features/messages/components/stats/IncomingStatsTab';

// Мокаем дочерние компоненты
vi.mock('../../features/messages/components/stats/MessageStatsHelpers', () => ({
    SummaryCard: ({ label, value, onClick, active }: any) => (
        <div data-testid={`summary-${label}`} data-active={active ? 'true' : 'false'}>
            {label}: {value}
            {onClick && <button data-testid={`click-${label}`} onClick={onClick}>click</button>}
        </div>
    ),
}));

vi.mock('../../features/messages/components/stats/MessageStatsChart', () => ({
    MessageStatsChart: ({ data }: any) => (
        <div data-testid="incoming-chart">MessageStatsChart ({data?.length ?? 0} точек)</div>
    ),
}));

vi.mock('../../features/messages/components/stats/ProjectsStatsTable', () => ({
    ProjectsStatsTable: ({ filteredProjectsStats }: any) => (
        <div data-testid="projects-table">ProjectsStatsTable ({filteredProjectsStats?.length ?? 0} проектов)</div>
    ),
}));

// Минимальная сводка для рендера
const makeSummary = (overrides = {}) => ({
    total_incoming: 100,
    incoming_text: 60,
    incoming_payload: 40,
    incoming_dialogs: 30,
    incoming_text_dialogs: 20,
    incoming_payload_dialogs: 10,
    unique_users: 50,
    unique_text_users: 35,
    unique_payload_users: 15,
    total_outgoing: 0,
    outgoing_admin: 0,
    outgoing_bot: 0,
    unique_outgoing_users: 0,
    unique_outgoing_dialogs: 0,
    projects_with_outgoing: 0,
    ...overrides,
});

// Дефолтные пропсы
const defaultProps = {
    displaySummary: makeSummary(),
    incomingSubFilter: 'all' as const,
    setIncomingSubFilter: vi.fn(),
    toggleIncomingSubFilter: vi.fn(),
    filteredChartData: [],
    selectedProjectId: null,
    projectsMap: new Map(),
    displayProjectsStats: [],
    expandedProjects: new Set<string>(),
    usersDataMap: {},
    directionFilter: 'all' as const,
    projectSearch: '',
    activeTab: 'incoming' as const,
    toggleProjectExpand: vi.fn(),
    handleProjectFilter: vi.fn(),
    setProjectSearch: vi.fn(),
    filterUsersByDirection: vi.fn((users: any[]) => users),
    onNavigateToChat: undefined,
    onSelectChatUser: vi.fn(),
    activeChatUser: null,
};

describe('IncomingStatsTab', () => {

    it('рендерит 3 группы SummaryCard: Сообщения, Диалоги, Пользователи', () => {
        render(<IncomingStatsTab {...defaultProps} />);

        // Группа «Сообщения» — 3 карточки
        expect(screen.getByText(/Всего входящих/)).toBeInTheDocument();
        expect(screen.getByText(/По кнопке/)).toBeInTheDocument();
        expect(screen.getByText(/Реальные/)).toBeInTheDocument();

        // Группа «Диалоги» — 3 карточки
        expect(screen.getByText(/Всего диалогов/)).toBeInTheDocument();

        // Группа «Пользователи» — 3 карточки
        expect(screen.getByText(/Уник. юзеров/)).toBeInTheDocument();
    });

    it('рендерит график входящих', () => {
        render(
            <IncomingStatsTab
                {...defaultProps}
                filteredChartData={[{ ts: 1 }, { ts: 2 }] as any}
            />
        );
        expect(screen.getByTestId('incoming-chart')).toHaveTextContent('2 точек');
    });

    it('рендерит таблицу проектов', () => {
        render(
            <IncomingStatsTab
                {...defaultProps}
                displayProjectsStats={[{ project_id: 'p1' }, { project_id: 'p2' }] as any}
            />
        );
        expect(screen.getByTestId('projects-table')).toHaveTextContent('2 проектов');
    });

    it('заголовки групп содержат подписи: Сообщения, Диалоги, Пользователи', () => {
        render(<IncomingStatsTab {...defaultProps} />);
        expect(screen.getByText('Сообщения')).toBeInTheDocument();
        expect(screen.getByText('Диалоги')).toBeInTheDocument();
        expect(screen.getByText('Пользователи')).toBeInTheDocument();
    });

    it('отображает значения из displaySummary', () => {
        render(<IncomingStatsTab {...defaultProps} displaySummary={makeSummary({ total_incoming: 999 })} />);
        expect(screen.getByText(/999/)).toBeInTheDocument();
    });
});
