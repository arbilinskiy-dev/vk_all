/**
 * Тесты: ActionToolbar
 * 
 * Покрывают:
 * — рендер всех кнопок
 * — колбэки при клике
 * — блокировка кнопок при isSaving
 * — кнопки только для админа
 * — dropdown колонок (открытие, поиск, чекбоксы)
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionToolbar } from '../../features/database-management/components/ActionToolbar';
import { ColumnDefinition } from '../../features/database-management/components/ProjectTable';

// ─── Хелперы ─────────────────────────────────────────────────────

const COLUMNS: ColumnDefinition[] = [
    { key: 'name', label: 'Название проекта' },
    { key: 'teams', label: 'Команды' },
];

function createDefaultProps(overrides = {}) {
    return {
        columnsButtonRef: { current: null } as React.RefObject<HTMLButtonElement>,
        columnsDropdownRef: { current: null } as React.RefObject<HTMLDivElement>,
        toggleColumnsDropdown: vi.fn(),
        isVisibilityDropdownOpen: false,
        columnsDropdownPosition: { top: 0, left: 0, width: 220 },
        columnsSearchQuery: '',
        onColumnsSearchQueryChange: vi.fn(),
        filteredColumns: COLUMNS,
        visibleColumns: { name: true, teams: true } as Record<string, boolean>,
        onToggleColumnVisibility: vi.fn(),
        onShowAllColumns: vi.fn(),
        onHideAllColumns: vi.fn(),
        isSaving: false,
        isDirty: false,
        onAutoNumbering: vi.fn(),
        onBulkCallbackOpen: vi.fn(),
        onPromoteAdminsOpen: vi.fn(),
        onViewModeChange: vi.fn(),
        onAddProject: vi.fn(),
        onSaveChanges: vi.fn(),
        user: { username: 'admin', role: 'admin' as const, full_name: 'Admin' },
        ...overrides,
    };
}

// ─── Тесты ───────────────────────────────────────────────────────

describe('ActionToolbar', () => {
    it('рендерит все основные кнопки', () => {
        render(<ActionToolbar {...createDefaultProps()} />);

        expect(screen.getByText('Колонки')).toBeInTheDocument();
        expect(screen.getByText('Auto №')).toBeInTheDocument();
        expect(screen.getByText('Настроить колбэки')).toBeInTheDocument();
        expect(screen.getByText('В админы')).toBeInTheDocument();
        expect(screen.getByText('Администрируемые')).toBeInTheDocument();
        expect(screen.getByText('Архив')).toBeInTheDocument();
        expect(screen.getByText('+ Добавить проекты')).toBeInTheDocument();
        expect(screen.getByText('Сохранить')).toBeInTheDocument();
    });

    it('вызывает onAutoNumbering при клике на "Auto №"', () => {
        const props = createDefaultProps();
        render(<ActionToolbar {...props} />);

        fireEvent.click(screen.getByText('Auto №'));
        expect(props.onAutoNumbering).toHaveBeenCalledTimes(1);
    });

    it('вызывает onBulkCallbackOpen при клике на "Настроить колбэки"', () => {
        const props = createDefaultProps();
        render(<ActionToolbar {...props} />);

        fireEvent.click(screen.getByText('Настроить колбэки'));
        expect(props.onBulkCallbackOpen).toHaveBeenCalledTimes(1);
    });

    it('вызывает onPromoteAdminsOpen при клике на "В админы"', () => {
        const props = createDefaultProps();
        render(<ActionToolbar {...props} />);

        fireEvent.click(screen.getByText('В админы'));
        expect(props.onPromoteAdminsOpen).toHaveBeenCalledTimes(1);
    });

    it('вызывает onViewModeChange("archive") при клике на "Архив"', () => {
        const props = createDefaultProps();
        render(<ActionToolbar {...props} />);

        fireEvent.click(screen.getByText('Архив'));
        expect(props.onViewModeChange).toHaveBeenCalledWith('archive');
    });

    it('вызывает onViewModeChange("administered") при клике на "Администрируемые"', () => {
        const props = createDefaultProps();
        render(<ActionToolbar {...props} />);

        fireEvent.click(screen.getByText('Администрируемые'));
        expect(props.onViewModeChange).toHaveBeenCalledWith('administered');
    });

    it('вызывает onAddProject при клике на "+ Добавить проекты"', () => {
        const props = createDefaultProps();
        render(<ActionToolbar {...props} />);

        fireEvent.click(screen.getByText('+ Добавить проекты'));
        expect(props.onAddProject).toHaveBeenCalledTimes(1);
    });

    it('вызывает onSaveChanges при клике на "Сохранить"', () => {
        const props = createDefaultProps({ isDirty: true });
        render(<ActionToolbar {...props} />);

        fireEvent.click(screen.getByText('Сохранить'));
        expect(props.onSaveChanges).toHaveBeenCalledTimes(1);
    });

    it('кнопка "Сохранить" заблокирована, когда нет изменений', () => {
        render(<ActionToolbar {...createDefaultProps({ isDirty: false })} />);

        expect(screen.getByText('Сохранить').closest('button')).toBeDisabled();
    });

    it('кнопка "Сохранить" заблокирована при сохранении', () => {
        render(<ActionToolbar {...createDefaultProps({ isDirty: true, isSaving: true })} />);

        // При сохранении показывается loader, а не текст "Сохранить"
        const saveButton = screen.getByTitle('Сохранить все изменения');
        expect(saveButton).toBeDisabled();
    });

    it('блокирует кнопки при isSaving', () => {
        render(<ActionToolbar {...createDefaultProps({ isSaving: true })} />);

        expect(screen.getByText('Auto №').closest('button')).toBeDisabled();
        expect(screen.getByText('Настроить колбэки').closest('button')).toBeDisabled();
        expect(screen.getByText('В админы').closest('button')).toBeDisabled();
        expect(screen.getByText('+ Добавить проекты').closest('button')).toBeDisabled();
    });

    // === Только для админа ===

    it('показывает "Глобальные переменные" и "Контекст проекта" для админа', () => {
        render(<ActionToolbar {...createDefaultProps({ user: { username: 'a', role: 'admin', full_name: 'A' } })} />);

        expect(screen.getByText('Глобальные переменные')).toBeInTheDocument();
        expect(screen.getByText('Контекст проекта')).toBeInTheDocument();
    });

    it('скрывает "Глобальные переменные" и "Контекст проекта" для обычного пользователя', () => {
        render(<ActionToolbar {...createDefaultProps({ user: { username: 'u', role: 'user', full_name: 'U' } })} />);

        expect(screen.queryByText('Глобальные переменные')).not.toBeInTheDocument();
        expect(screen.queryByText('Контекст проекта')).not.toBeInTheDocument();
    });

    it('вызывает onViewModeChange("global-variables") при клике', () => {
        const props = createDefaultProps();
        render(<ActionToolbar {...props} />);

        fireEvent.click(screen.getByText('Глобальные переменные'));
        expect(props.onViewModeChange).toHaveBeenCalledWith('global-variables');
    });

    it('вызывает onViewModeChange("project-context") при клике', () => {
        const props = createDefaultProps();
        render(<ActionToolbar {...props} />);

        fireEvent.click(screen.getByText('Контекст проекта'));
        expect(props.onViewModeChange).toHaveBeenCalledWith('project-context');
    });

    // === Dropdown колонок ===

    it('вызывает toggleColumnsDropdown при клике на "Колонки"', () => {
        const props = createDefaultProps();
        render(<ActionToolbar {...props} />);

        fireEvent.click(screen.getByText('Колонки'));
        expect(props.toggleColumnsDropdown).toHaveBeenCalledTimes(1);
    });

    it('показывает dropdown содержимое при isVisibilityDropdownOpen=true', () => {
        render(<ActionToolbar {...createDefaultProps({ isVisibilityDropdownOpen: true })} />);

        expect(screen.getByText('Показать все')).toBeInTheDocument();
        expect(screen.getByText('Скрыть все')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Поиск...')).toBeInTheDocument();
        expect(screen.getByText('Название проекта')).toBeInTheDocument();
        expect(screen.getByText('Команды')).toBeInTheDocument();
    });

    it('вызывает onShowAllColumns при клике на "Показать все"', () => {
        const props = createDefaultProps({ isVisibilityDropdownOpen: true });
        render(<ActionToolbar {...props} />);

        fireEvent.click(screen.getByText('Показать все'));
        expect(props.onShowAllColumns).toHaveBeenCalledTimes(1);
    });

    it('вызывает onHideAllColumns при клике на "Скрыть все"', () => {
        const props = createDefaultProps({ isVisibilityDropdownOpen: true });
        render(<ActionToolbar {...props} />);

        fireEvent.click(screen.getByText('Скрыть все'));
        expect(props.onHideAllColumns).toHaveBeenCalledTimes(1);
    });
});
