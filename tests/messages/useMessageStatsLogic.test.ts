/**
 * Smoke-тест: хаб-хук useMessageStatsLogic — P0.
 * Проверяем:
 * — все 35 state-полей присутствуют
 * — все 21 action-функций присутствуют и являются функциями
 * — loadDashboard вызывает 4 API параллельно
 * — ошибка API → error в state
 * — начальное состояние (isLoading=true)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Project } from '../../shared/types';

// Мокаем ВСЕ API-модули, которые используются суб-хуками
const mockFetchSummary = vi.fn();
const mockFetchProjects = vi.fn();
const mockFetchChart = vi.fn();
const mockFetchAdminStats = vi.fn();
const mockFetchAdminDialogs = vi.fn();
const mockFetchMessageStatsUsers = vi.fn();
const mockSyncMessageStatsFromLogs = vi.fn();
const mockGetSyncFromLogsStatus = vi.fn();
const mockReconcileMessageStats = vi.fn();

vi.mock('../../services/api/messages_stats.api', () => ({
    fetchMessageStatsSummary: (...args: any[]) => mockFetchSummary(...args),
    fetchMessageStatsProjects: (...args: any[]) => mockFetchProjects(...args),
    fetchMessageStatsChart: (...args: any[]) => mockFetchChart(...args),
    fetchAdminStats: (...args: any[]) => mockFetchAdminStats(...args),
    fetchAdminDialogs: (...args: any[]) => mockFetchAdminDialogs(...args),
    fetchMessageStatsUsers: (...args: any[]) => mockFetchMessageStatsUsers(...args),
    syncMessageStatsFromLogs: (...args: any[]) => mockSyncMessageStatsFromLogs(...args),
    getSyncFromLogsStatus: (...args: any[]) => mockGetSyncFromLogsStatus(...args),
    reconcileMessageStats: (...args: any[]) => mockReconcileMessageStats(...args),
}));

const mockFetchSubsSummary = vi.fn();
const mockFetchSubsChart = vi.fn();
const mockFetchSubsProjects = vi.fn();
const mockFetchSubsProjectUsers = vi.fn();

vi.mock('../../services/api/message_subscriptions.api', () => ({
    fetchSubscriptionsSummary: (...args: any[]) => mockFetchSubsSummary(...args),
    fetchSubscriptionsChart: (...args: any[]) => mockFetchSubsChart(...args),
    fetchSubscriptionsProjects: (...args: any[]) => mockFetchSubsProjects(...args),
    fetchSubscriptionsProjectUsers: (...args: any[]) => mockFetchSubsProjectUsers(...args),
}));

import { useMessageStatsLogic } from '../../features/messages/components/stats/useMessageStatsLogic';

// =============================================================================
// Мок-данные
// =============================================================================

const mockProjects: Project[] = [
    { id: 'proj-1', name: 'Проект Альфа' },
    { id: 'proj-2', name: 'Проект Бета' },
];

function setupSuccessfulApi() {
    mockFetchSummary.mockResolvedValue({
        success: true,
        total_projects: 2,
        total_incoming: 200,
        total_outgoing: 100,
        total_messages: 300,
        unique_users: 20,
        incoming_users: 15,
        outgoing_users: 8,
        incoming_payload: 60,
        incoming_text: 140,
        outgoing_system: 40,
        outgoing_bot: 60,
        unique_text_users: 10,
        unique_payload_users: 6,
        unique_dialogs: 16,
        incoming_dialogs: 12,
        dialogs_with_text: 10,
        dialogs_with_payload: 6,
        outgoing_recipients: 8,
    });
    mockFetchProjects.mockResolvedValue({
        success: true,
        projects: [
            {
                project_id: 'proj-1',
                total_incoming: 100, total_outgoing: 50, total_messages: 150,
                unique_users: 10, incoming_users: 7, outgoing_users: 3,
                incoming_payload: 30, incoming_text: 70,
                outgoing_system: 20, outgoing_bot: 30,
                unique_text_users: 5, unique_payload_users: 3,
                unique_dialogs: 8, incoming_dialogs: 6,
                dialogs_with_text: 5, dialogs_with_payload: 3,
                outgoing_recipients: 4,
            },
        ],
    });
    mockFetchChart.mockResolvedValue({
        success: true,
        chart: [{ hour_slot: '2026-03-06T12:00:00', incoming: 10, outgoing: 5, total: 15, unique_users: 3 }],
    });
    mockFetchAdminStats.mockResolvedValue({
        success: true,
        admins: [{ sender_id: 'a1', sender_name: 'Иванов', messages_sent: 50, unique_dialogs: 10, projects_count: 2 }],
    });
}

// =============================================================================
// Тесты
// =============================================================================

describe('useMessageStatsLogic (hub)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('contract: state + actions полноценный набор', () => {
        it('возвращает объект с ключами state и actions', () => {
            // Не резолвим промисы — проверяем только структуру
            mockFetchSummary.mockReturnValue(new Promise(() => {}));
            mockFetchProjects.mockReturnValue(new Promise(() => {}));
            mockFetchChart.mockReturnValue(new Promise(() => {}));
            mockFetchAdminStats.mockReturnValue(new Promise(() => {}));

            const { result } = renderHook(() => useMessageStatsLogic(mockProjects));

            expect(result.current).toHaveProperty('state');
            expect(result.current).toHaveProperty('actions');
        });

        it('state содержит все 35 полей', () => {
            mockFetchSummary.mockReturnValue(new Promise(() => {}));
            mockFetchProjects.mockReturnValue(new Promise(() => {}));
            mockFetchChart.mockReturnValue(new Promise(() => {}));
            mockFetchAdminStats.mockReturnValue(new Promise(() => {}));

            const { result } = renderHook(() => useMessageStatsLogic(mockProjects));
            const stateKeys = Object.keys(result.current.state);

            const expectedStateKeys = [
                'summary', 'chartData', 'isLoading', 'error',
                'periodType', 'customStartDate', 'customEndDate',
                'selectedProjectId', 'projectSearch', 'directionFilter',
                'expandedProjects', 'usersDataMap',
                'isSyncing', 'syncResult', 'syncProgress',
                'isReconciling', 'reconcileResult', 'reconcileProgress',
                'projectsMap',
                'filteredProjectsStats', 'displayProjectsStats',
                'filteredChartData', 'incomingSubFilter', 'displaySummary',
                'adminStats', 'expandedAdmins', 'adminDialogsMap',
                'activeTab',
                'subsSummary', 'subsChart', 'subsLoading', 'subsLoaded',
                'filteredSubsProjects', 'subsExpandedProjects', 'subsUsersMap',
                'selectedEmployeeName', 'mergedAdminStats',
                'employeeDialogs', 'employeeLoading',
                'employeeProjectsGrouped', 'employeeSummary',
            ];

            for (const key of expectedStateKeys) {
                expect(stateKeys, `state должен содержать ключ "${key}"`).toContain(key);
            }
        });

        it('actions содержит все 21 функцию', () => {
            mockFetchSummary.mockReturnValue(new Promise(() => {}));
            mockFetchProjects.mockReturnValue(new Promise(() => {}));
            mockFetchChart.mockReturnValue(new Promise(() => {}));
            mockFetchAdminStats.mockReturnValue(new Promise(() => {}));

            const { result } = renderHook(() => useMessageStatsLogic(mockProjects));
            const actionKeys = Object.keys(result.current.actions);

            const expectedActionKeys = [
                'loadDashboard',
                'setPeriodType', 'setCustomStartDate', 'setCustomEndDate',
                'setSelectedProjectId', 'setProjectSearch',
                'toggleProjectExpand', 'handleProjectFilter',
                'handleSyncFromLogs', 'setSyncResult',
                'handleReconcile', 'setReconcileResult',
                'toggleDirectionFilter', 'filterUsersByDirection',
                'toggleAdminExpand', 'setActiveTab',
                'toggleIncomingSubFilter', 'setIncomingSubFilter',
                'loadSubscriptions', 'toggleSubsProjectExpand',
                'selectEmployee',
            ];

            for (const key of expectedActionKeys) {
                expect(actionKeys, `actions должен содержать ключ "${key}"`).toContain(key);
                expect(typeof result.current.actions[key as keyof typeof result.current.actions]).toBe('function');
            }
        });
    });

    describe('loadDashboard', () => {
        it('начинает с isLoading=true', () => {
            mockFetchSummary.mockReturnValue(new Promise(() => {}));
            mockFetchProjects.mockReturnValue(new Promise(() => {}));
            mockFetchChart.mockReturnValue(new Promise(() => {}));
            mockFetchAdminStats.mockReturnValue(new Promise(() => {}));

            const { result } = renderHook(() => useMessageStatsLogic(mockProjects));

            expect(result.current.state.isLoading).toBe(true);
            expect(result.current.state.error).toBeNull();
        });

        it('успешная загрузка: заполняет summary, projectsStats, chartData, adminStats', async () => {
            setupSuccessfulApi();

            const { result } = renderHook(() => useMessageStatsLogic(mockProjects));

            await waitFor(() => {
                expect(result.current.state.isLoading).toBe(false);
            });

            expect(result.current.state.summary).not.toBeNull();
            expect(result.current.state.summary!.total_messages).toBe(300);
            expect(result.current.state.chartData).toHaveLength(1);
            expect(result.current.state.adminStats).toHaveLength(1);
            expect(result.current.state.error).toBeNull();
        });

        it('вызывает 4 API-функции параллельно', async () => {
            setupSuccessfulApi();

            renderHook(() => useMessageStatsLogic(mockProjects));

            await waitFor(() => {
                expect(mockFetchSummary).toHaveBeenCalledTimes(1);
            });

            expect(mockFetchProjects).toHaveBeenCalledTimes(1);
            expect(mockFetchChart).toHaveBeenCalledTimes(1);
            expect(mockFetchAdminStats).toHaveBeenCalledTimes(1);
        });

        it('ошибка API → error в state', async () => {
            mockFetchSummary.mockRejectedValue(new Error('Сетевая ошибка'));
            mockFetchProjects.mockResolvedValue({ success: true, projects: [] });
            mockFetchChart.mockResolvedValue({ success: true, chart: [] });
            mockFetchAdminStats.mockResolvedValue({ success: true, admins: [] });

            const { result } = renderHook(() => useMessageStatsLogic(mockProjects));

            await waitFor(() => {
                expect(result.current.state.isLoading).toBe(false);
            });

            expect(result.current.state.error).toBe('Сетевая ошибка');
        });
    });

    describe('интеграция под-хуков', () => {
        it('filters.state пробрасывается в state', async () => {
            setupSuccessfulApi();
            const { result } = renderHook(() => useMessageStatsLogic(mockProjects));

            await waitFor(() => {
                expect(result.current.state.isLoading).toBe(false);
            });

            // Проверяем, что фильтры работают
            expect(result.current.state.periodType).toBe('today');
            expect(result.current.state.activeTab).toBe('incoming');
            expect(result.current.state.directionFilter).toBe('all');
            expect(result.current.state.projectsMap.size).toBe(2);
        });

        it('employees.state пробрасывается в state', async () => {
            setupSuccessfulApi();
            const { result } = renderHook(() => useMessageStatsLogic(mockProjects));

            await waitFor(() => {
                expect(result.current.state.isLoading).toBe(false);
            });

            // mergedAdminStats содержит данные из adminStats
            expect(result.current.state.mergedAdminStats).toHaveLength(1);
            expect(result.current.state.mergedAdminStats[0].sender_name).toBe('Иванов');
            expect(result.current.state.selectedEmployeeName).toBeNull();
            expect(result.current.state.employeeDialogs).toEqual([]);
        });

        it('sync.state пробрасывается в state (начальные значения)', () => {
            mockFetchSummary.mockReturnValue(new Promise(() => {}));
            mockFetchProjects.mockReturnValue(new Promise(() => {}));
            mockFetchChart.mockReturnValue(new Promise(() => {}));
            mockFetchAdminStats.mockReturnValue(new Promise(() => {}));

            const { result } = renderHook(() => useMessageStatsLogic(mockProjects));

            expect(result.current.state.isSyncing).toBe(false);
            expect(result.current.state.syncResult).toBeNull();
            expect(result.current.state.syncProgress).toBeNull();
            expect(result.current.state.isReconciling).toBe(false);
            expect(result.current.state.reconcileResult).toBeNull();
            expect(result.current.state.reconcileProgress).toBeNull();
        });

        it('admins.state пробрасывается в state (начальные значения)', () => {
            mockFetchSummary.mockReturnValue(new Promise(() => {}));
            mockFetchProjects.mockReturnValue(new Promise(() => {}));
            mockFetchChart.mockReturnValue(new Promise(() => {}));
            mockFetchAdminStats.mockReturnValue(new Promise(() => {}));

            const { result } = renderHook(() => useMessageStatsLogic(mockProjects));

            expect(result.current.state.expandedAdmins).toBeInstanceOf(Set);
            expect(result.current.state.expandedAdmins.size).toBe(0);
            expect(result.current.state.adminDialogsMap).toEqual({});
        });

        it('subscriptions.state пробрасывается в state (начальные значения)', () => {
            mockFetchSummary.mockReturnValue(new Promise(() => {}));
            mockFetchProjects.mockReturnValue(new Promise(() => {}));
            mockFetchChart.mockReturnValue(new Promise(() => {}));
            mockFetchAdminStats.mockReturnValue(new Promise(() => {}));

            const { result } = renderHook(() => useMessageStatsLogic(mockProjects));

            expect(result.current.state.subsSummary).toBeNull();
            expect(result.current.state.subsChart).toEqual([]);
            expect(result.current.state.subsLoading).toBe(false);
            expect(result.current.state.subsLoaded).toBe(false);
            expect(result.current.state.filteredSubsProjects).toEqual([]);
            expect(result.current.state.subsExpandedProjects).toBeInstanceOf(Set);
            expect(result.current.state.subsUsersMap).toEqual({});
        });
    });
});
