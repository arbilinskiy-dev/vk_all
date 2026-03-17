/**
 * Тесты: хук useEmployeesLogic — P0.
 * Проверяем:
 * — mergedAdminStats: объединение по имени, суммирование, сортировка
 * — selectEmployee: toggle-поведение (выбор / сброс)
 * — loadEmployeeDialogsByName: параллельная загрузка + дедупликация диалогов
 * — employeeProjectsGrouped: группировка по проектам, фильтр поиска, сортировка
 * — employeeSummary: сводка по выбранному сотруднику
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { AdminStatsItem, AdminDialogItem } from '../../services/api/messages_stats.api';
import type { Project } from '../../shared/types';

// Мокаем API
const mockFetchAdminDialogs = vi.fn();
vi.mock('../../services/api/messages_stats.api', () => ({
    fetchAdminDialogs: (...args: any[]) => mockFetchAdminDialogs(...args),
}));

import { useEmployeesLogic } from '../../features/messages/components/stats/useEmployeesLogic';

// =============================================================================
// Фабрики мок-данных
// =============================================================================

function createAdminStats(overrides: Partial<AdminStatsItem> = {}): AdminStatsItem {
    return {
        sender_id: 'admin-1',
        sender_name: 'Иванов Иван',
        messages_sent: 50,
        unique_dialogs: 10,
        projects_count: 2,
        ...overrides,
    };
}

function createDialog(overrides: Partial<AdminDialogItem> = {}): AdminDialogItem {
    return {
        project_id: 'proj-1',
        vk_user_id: 1001,
        messages_sent: 5,
        first_name: 'Тест',
        last_name: 'Юзер',
        photo_url: null,
        ...overrides,
    };
}

// =============================================================================
// Дефолтные параметры
// =============================================================================

const projectsMap = new Map<string, Project>([
    ['proj-1', { id: 'proj-1', name: 'Проект Альфа' }],
    ['proj-2', { id: 'proj-2', name: 'Проект Бета' }],
]);

const defaultParams = {
    dateFrom: '2026-03-01',
    dateTo: '2026-03-06',
    adminStats: [] as AdminStatsItem[],
    projectSearch: '',
    projectsMap,
};

function renderEmployees(overrides: Partial<typeof defaultParams> = {}) {
    const params = { ...defaultParams, ...overrides };
    return renderHook(() => useEmployeesLogic(params));
}

// =============================================================================
// Тесты
// =============================================================================

describe('useEmployeesLogic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('mergedAdminStats', () => {
        it('пустой массив adminStats → пустой результат', () => {
            const { result } = renderEmployees({ adminStats: [] });

            expect(result.current.state.mergedAdminStats).toEqual([]);
        });

        it('один сотрудник без дублей → одна запись', () => {
            const { result } = renderEmployees({
                adminStats: [createAdminStats({ sender_id: 'a1', sender_name: 'Иванов' })],
            });

            expect(result.current.state.mergedAdminStats).toHaveLength(1);
            expect(result.current.state.mergedAdminStats[0].sender_name).toBe('Иванов');
            expect(result.current.state.mergedAdminStats[0].sender_ids).toEqual(['a1']);
        });

        it('два sender_id с одинаковым именем → объединение', () => {
            const stats = [
                createAdminStats({ sender_id: 'a1', sender_name: 'Иванов', messages_sent: 30, unique_dialogs: 5, projects_count: 1 }),
                createAdminStats({ sender_id: 'a2', sender_name: 'Иванов', messages_sent: 20, unique_dialogs: 3, projects_count: 2 }),
            ];
            const { result } = renderEmployees({ adminStats: stats });

            expect(result.current.state.mergedAdminStats).toHaveLength(1);
            const merged = result.current.state.mergedAdminStats[0];
            expect(merged.sender_name).toBe('Иванов');
            expect(merged.sender_ids).toEqual(['a1', 'a2']);
            expect(merged.messages_sent).toBe(50); // 30 + 20
            expect(merged.unique_dialogs).toBe(8); // 5 + 3
            expect(merged.projects_count).toBe(2); // max(1, 2)
        });

        it('сортировка по messages_sent (убывание)', () => {
            const stats = [
                createAdminStats({ sender_id: 'a1', sender_name: 'Мало', messages_sent: 10 }),
                createAdminStats({ sender_id: 'a2', sender_name: 'Много', messages_sent: 100 }),
                createAdminStats({ sender_id: 'a3', sender_name: 'Средне', messages_sent: 50 }),
            ];
            const { result } = renderEmployees({ adminStats: stats });

            const names = result.current.state.mergedAdminStats.map(m => m.sender_name);
            expect(names).toEqual(['Много', 'Средне', 'Мало']);
        });

        it('пустое имя → fallback на "ID {sender_id}"', () => {
            const stats = [
                createAdminStats({ sender_id: 'a1', sender_name: '' }),
                createAdminStats({ sender_id: 'a2', sender_name: '   ' }),
            ];
            const { result } = renderEmployees({ adminStats: stats });

            expect(result.current.state.mergedAdminStats).toHaveLength(2);
            expect(result.current.state.mergedAdminStats[0].sender_name).toBe('ID a1');
            expect(result.current.state.mergedAdminStats[1].sender_name).toBe('ID a2');
        });
    });

    describe('selectEmployee', () => {
        it('начальное состояние: selectedEmployeeName = null', () => {
            const { result } = renderEmployees();

            expect(result.current.state.selectedEmployeeName).toBeNull();
        });

        it('выбор null → ничего не происходит', () => {
            const { result } = renderEmployees();

            act(() => {
                result.current.actions.selectEmployee(null);
            });

            expect(result.current.state.selectedEmployeeName).toBeNull();
        });

        it('повторный выбор того же → сброс', async () => {
            const stats = [createAdminStats({ sender_id: 'a1', sender_name: 'Иванов' })];
            mockFetchAdminDialogs.mockResolvedValue({ dialogs: [], sender_id: 'a1', sender_name: 'Иванов' });

            const { result } = renderEmployees({ adminStats: stats });

            // Выбираем
            await act(async () => {
                result.current.actions.selectEmployee('Иванов');
            });
            expect(result.current.state.selectedEmployeeName).toBe('Иванов');

            // Повторный клик → сброс
            act(() => {
                result.current.actions.selectEmployee('Иванов');
            });
            expect(result.current.state.selectedEmployeeName).toBeNull();
            expect(result.current.state.employeeDialogs).toEqual([]);
        });
    });

    describe('loadEmployeeDialogsByName', () => {
        it('загружает диалоги для одного sender_id', async () => {
            const stats = [createAdminStats({ sender_id: 'a1', sender_name: 'Иванов' })];
            const dialogs = [
                createDialog({ project_id: 'proj-1', vk_user_id: 1001, messages_sent: 5 }),
                createDialog({ project_id: 'proj-2', vk_user_id: 1002, messages_sent: 3 }),
            ];
            mockFetchAdminDialogs.mockResolvedValue({ dialogs, sender_id: 'a1', sender_name: 'Иванов' });

            const { result } = renderEmployees({ adminStats: stats });

            await act(async () => {
                result.current.actions.selectEmployee('Иванов');
            });

            expect(mockFetchAdminDialogs).toHaveBeenCalledTimes(1);
            expect(result.current.state.employeeDialogs).toHaveLength(2);
            expect(result.current.state.employeeLoading).toBe(false);
        });

        it('параллельная загрузка для нескольких sender_id', async () => {
            const stats = [
                createAdminStats({ sender_id: 'a1', sender_name: 'Иванов', messages_sent: 30 }),
                createAdminStats({ sender_id: 'a2', sender_name: 'Иванов', messages_sent: 20 }),
            ];
            mockFetchAdminDialogs
                .mockResolvedValueOnce({
                    dialogs: [createDialog({ project_id: 'proj-1', vk_user_id: 1001, messages_sent: 5 })],
                    sender_id: 'a1', sender_name: 'Иванов',
                })
                .mockResolvedValueOnce({
                    dialogs: [createDialog({ project_id: 'proj-2', vk_user_id: 1002, messages_sent: 3 })],
                    sender_id: 'a2', sender_name: 'Иванов',
                });

            const { result } = renderEmployees({ adminStats: stats });

            await act(async () => {
                result.current.actions.selectEmployee('Иванов');
            });

            // Вызван для обоих sender_id
            expect(mockFetchAdminDialogs).toHaveBeenCalledTimes(2);
            expect(result.current.state.employeeDialogs).toHaveLength(2);
        });

        it('дедупликация диалогов по project_id + vk_user_id', async () => {
            const stats = [
                createAdminStats({ sender_id: 'a1', sender_name: 'Иванов', messages_sent: 30 }),
                createAdminStats({ sender_id: 'a2', sender_name: 'Иванов', messages_sent: 20 }),
            ];
            // Оба sender_id возвращают диалог с одним и тем же пользователем в одном проекте
            const sameDialog = createDialog({ project_id: 'proj-1', vk_user_id: 1001, messages_sent: 5 });
            mockFetchAdminDialogs
                .mockResolvedValueOnce({ dialogs: [sameDialog], sender_id: 'a1', sender_name: 'Иванов' })
                .mockResolvedValueOnce({
                    dialogs: [createDialog({ project_id: 'proj-1', vk_user_id: 1001, messages_sent: 3 })],
                    sender_id: 'a2', sender_name: 'Иванов',
                });

            const { result } = renderEmployees({ adminStats: stats });

            await act(async () => {
                result.current.actions.selectEmployee('Иванов');
            });

            // Один уникальный диалог, но messages_sent суммированы
            expect(result.current.state.employeeDialogs).toHaveLength(1);
            expect(result.current.state.employeeDialogs[0].messages_sent).toBe(8); // 5 + 3
        });

        it('ошибка API → пустой массив диалогов', async () => {
            const stats = [createAdminStats({ sender_id: 'a1', sender_name: 'Иванов' })];
            mockFetchAdminDialogs.mockRejectedValue(new Error('Сетевая ошибка'));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const { result } = renderEmployees({ adminStats: stats });

            await act(async () => {
                result.current.actions.selectEmployee('Иванов');
            });

            expect(result.current.state.employeeDialogs).toEqual([]);
            expect(result.current.state.employeeLoading).toBe(false);
            consoleSpy.mockRestore();
        });
    });

    describe('employeeProjectsGrouped', () => {
        it('без диалогов → пустой массив', () => {
            const { result } = renderEmployees();

            expect(result.current.state.employeeProjectsGrouped).toEqual([]);
        });

        it('группирует диалоги по project_id', async () => {
            const stats = [createAdminStats({ sender_id: 'a1', sender_name: 'Иванов' })];
            const dialogs = [
                createDialog({ project_id: 'proj-1', vk_user_id: 1001, messages_sent: 5 }),
                createDialog({ project_id: 'proj-1', vk_user_id: 1002, messages_sent: 3 }),
                createDialog({ project_id: 'proj-2', vk_user_id: 1003, messages_sent: 7 }),
            ];
            mockFetchAdminDialogs.mockResolvedValue({ dialogs, sender_id: 'a1', sender_name: 'Иванов' });

            const { result } = renderEmployees({ adminStats: stats });

            await act(async () => {
                result.current.actions.selectEmployee('Иванов');
            });

            const grouped = result.current.state.employeeProjectsGrouped;
            expect(grouped).toHaveLength(2);
            // Сортировка по messages_sent — proj-1 (5+3=8) > proj-2 (7)
            expect(grouped[0].project_id).toBe('proj-1');
            expect(grouped[0].messages_sent).toBe(8);
            expect(grouped[0].dialogs).toHaveLength(2);
            expect(grouped[1].project_id).toBe('proj-2');
            expect(grouped[1].messages_sent).toBe(7);
        });

        it('фильтр по projectSearch', async () => {
            const stats = [createAdminStats({ sender_id: 'a1', sender_name: 'Иванов' })];
            const dialogs = [
                createDialog({ project_id: 'proj-1', vk_user_id: 1001, messages_sent: 5 }),
                createDialog({ project_id: 'proj-2', vk_user_id: 1002, messages_sent: 3 }),
            ];
            mockFetchAdminDialogs.mockResolvedValue({ dialogs, sender_id: 'a1', sender_name: 'Иванов' });

            const { result } = renderEmployees({ adminStats: stats, projectSearch: 'Альфа' });

            await act(async () => {
                result.current.actions.selectEmployee('Иванов');
            });

            // Только proj-1 (Проект Альфа)
            expect(result.current.state.employeeProjectsGrouped).toHaveLength(1);
            expect(result.current.state.employeeProjectsGrouped[0].project_id).toBe('proj-1');
        });
    });

    describe('employeeSummary', () => {
        it('null когда никто не выбран', () => {
            const stats = [createAdminStats({ sender_id: 'a1', sender_name: 'Иванов' })];
            const { result } = renderEmployees({ adminStats: stats });

            expect(result.current.state.employeeSummary).toBeNull();
        });

        it('возвращает MergedAdmin при выбранном сотруднике', async () => {
            const stats = [createAdminStats({ sender_id: 'a1', sender_name: 'Иванов', messages_sent: 50 })];
            mockFetchAdminDialogs.mockResolvedValue({ dialogs: [], sender_id: 'a1', sender_name: 'Иванов' });

            const { result } = renderEmployees({ adminStats: stats });

            await act(async () => {
                result.current.actions.selectEmployee('Иванов');
            });

            expect(result.current.state.employeeSummary).not.toBeNull();
            expect(result.current.state.employeeSummary!.sender_name).toBe('Иванов');
            expect(result.current.state.employeeSummary!.messages_sent).toBe(50);
        });
    });
});
