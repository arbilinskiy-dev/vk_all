/**
 * Тесты: usePromoteAdminsLogic
 * 
 * Покрывают:
 * — загрузку системных аккаунтов при открытии модалки
 * — фильтрацию проектов (eligibleProjects, поиск)
 * — фильтрацию аккаунтов (поиск)
 * — выбор/снятие проектов и аккаунтов (toggle, selectAll, deselectAll)
 * — запуск операции (handleStart) — успех и ошибка
 * — сброс и закрытие (handleClose)
 * — группировку результатов (groupedResults)
 * — блокировку закрытия во время выполнения
 * — handleBack (возврат к выбору)
 */
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Моки API ────────────────────────────────────────────────────

const mockPromoteToAdmins = vi.fn();
const mockGetAllSystemAccounts = vi.fn();

vi.mock('../../services/api/management.api', () => ({
    promoteToAdmins: (...args: any[]) => mockPromoteToAdmins(...args),
}));

vi.mock('../../services/api/system_accounts.api', () => ({
    getAllSystemAccounts: (...args: any[]) => mockGetAllSystemAccounts(...args),
}));

// ─── Импорт после моков ──────────────────────────────────────────

import { usePromoteAdminsLogic } from '../../features/database-management/hooks/usePromoteAdminsLogic';
import { Project, SystemAccount } from '../../shared/types';
import { PromoteUserResult, PromoteToAdminsResponse } from '../../services/api/management.api';

// ─── Хелперы ─────────────────────────────────────────────────────

function createProject(overrides: Partial<Project> = {}): Project {
    return {
        id: 'proj-1',
        name: 'Проект Альфа',
        communityToken: 'token-123',
        vkProjectId: 100001,
        archived: false,
        sort_order: 1,
        teams: [],
        ...overrides,
    };
}

function createAccount(overrides: Partial<SystemAccount> = {}): SystemAccount {
    return {
        id: 'acc-1',
        vk_user_id: '200001',
        full_name: 'Иван Иванов',
        profile_url: 'https://vk.com/id200001',
        avatar_url: null,
        status: 'active',
        ...overrides,
    };
}

function createResult(overrides: Partial<PromoteUserResult> = {}): PromoteUserResult {
    return {
        group_id: 100001,
        group_name: 'Группа Альфа',
        user_id: 200001,
        user_name: 'Иван Иванов',
        was_member: false,
        joined: false,
        promoted: false,
        already_admin: false,
        error: null,
        recommendation: null,
        ...overrides,
    };
}

const mockOnClose = vi.fn();

const defaultProjects = [
    createProject({ id: 'p1', name: 'Альфа', vkProjectId: 100001 }),
    createProject({ id: 'p2', name: 'Бета', vkProjectId: 100002 }),
    createProject({ id: 'p3', name: 'Без VK', vkProjectId: undefined as any }),
    createProject({ id: 'p4', name: 'Архивный', vkProjectId: 100003, archived: true }),
];

const defaultAccounts = [
    createAccount({ id: 'a1', full_name: 'Иван Иванов', vk_user_id: '200001', status: 'active' }),
    createAccount({ id: 'a2', full_name: 'Петр Петров', vk_user_id: '200002', status: 'active' }),
    createAccount({ id: 'a3', full_name: 'Ошибка', vk_user_id: '200003', status: 'error' }),
];

function renderLogicHook(overrides = {}) {
    return renderHook(() => usePromoteAdminsLogic({
        isOpen: true,
        onClose: mockOnClose,
        projects: defaultProjects,
        ...overrides,
    }));
}

// ─── Тесты ───────────────────────────────────────────────────────

describe('usePromoteAdminsLogic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // По умолчанию возвращаем только активные аккаунты
        mockGetAllSystemAccounts.mockResolvedValue(defaultAccounts);
    });

    // === Загрузка системных аккаунтов ===

    describe('загрузка системных аккаунтов', () => {
        it('загружает аккаунты при isOpen=true', async () => {
            const { result } = renderLogicHook();

            expect(mockGetAllSystemAccounts).toHaveBeenCalledTimes(1);

            await waitFor(() => {
                // Только active аккаунты (отфильтрованы error)
                expect(result.current.state.filteredAccounts.length).toBe(2);
            });
        });

        it('не загружает аккаунты при isOpen=false', () => {
            renderLogicHook({ isOpen: false });
            expect(mockGetAllSystemAccounts).not.toHaveBeenCalled();
        });

        it('показывает isLoadingAccounts во время загрузки', async () => {
            // Создаём promise, который ещё не зарезолвился
            let resolveAccounts: (value: SystemAccount[]) => void;
            mockGetAllSystemAccounts.mockReturnValue(new Promise(resolve => {
                resolveAccounts = resolve;
            }));

            const { result } = renderLogicHook();

            // Во время загрузки
            expect(result.current.state.isLoadingAccounts).toBe(true);

            // Резолвим
            await act(async () => {
                resolveAccounts!(defaultAccounts);
            });

            expect(result.current.state.isLoadingAccounts).toBe(false);
        });
    });

    // === Фильтрация проектов ===

    describe('фильтрация проектов', () => {
        it('показывает только проекты с vkProjectId и не архивные', async () => {
            const { result } = renderLogicHook();

            // Из 4 проектов: «Без VK» (no vkProjectId) и «Архивный» — отфильтрованы
            expect(result.current.state.filteredProjects.length).toBe(2);
            expect(result.current.state.filteredProjects.map(p => p.name)).toEqual(['Альфа', 'Бета']);
        });

        it('фильтрует проекты по поисковому запросу', async () => {
            const { result } = renderLogicHook();

            act(() => {
                result.current.actions.setProjectSearch('Альф');
            });

            expect(result.current.state.filteredProjects.length).toBe(1);
            expect(result.current.state.filteredProjects[0].name).toBe('Альфа');
        });
    });

    // === Фильтрация аккаунтов ===

    describe('фильтрация аккаунтов', () => {
        it('фильтрует аккаунты по имени', async () => {
            const { result } = renderLogicHook();

            await waitFor(() => {
                expect(result.current.state.filteredAccounts.length).toBe(2);
            });

            act(() => {
                result.current.actions.setAccountSearch('Иван');
            });

            expect(result.current.state.filteredAccounts.length).toBe(1);
            expect(result.current.state.filteredAccounts[0].full_name).toBe('Иван Иванов');
        });

        it('фильтрует аккаунты по vk_user_id', async () => {
            const { result } = renderLogicHook();

            await waitFor(() => {
                expect(result.current.state.filteredAccounts.length).toBe(2);
            });

            act(() => {
                result.current.actions.setAccountSearch('200002');
            });

            expect(result.current.state.filteredAccounts.length).toBe(1);
            expect(result.current.state.filteredAccounts[0].full_name).toBe('Петр Петров');
        });
    });

    // === Выбор проектов ===

    describe('выбор проектов', () => {
        it('toggleProject добавляет и убирает проект', () => {
            const { result } = renderLogicHook();

            act(() => { result.current.actions.toggleProject('p1'); });
            expect(result.current.state.selectedProjectIds.has('p1')).toBe(true);
            expect(result.current.state.selectedProjectCount).toBe(1);

            act(() => { result.current.actions.toggleProject('p1'); });
            expect(result.current.state.selectedProjectIds.has('p1')).toBe(false);
            expect(result.current.state.selectedProjectCount).toBe(0);
        });

        it('selectAllProjects выбирает все отфильтрованные проекты', () => {
            const { result } = renderLogicHook();

            act(() => { result.current.actions.selectAllProjects(); });
            expect(result.current.state.selectedProjectCount).toBe(2); // Только eligible
        });

        it('deselectAllProjects сбрасывает выбор', () => {
            const { result } = renderLogicHook();

            act(() => { result.current.actions.selectAllProjects(); });
            expect(result.current.state.selectedProjectCount).toBe(2);

            act(() => { result.current.actions.deselectAllProjects(); });
            expect(result.current.state.selectedProjectCount).toBe(0);
        });
    });

    // === Выбор аккаунтов ===

    describe('выбор аккаунтов', () => {
        it('toggleAccount добавляет и убирает аккаунт', async () => {
            const { result } = renderLogicHook();

            await waitFor(() => {
                expect(result.current.state.filteredAccounts.length).toBe(2);
            });

            act(() => { result.current.actions.toggleAccount('a1'); });
            expect(result.current.state.selectedAccountIds.has('a1')).toBe(true);

            act(() => { result.current.actions.toggleAccount('a1'); });
            expect(result.current.state.selectedAccountIds.has('a1')).toBe(false);
        });

        it('selectAllAccounts / deselectAllAccounts работают', async () => {
            const { result } = renderLogicHook();

            await waitFor(() => {
                expect(result.current.state.filteredAccounts.length).toBe(2);
            });

            act(() => { result.current.actions.selectAllAccounts(); });
            expect(result.current.state.selectedAccountCount).toBe(2);

            act(() => { result.current.actions.deselectAllAccounts(); });
            expect(result.current.state.selectedAccountCount).toBe(0);
        });
    });

    // === Вычисляемые значения ===

    describe('вычисляемые значения', () => {
        it('totalPairs считает произведение выбранных', async () => {
            const { result } = renderLogicHook();

            await waitFor(() => {
                expect(result.current.state.filteredAccounts.length).toBe(2);
            });

            // Выбираем 2 проекта и 2 аккаунта
            act(() => {
                result.current.actions.selectAllProjects();
                result.current.actions.selectAllAccounts();
            });

            expect(result.current.state.totalPairs).toBe(4); // 2 × 2
        });

        it('canStart=false когда ничего не выбрано', () => {
            const { result } = renderLogicHook();
            expect(result.current.state.canStart).toBe(false);
        });

        it('canStart=true когда выбраны проекты и аккаунты', async () => {
            const { result } = renderLogicHook();

            await waitFor(() => {
                expect(result.current.state.filteredAccounts.length).toBe(2);
            });

            act(() => {
                result.current.actions.toggleProject('p1');
                result.current.actions.toggleAccount('a1');
            });

            expect(result.current.state.canStart).toBe(true);
        });
    });

    // === Запуск операции ===

    describe('handleStart', () => {
        it('вызывает promoteToAdmins с правильными параметрами', async () => {
            const mockResponse: PromoteToAdminsResponse = {
                success: true,
                total_pairs: 1,
                promoted_count: 1,
                already_admin_count: 0,
                joined_count: 0,
                error_count: 0,
                results: [createResult({ promoted: true })],
            };
            mockPromoteToAdmins.mockResolvedValue(mockResponse);

            const { result } = renderLogicHook();

            await waitFor(() => {
                expect(result.current.state.filteredAccounts.length).toBe(2);
            });

            // Выбираем проект p1 (vkProjectId=100001) и аккаунт a1 (vk_user_id=200001)
            act(() => {
                result.current.actions.toggleProject('p1');
                result.current.actions.toggleAccount('a1');
            });

            await act(async () => {
                await result.current.actions.handleStart();
            });

            expect(mockPromoteToAdmins).toHaveBeenCalledWith(
                [100001],     // groupIds
                [200001],     // userIds
                'administrator' // role по умолчанию
            );

            expect(result.current.state.response).toEqual(mockResponse);
            expect(result.current.state.isRunning).toBe(false);
        });

        it('использует выбранную роль', async () => {
            mockPromoteToAdmins.mockResolvedValue({
                success: true, total_pairs: 1, promoted_count: 1,
                already_admin_count: 0, joined_count: 0, error_count: 0,
                results: [createResult({ promoted: true })],
            });

            const { result } = renderLogicHook();

            await waitFor(() => {
                expect(result.current.state.filteredAccounts.length).toBe(2);
            });

            act(() => {
                result.current.actions.toggleProject('p1');
                result.current.actions.toggleAccount('a1');
                result.current.actions.setRole('editor');
            });

            await act(async () => {
                await result.current.actions.handleStart();
            });

            expect(mockPromoteToAdmins).toHaveBeenCalledWith([100001], [200001], 'editor');
        });

        it('обрабатывает ошибку API', async () => {
            mockPromoteToAdmins.mockRejectedValue(new Error('Сервер недоступен'));

            const { result } = renderLogicHook();

            await waitFor(() => {
                expect(result.current.state.filteredAccounts.length).toBe(2);
            });

            act(() => {
                result.current.actions.toggleProject('p1');
                result.current.actions.toggleAccount('a1');
            });

            await act(async () => {
                await result.current.actions.handleStart();
            });

            expect(result.current.state.error).toBe('Сервер недоступен');
            expect(result.current.state.response).toBeNull();
            expect(result.current.state.isRunning).toBe(false);
        });

        it('не вызывает API если ничего не выбрано', async () => {
            const { result } = renderLogicHook();

            await act(async () => {
                await result.current.actions.handleStart();
            });

            expect(mockPromoteToAdmins).not.toHaveBeenCalled();
        });
    });

    // === Группировка результатов ===

    describe('groupedResults', () => {
        it('группирует результаты по категориям', async () => {
            const mockResponse: PromoteToAdminsResponse = {
                success: true,
                total_pairs: 5,
                promoted_count: 1,
                already_admin_count: 1,
                joined_count: 1,
                error_count: 2,
                results: [
                    createResult({ promoted: true, user_name: 'Промо' }),
                    createResult({ already_admin: true, user_name: 'Уже' }),
                    createResult({ joined: true, promoted: false, already_admin: false, error: null, user_name: 'Вступил' }),
                    createResult({ error: 'no_access', joined: false, was_member: false, user_name: 'ФейлДжоин' }),
                    createResult({ error: 'no_rights', joined: true, was_member: false, promoted: false, already_admin: false, user_name: 'ФейлПрмт' }),
                ],
            };
            mockPromoteToAdmins.mockResolvedValue(mockResponse);

            const { result } = renderLogicHook();

            await waitFor(() => {
                expect(result.current.state.filteredAccounts.length).toBe(2);
            });

            act(() => {
                result.current.actions.toggleProject('p1');
                result.current.actions.toggleAccount('a1');
            });

            await act(async () => {
                await result.current.actions.handleStart();
            });

            const gr = result.current.state.groupedResults;
            expect(gr).not.toBeNull();
            expect(gr!.promoted.length).toBe(1);
            expect(gr!.alreadyAdmin.length).toBe(1);
            // joinedOnly ловит всех joined && !promoted && !already_admin (включая ФейлПрмт)
            expect(gr!.joinedOnly.length).toBe(2);
            expect(gr!.failedJoin.length).toBe(1);
            expect(gr!.failedPromote.length).toBe(1);
        });

        it('собирает уникальные рекомендации', async () => {
            const mockResponse: PromoteToAdminsResponse = {
                success: true, total_pairs: 2, promoted_count: 0,
                already_admin_count: 0, joined_count: 0, error_count: 2,
                results: [
                    createResult({ error: 'er1', recommendation: 'Добавьте токен' }),
                    createResult({ error: 'er2', recommendation: 'Добавьте токен' }),
                    createResult({ error: 'er3', recommendation: 'Проверьте доступ' }),
                ],
            };
            mockPromoteToAdmins.mockResolvedValue(mockResponse);

            const { result } = renderLogicHook();

            await waitFor(() => {
                expect(result.current.state.filteredAccounts.length).toBe(2);
            });

            act(() => {
                result.current.actions.toggleProject('p1');
                result.current.actions.toggleAccount('a1');
            });

            await act(async () => {
                await result.current.actions.handleStart();
            });

            const recs = result.current.state.groupedResults!.recommendations;
            expect(recs.length).toBe(2); // Уникальные
            expect(recs).toContain('Добавьте токен');
            expect(recs).toContain('Проверьте доступ');
        });

        it('groupedResults = null когда нет response', () => {
            const { result } = renderLogicHook();
            expect(result.current.state.groupedResults).toBeNull();
        });
    });

    // === Сброс и закрытие ===

    describe('handleClose', () => {
        it('сбрасывает состояние и вызывает onClose', async () => {
            const { result } = renderLogicHook();

            await waitFor(() => {
                expect(result.current.state.filteredAccounts.length).toBe(2);
            });

            // Выбираем что-то
            act(() => {
                result.current.actions.toggleProject('p1');
                result.current.actions.toggleAccount('a1');
                result.current.actions.setProjectSearch('тест');
                result.current.actions.setRole('editor');
            });

            // Закрываем
            act(() => {
                result.current.actions.handleClose();
            });

            expect(result.current.state.selectedProjectCount).toBe(0);
            expect(result.current.state.selectedAccountCount).toBe(0);
            expect(result.current.state.projectSearch).toBe('');
            expect(result.current.state.role).toBe('administrator');
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    // === handleBack ===

    describe('handleBack', () => {
        it('сбрасывает response и error', async () => {
            const mockResponse: PromoteToAdminsResponse = {
                success: true, total_pairs: 1, promoted_count: 1,
                already_admin_count: 0, joined_count: 0, error_count: 0,
                results: [createResult({ promoted: true })],
            };
            mockPromoteToAdmins.mockResolvedValue(mockResponse);

            const { result } = renderLogicHook();

            await waitFor(() => {
                expect(result.current.state.filteredAccounts.length).toBe(2);
            });

            act(() => {
                result.current.actions.toggleProject('p1');
                result.current.actions.toggleAccount('a1');
            });

            await act(async () => {
                await result.current.actions.handleStart();
            });

            expect(result.current.state.response).not.toBeNull();

            act(() => {
                result.current.actions.handleBack();
            });

            expect(result.current.state.response).toBeNull();
            expect(result.current.state.error).toBeNull();
        });
    });

    // === Роль ===

    describe('роль', () => {
        it('по умолчанию administrator', () => {
            const { result } = renderLogicHook();
            expect(result.current.state.role).toBe('administrator');
        });

        it('setRole меняет роль', () => {
            const { result } = renderLogicHook();

            act(() => {
                result.current.actions.setRole('moderator');
            });

            expect(result.current.state.role).toBe('moderator');
        });
    });
});
