/**
 * Тесты: MessageStatsPage (Hub) — главная страница мониторинга сообщений.
 * useMessageStatsLogic замокан — проверяем рендер дочерних компонентов
 * в зависимости от state (скелетон, ошибка, вкладки).
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageStatsPage } from '../../features/messages/components/stats/MessageStatsPage';

// --- Моки дочерних компонентов ---

vi.mock('../../features/messages/components/stats/MessageStatsSkeleton', () => ({
    MessageStatsSkeleton: () => <div data-testid="skeleton">Скелетон</div>,
}));

vi.mock('../../features/messages/components/stats/MonitoringChatPanel', () => ({
    MonitoringChatPanel: ({ onClose }: any) => (
        <div data-testid="chat-panel"><button onClick={onClose}>Закрыть чат</button></div>
    ),
    // Тип MonitoringChatUser нужен для импорта
}));

vi.mock('../../features/messages/components/stats/MessageStatsHeader', () => ({
    MessageStatsHeader: (props: any) => <div data-testid="header">Header</div>,
}));

vi.mock('../../features/messages/components/stats/MessageStatsNotifications', () => ({
    MessageStatsNotifications: () => <div data-testid="notifications">Notifications</div>,
}));

vi.mock('../../features/messages/components/stats/MessageStatsTabBar', () => ({
    MessageStatsTabBar: ({ activeTab, onTabChange }: any) => (
        <div data-testid="tab-bar">
            <button data-testid="tab-outgoing" onClick={() => onTabChange('outgoing')}>Исходящие</button>
            <button data-testid="tab-subscriptions" onClick={() => onTabChange('subscriptions')}>Подписки</button>
            <span>active: {activeTab}</span>
        </div>
    ),
}));

vi.mock('../../features/messages/components/stats/MessageStatsFilters', () => ({
    MessageStatsFilters: () => <div data-testid="filters">Filters</div>,
}));

vi.mock('../../features/messages/components/stats/IncomingStatsTab', () => ({
    IncomingStatsTab: () => <div data-testid="incoming-tab">IncomingStatsTab</div>,
}));

vi.mock('../../features/messages/components/stats/OutgoingStatsTab', () => ({
    OutgoingStatsTab: () => <div data-testid="outgoing-tab">OutgoingStatsTab</div>,
}));

vi.mock('../../features/messages/components/stats/SubscriptionsStatsTab', () => ({
    SubscriptionsStatsTab: () => <div data-testid="subscriptions-tab">SubscriptionsStatsTab</div>,
}));

vi.mock('../../features/messages/components/stats/EmployeeStatsTab', () => ({
    EmployeeStatsTab: () => <div data-testid="employees-tab">EmployeeStatsTab</div>,
}));

// --- Мок useMessageStatsLogic ---

const mockActions = {
    loadDashboard: vi.fn(),
    handleReconcile: vi.fn(),
    handleSyncFromLogs: vi.fn(),
    setSyncResult: vi.fn(),
    setReconcileResult: vi.fn(),
    setActiveTab: vi.fn(),
    setPeriodType: vi.fn(),
    setCustomStartDate: vi.fn(),
    setCustomEndDate: vi.fn(),
    setSelectedProjectId: vi.fn(),
    setIncomingSubFilter: vi.fn(),
    toggleIncomingSubFilter: vi.fn(),
    toggleProjectExpand: vi.fn(),
    handleProjectFilter: vi.fn(),
    setProjectSearch: vi.fn(),
    filterUsersByDirection: vi.fn((u: any[]) => u),
    toggleAdminExpand: vi.fn(),
    toggleSubsProjectExpand: vi.fn(),
    selectEmployee: vi.fn(),
};

const makeState = (overrides = {}) => ({
    isLoading: false,
    error: null as string | null,
    summary: { total_incoming: 10, total_outgoing: 5 },
    displaySummary: { total_incoming: 10, total_outgoing: 5 },
    activeTab: 'incoming' as any,
    periodType: 'today' as any,
    customStartDate: '',
    customEndDate: '',
    selectedProjectId: null,
    projectsMap: new Map(),
    chartData: [],
    filteredChartData: [],
    filteredProjectsStats: [],
    displayProjectsStats: [],
    expandedProjects: new Set<string>(),
    usersDataMap: {},
    directionFilter: 'all' as any,
    projectSearch: '',
    incomingSubFilter: 'all' as any,
    adminStats: [],
    expandedAdmins: new Set<string>(),
    adminDialogsMap: {},
    mergedAdminStats: [],
    selectedEmployeeName: null,
    employeeLoading: false,
    employeeProjectsGrouped: [],
    employeeSummary: null,
    // Синхронизация/сверка
    isSyncing: false,
    syncProgress: null,
    syncResult: null,
    isReconciling: false,
    reconcileProgress: null,
    reconcileResult: null,
    // Подписки
    subsLoading: false,
    subsSummary: null,
    subsChart: [],
    filteredSubsProjects: [],
    subsExpandedProjects: new Set<string>(),
    subsUsersMap: {},
    ...overrides,
});

// Переменная для динамической подмены state
let currentState = makeState();

vi.mock('../../features/messages/components/stats/useMessageStatsLogic', () => ({
    useMessageStatsLogic: () => ({
        state: currentState,
        actions: mockActions,
    }),
}));

const projects = [{ id: 'p1', name: 'Проект 1' }] as any;

describe('MessageStatsPage', () => {

    beforeEach(() => {
        currentState = makeState();
        vi.clearAllMocks();
    });

    // --- Скелетон ---

    it('показывает скелетон при isLoading=true и нет summary', () => {
        currentState = makeState({ isLoading: true, summary: null });
        render(<MessageStatsPage projects={projects} />);
        expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    // --- Ошибка ---

    it('показывает ошибку и кнопку «Повторить»', () => {
        currentState = makeState({ error: 'Сетевая ошибка', summary: null });
        render(<MessageStatsPage projects={projects} />);
        expect(screen.getByText('Сетевая ошибка')).toBeInTheDocument();
        expect(screen.getByText('Повторить')).toBeInTheDocument();
    });

    it('клик «Повторить» вызывает loadDashboard', () => {
        currentState = makeState({ error: 'Ошибка', summary: null });
        render(<MessageStatsPage projects={projects} />);
        fireEvent.click(screen.getByText('Повторить'));
        expect(mockActions.loadDashboard).toHaveBeenCalledOnce();
    });

    // --- Основной рендер ---

    it('рендерит Header, Notifications, TabBar, Filters', () => {
        render(<MessageStatsPage projects={projects} />);
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('notifications')).toBeInTheDocument();
        expect(screen.getByTestId('tab-bar')).toBeInTheDocument();
        expect(screen.getByTestId('filters')).toBeInTheDocument();
    });

    // --- Вкладка «Входящие» ---

    it('вкладка incoming рендерит IncomingStatsTab при наличии displaySummary', () => {
        currentState = makeState({ activeTab: 'incoming' });
        render(<MessageStatsPage projects={projects} />);
        expect(screen.getByTestId('incoming-tab')).toBeInTheDocument();
        expect(screen.queryByTestId('outgoing-tab')).not.toBeInTheDocument();
    });

    // --- Вкладка «Исходящие» ---

    it('вкладка outgoing рендерит OutgoingStatsTab', () => {
        currentState = makeState({ activeTab: 'outgoing' });
        render(<MessageStatsPage projects={projects} />);
        expect(screen.getByTestId('outgoing-tab')).toBeInTheDocument();
        expect(screen.queryByTestId('incoming-tab')).not.toBeInTheDocument();
    });

    // --- Вкладка «Подписки» ---

    it('вкладка subscriptions рендерит SubscriptionsStatsTab', () => {
        currentState = makeState({ activeTab: 'subscriptions' });
        render(<MessageStatsPage projects={projects} />);
        expect(screen.getByTestId('subscriptions-tab')).toBeInTheDocument();
    });

    // --- Вкладка «Сотрудники» ---

    it('вкладка employees рендерит EmployeeStatsTab', () => {
        currentState = makeState({ activeTab: 'employees' });
        render(<MessageStatsPage projects={projects} />);
        expect(screen.getByTestId('employees-tab')).toBeInTheDocument();
    });

    // --- Панель чата не показывается по умолчанию ---

    it('панель чата не рендерится по умолчанию', () => {
        render(<MessageStatsPage projects={projects} />);
        expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument();
    });
});
