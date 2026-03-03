/**
 * Тесты: useDatabaseManagementLogic
 * 
 * Покрывают:
 * — загрузку проектов (fetchProjects)
 * — фильтрацию проектов по имени и команде
 * — редактирование проектов (handleProjectChange) со сдвигом sort_order
 * — сохранение с подтверждением архивации
 * — автонумерацию
 * — управление видимостью колонок
 * — вычисляемые данные (uniqueTeams, filteredProjects, teamFilterDisplayText)
 */
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Моки API ────────────────────────────────────────────────────

const mockGetAllProjectsForManagement = vi.fn();
const mockUpdateProjects = vi.fn();
const mockUpdateProjectSettings = vi.fn();

vi.mock('../../services/api', () => ({
    getAllProjectsForManagement: (...args: any[]) => mockGetAllProjectsForManagement(...args),
    updateProjects: (...args: any[]) => mockUpdateProjects(...args),
    updateProjectSettings: (...args: any[]) => mockUpdateProjectSettings(...args),
}));

// Мок useLocalStorage — возвращает useState
vi.mock('../../shared/hooks/useLocalStorage', () => ({
    useLocalStorage: (_key: string, initialValue: any) => {
        const [state, setState] = React.useState(initialValue);
        return [state, setState];
    },
}));

beforeEach(() => {
    (window as any).showAppToast = vi.fn();
});

// ─── Импорт после моков ──────────────────────────────────────────

import { useDatabaseManagementLogic } from '../../features/database-management/hooks/useDatabaseManagementLogic';
import { Project } from '../../shared/types';

// ─── Хелперы ─────────────────────────────────────────────────────

function createProject(overrides: Partial<Project> = {}): Project {
    return {
        id: 'p1',
        name: 'Тестовый проект',
        communityToken: 'token-123',
        vkProjectId: 12345,
        archived: false,
        sort_order: 1,
        teams: ['Команда А'],
        ...overrides,
    };
}

const mockOnProjectsUpdate = vi.fn();

function renderLogicHook() {
    return renderHook(() => useDatabaseManagementLogic({ onProjectsUpdate: mockOnProjectsUpdate }));
}

// ─── Тесты ───────────────────────────────────────────────────────

describe('useDatabaseManagementLogic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetAllProjectsForManagement.mockResolvedValue([
            createProject({ id: 'p1', name: 'Альфа', teams: ['Маркетинг'], sort_order: 1 }),
            createProject({ id: 'p2', name: 'Бета', teams: ['Продажи'], sort_order: 2 }),
            createProject({ id: 'p3', name: 'Гамма', teams: [], sort_order: null as any }),
        ]);
        mockUpdateProjects.mockResolvedValue({ success: true });
    });

    // === Загрузка данных ===

    it('загружает проекты при инициализации (viewMode=main)', async () => {
        const { result } = renderLogicHook();

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        expect(result.current.state.projects).toHaveLength(3);
        expect(mockGetAllProjectsForManagement).toHaveBeenCalledTimes(1);
    });

    it('устанавливает ошибку при неудачной загрузке', async () => {
        mockGetAllProjectsForManagement.mockRejectedValue(new Error('Ошибка сети'));

        const { result } = renderLogicHook();

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        expect(result.current.state.error).toBe('Ошибка сети');
    });

    // === Вычисляемые данные ===

    it('вычисляет uniqueTeams из загруженных проектов', async () => {
        const { result } = renderLogicHook();

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        expect(result.current.state.uniqueTeams).toEqual(['Маркетинг', 'Продажи']);
    });

    it('filteredProjects возвращает все проекты при пустом фильтре', async () => {
        const { result } = renderLogicHook();

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        expect(result.current.state.filteredProjects).toHaveLength(3);
    });

    // === Фильтрация ===

    it('фильтрует проекты по строке поиска', async () => {
        const { result } = renderLogicHook();

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        act(() => {
            result.current.actions.setSearchQuery('Альфа');
        });

        expect(result.current.state.filteredProjects).toHaveLength(1);
        expect(result.current.state.filteredProjects[0].name).toBe('Альфа');
    });

    it('фильтрует проекты по команде', async () => {
        const { result } = renderLogicHook();

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        act(() => {
            result.current.actions.handleTeamFilterSelect('Маркетинг');
        });

        expect(result.current.state.filteredProjects).toHaveLength(1);
        expect(result.current.state.filteredProjects[0].name).toBe('Альфа');
    });

    it('фильтрует проекты "Без команды"', async () => {
        const { result } = renderLogicHook();

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        act(() => {
            result.current.actions.handleTeamFilterSelect('NoTeam');
        });

        expect(result.current.state.filteredProjects).toHaveLength(1);
        expect(result.current.state.filteredProjects[0].name).toBe('Гамма');
    });

    it('teamFilterDisplayText возвращает "Все" по умолчанию', async () => {
        const { result } = renderLogicHook();

        expect(result.current.state.teamFilterDisplayText).toBe('Все');
    });

    it('teamFilterDisplayText возвращает "Без команды" при NoTeam', async () => {
        const { result } = renderLogicHook();

        act(() => {
            result.current.actions.handleTeamFilterSelect('NoTeam');
        });

        expect(result.current.state.teamFilterDisplayText).toBe('Без команды');
    });

    // === Редактирование проектов ===

    it('handleProjectChange помечает проект как изменённый', async () => {
        const { result } = renderLogicHook();

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        act(() => {
            result.current.actions.handleProjectChange('p1', 'name', 'Новое имя');
        });

        expect(result.current.state.isDirty).toBe(true);
        expect(result.current.state.editedProjects['p1'].name).toBe('Новое имя');
    });

    it('handleProjectChange сдвигает sort_order при перемещении вниз', async () => {
        const { result } = renderLogicHook();

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        // Переместить проект p1 с позиции 1 на позицию 2
        act(() => {
            result.current.actions.handleProjectChange('p1', 'sort_order', 2);
        });

        // p1 теперь 2, p2 должен сдвинуться на 1
        expect(result.current.state.editedProjects['p1'].sort_order).toBe(2);
        expect(result.current.state.editedProjects['p2'].sort_order).toBe(1);
    });

    // === Автонумерация ===

    it('handleAutoNumbering нумерует проекты без sort_order', async () => {
        const { result } = renderLogicHook();

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        act(() => {
            result.current.actions.handleAutoNumbering();
        });

        // p1 (sort_order=1) и p2 (sort_order=2) уже пронумерованы
        // p3 (sort_order=null) должен получить 3
        expect(result.current.state.editedProjects['p3'].sort_order).toBe(3);
        // p1, p2 не должны быть в editedProjects
        expect(result.current.state.editedProjects['p1']).toBeUndefined();
        expect(result.current.state.editedProjects['p2']).toBeUndefined();
    });

    // === Сохранение ===

    it('handleSaveChanges ничего не делает, если нет изменений', async () => {
        const { result } = renderLogicHook();

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        await act(async () => {
            await result.current.actions.handleSaveChanges();
        });

        expect(mockUpdateProjects).not.toHaveBeenCalled();
    });

    it('handleSaveChanges вызывает API при наличии изменений (без архивации)', async () => {
        const { result } = renderLogicHook();

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        // Создаём изменение
        act(() => {
            result.current.actions.handleProjectChange('p1', 'notes', 'Заметка');
        });

        await act(async () => {
            await result.current.actions.handleSaveChanges();
        });

        expect(mockUpdateProjects).toHaveBeenCalledTimes(1);
    });

    it('handleSaveChanges показывает подтверждение при архивации', async () => {
        const { result } = renderLogicHook();

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        // Помечаем проект как архивный
        act(() => {
            result.current.actions.handleProjectChange('p1', 'archived', true);
        });

        await act(async () => {
            await result.current.actions.handleSaveChanges();
        });

        // Должно появиться подтверждение, а не прямой вызов API
        expect(result.current.state.archiveConfirmation).not.toBeNull();
        expect(result.current.state.archiveConfirmation!.count).toBe(1);
        expect(mockUpdateProjects).not.toHaveBeenCalled();
    });

    // === ViewMode ===

    it('viewMode по умолчанию = main', async () => {
        const { result } = renderLogicHook();

        expect(result.current.state.viewMode).toBe('main');
    });

    it('setViewMode меняет режим', async () => {
        const { result } = renderLogicHook();

        act(() => {
            result.current.actions.setViewMode('archive');
        });

        expect(result.current.state.viewMode).toBe('archive');
    });

    // === Видимость колонок ===

    it('по умолчанию все колонки видимы', async () => {
        const { result } = renderLogicHook();

        const columns = result.current.state.visibleColumns;
        expect(columns['name']).toBe(true);
        expect(columns['teams']).toBe(true);
        expect(columns['sort_order']).toBe(true);
    });

    it('handleToggleColumnVisibility переключает видимость', async () => {
        const { result } = renderLogicHook();

        act(() => {
            result.current.actions.handleToggleColumnVisibility('name');
        });

        expect(result.current.state.visibleColumns['name']).toBe(false);

        act(() => {
            result.current.actions.handleToggleColumnVisibility('name');
        });

        expect(result.current.state.visibleColumns['name']).toBe(true);
    });

    it('handleShowAllColumns включает все колонки', async () => {
        const { result } = renderLogicHook();

        // Скрываем одну
        act(() => {
            result.current.actions.handleToggleColumnVisibility('name');
        });
        expect(result.current.state.visibleColumns['name']).toBe(false);

        // Показываем все
        act(() => {
            result.current.actions.handleShowAllColumns();
        });
        expect(result.current.state.visibleColumns['name']).toBe(true);
    });

    it('handleHideAllColumns скрывает все колонки', async () => {
        const { result } = renderLogicHook();

        act(() => {
            result.current.actions.handleHideAllColumns();
        });

        const columns = result.current.state.visibleColumns;
        Object.values(columns).forEach(visible => {
            expect(visible).toBe(false);
        });
    });

    // === Модалки ===

    it('isAddModalOpen управляется через setIsAddModalOpen', () => {
        const { result } = renderLogicHook();

        expect(result.current.state.isAddModalOpen).toBe(false);

        act(() => {
            result.current.actions.setIsAddModalOpen(true);
        });

        expect(result.current.state.isAddModalOpen).toBe(true);
    });

    it('isBulkCallbackOpen управляется через setIsBulkCallbackOpen', () => {
        const { result } = renderLogicHook();

        expect(result.current.state.isBulkCallbackOpen).toBe(false);

        act(() => {
            result.current.actions.setIsBulkCallbackOpen(true);
        });

        expect(result.current.state.isBulkCallbackOpen).toBe(true);
    });

    it('isPromoteAdminsOpen управляется через setIsPromoteAdminsOpen', () => {
        const { result } = renderLogicHook();

        expect(result.current.state.isPromoteAdminsOpen).toBe(false);

        act(() => {
            result.current.actions.setIsPromoteAdminsOpen(true);
        });

        expect(result.current.state.isPromoteAdminsOpen).toBe(true);
    });

    // === handleSettingsSave ===

    it('handleSettingsSave обновляет проект в списке', async () => {
        const { result } = renderLogicHook();

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        // Открываем настройки
        act(() => {
            result.current.actions.handleOpenSettings(result.current.state.projects[0]);
        });

        expect(result.current.state.settingsProject).not.toBeNull();

        // Сохраняем
        const updatedProject = { ...result.current.state.projects[0], name: 'Обновлённый' };
        mockUpdateProjectSettings.mockResolvedValue(updatedProject);

        await act(async () => {
            await result.current.actions.handleSettingsSave(updatedProject);
        });

        expect(mockUpdateProjectSettings).toHaveBeenCalledWith(updatedProject);
        expect(result.current.state.settingsProject).toBeNull();
        expect(result.current.state.projects[0].name).toBe('Обновлённый');
    });

    // === handleAddProjectsSuccess ===

    it('handleAddProjectsSuccess закрывает модалку и перезагружает проекты', async () => {
        const { result } = renderLogicHook();

        await waitFor(() => {
            expect(result.current.state.isLoading).toBe(false);
        });

        act(() => {
            result.current.actions.setIsAddModalOpen(true);
        });

        await act(async () => {
            result.current.actions.handleAddProjectsSuccess();
        });

        expect(result.current.state.isAddModalOpen).toBe(false);
        // fetchProjects вызывается повторно
        expect(mockGetAllProjectsForManagement).toHaveBeenCalledTimes(2);
        expect(mockOnProjectsUpdate).toHaveBeenCalled();
    });

    // === Фильтрация колонок ===

    it('filteredColumns фильтрует по поисковому запросу', async () => {
        const { result } = renderLogicHook();

        act(() => {
            result.current.actions.setColumnsSearchQuery('Название');
        });

        expect(result.current.state.filteredColumns).toHaveLength(2); // «Название проекта» и «Название VK»
    });

    it('filteredColumns возвращает все при пустом запросе', () => {
        const { result } = renderLogicHook();

        expect(result.current.state.filteredColumns).toHaveLength(11);
    });
});
