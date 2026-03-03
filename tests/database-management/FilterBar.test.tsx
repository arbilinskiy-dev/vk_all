/**
 * Тесты: FilterBar
 * 
 * Покрывают:
 * — рендер поиска и dropdown фильтра команд
 * — ввод текста в поиск
 * — сброс поиска крестиком
 * — открытие dropdown команд
 * — выбор команды
 * — отображение счётчика "Показано: X из Y"
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FilterBar } from '../../features/database-management/components/FilterBar';

// ─── Хелперы ─────────────────────────────────────────────────────

function createDefaultProps(overrides = {}) {
    return {
        searchQuery: '',
        onSearchQueryChange: vi.fn(),
        teamFilterButtonRef: { current: null } as React.RefObject<HTMLButtonElement>,
        toggleTeamFilter: vi.fn(),
        isTeamFilterOpen: false,
        teamFilterPosition: { top: 0, left: 0, width: 200 },
        teamFilterDropdownRef: { current: null } as React.RefObject<HTMLDivElement>,
        teamFilterDisplayText: 'Все',
        teamFilter: 'All',
        uniqueTeams: ['Маркетинг', 'Продажи'],
        onTeamFilterSelect: vi.fn(),
        filteredProjectsCount: 10,
        totalProjectsCount: 25,
        ...overrides,
    };
}

// ─── Тесты ───────────────────────────────────────────────────────

describe('FilterBar', () => {
    it('рендерит поле поиска', () => {
        render(<FilterBar {...createDefaultProps()} />);

        expect(screen.getByPlaceholderText('Поиск по названию...')).toBeInTheDocument();
    });

    it('отображает текущее значение поиска', () => {
        render(<FilterBar {...createDefaultProps({ searchQuery: 'Тест' })} />);

        expect(screen.getByDisplayValue('Тест')).toBeInTheDocument();
    });

    it('вызывает onSearchQueryChange при вводе', async () => {
        const user = userEvent.setup();
        const props = createDefaultProps();
        render(<FilterBar {...props} />);

        const input = screen.getByPlaceholderText('Поиск по названию...');
        await user.type(input, 'A');

        expect(props.onSearchQueryChange).toHaveBeenCalled();
    });

    it('показывает кнопку сброса при непустом поиске', () => {
        render(<FilterBar {...createDefaultProps({ searchQuery: 'Тест' })} />);

        expect(screen.getByTitle('Сбросить поиск')).toBeInTheDocument();
    });

    it('скрывает кнопку сброса при пустом поиске', () => {
        render(<FilterBar {...createDefaultProps({ searchQuery: '' })} />);

        expect(screen.queryByTitle('Сбросить поиск')).not.toBeInTheDocument();
    });

    it('вызывает onSearchQueryChange("") при клике на сброс', () => {
        const props = createDefaultProps({ searchQuery: 'Тест' });
        render(<FilterBar {...props} />);

        fireEvent.click(screen.getByTitle('Сбросить поиск'));
        expect(props.onSearchQueryChange).toHaveBeenCalledWith('');
    });

    // === Фильтр команд ===

    it('рендерит кнопку фильтра с текстом "Все"', () => {
        render(<FilterBar {...createDefaultProps()} />);

        expect(screen.getByText('Команда:')).toBeInTheDocument();
        expect(screen.getByText('Все')).toBeInTheDocument();
    });

    it('вызывает toggleTeamFilter при клике на кнопку фильтра', () => {
        const props = createDefaultProps();
        render(<FilterBar {...props} />);

        // Кликаем на кнопку с текстом фильтра
        fireEvent.click(screen.getByText('Все'));
        expect(props.toggleTeamFilter).toHaveBeenCalledTimes(1);
    });

    it('рендерит dropdown с командами при isTeamFilterOpen=true', () => {
        render(<FilterBar {...createDefaultProps({ isTeamFilterOpen: true })} />);

        // Кнопка "Все" в dropdown
        const allButtons = screen.getAllByText('Все');
        expect(allButtons.length).toBeGreaterThanOrEqual(2); // одна в кнопке, одна в dropdown

        expect(screen.getByText('Маркетинг')).toBeInTheDocument();
        expect(screen.getByText('Продажи')).toBeInTheDocument();
        expect(screen.getByText('Без команды')).toBeInTheDocument();
    });

    it('вызывает onTeamFilterSelect с выбранной командой', () => {
        const props = createDefaultProps({ isTeamFilterOpen: true });
        render(<FilterBar {...props} />);

        fireEvent.click(screen.getByText('Маркетинг'));
        expect(props.onTeamFilterSelect).toHaveBeenCalledWith('Маркетинг');
    });

    it('вызывает onTeamFilterSelect("NoTeam") при выборе "Без команды"', () => {
        const props = createDefaultProps({ isTeamFilterOpen: true });
        render(<FilterBar {...props} />);

        fireEvent.click(screen.getByText('Без команды'));
        expect(props.onTeamFilterSelect).toHaveBeenCalledWith('NoTeam');
    });

    // === Счётчик ===

    it('отображает счётчик Показано: с правильными числами', () => {
        render(<FilterBar {...createDefaultProps({ filteredProjectsCount: 7, totalProjectsCount: 20 })} />);

        // "Показано: 7 из 20"
        expect(screen.getByText(/Показано:/)).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByText(/из 20/)).toBeInTheDocument();
    });
});
