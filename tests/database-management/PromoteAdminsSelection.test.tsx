/**
 * Тесты: PromoteAdminsSelection
 * 
 * Покрывают:
 * — рендер заголовка «В админы»
 * — рендер списков проектов и аккаунтов
 * — показ пустого состояния проектов и аккаунтов
 * — показ лоадера загрузки аккаунтов
 * — чекбоксы проектов и аккаунтов (toggle)
 * — кнопки «Все» / «Сброс» для обеих колонок
 * — поиск проектов и аккаунтов
 * — выбор роли
 * — отображение totalPairs
 * — состояние кнопки «В админы» (disabled/enabled)
 * — спиннер при isRunning
 * — отображение ошибки
 * — клик «Отмена» и «В админы»
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { PromoteAdminsSelection } from '../../features/database-management/components/modals/PromoteAdminsSelection';
import { Project, SystemAccount } from '../../shared/types';

// ─── Хелперы ─────────────────────────────────────────────────────

function createProject(overrides: Partial<Project> = {}): Project {
    return {
        id: 'p1',
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
        id: 'a1',
        vk_user_id: '200001',
        full_name: 'Иван Иванов',
        profile_url: 'https://vk.com/id200001',
        avatar_url: null,
        status: 'active',
        ...overrides,
    };
}

function createDefaultProps(overrides = {}) {
    return {
        filteredProjects: [
            createProject({ id: 'p1', name: 'Альфа' }),
            createProject({ id: 'p2', name: 'Бета' }),
        ],
        filteredAccounts: [
            createAccount({ id: 'a1', full_name: 'Иван Иванов', vk_user_id: '200001' }),
            createAccount({ id: 'a2', full_name: 'Петр Петров', vk_user_id: '200002' }),
        ],
        isLoadingAccounts: false,
        selectedProjectIds: new Set<string>(),
        selectedAccountIds: new Set<string>(),
        selectedProjectCount: 0,
        selectedAccountCount: 0,
        role: 'administrator' as 'administrator' | 'editor' | 'moderator',
        isRunning: false,
        error: null as string | null,
        canStart: false,
        totalPairs: 0,
        projectSearch: '',
        accountSearch: '',
        onToggleProject: vi.fn(),
        onToggleAccount: vi.fn(),
        onSelectAllProjects: vi.fn(),
        onDeselectAllProjects: vi.fn(),
        onSelectAllAccounts: vi.fn(),
        onDeselectAllAccounts: vi.fn(),
        onSetRole: vi.fn(),
        onSetProjectSearch: vi.fn(),
        onSetAccountSearch: vi.fn(),
        onStart: vi.fn(),
        onClose: vi.fn(),
        ...overrides,
    };
}

// ─── Тесты ───────────────────────────────────────────────────────

describe('PromoteAdminsSelection', () => {

    it('рендерит заголовок «В админы»', () => {
        render(<PromoteAdminsSelection {...createDefaultProps()} />);
        expect(screen.getByRole('heading', { name: 'В админы' })).toBeInTheDocument();
    });

    // === Списки проектов ===

    describe('список проектов', () => {
        it('показывает имена проектов', () => {
            render(<PromoteAdminsSelection {...createDefaultProps()} />);
            expect(screen.getByText('Альфа')).toBeInTheDocument();
            expect(screen.getByText('Бета')).toBeInTheDocument();
        });

        it('показывает «Ничего не найдено» при пустом результате поиска', () => {
            const props = createDefaultProps({
                filteredProjects: [],
                projectSearch: 'xyz',
            });
            render(<PromoteAdminsSelection {...props} />);

            expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
        });

        it('показывает плейсхолдер без поиска', () => {
            const props = createDefaultProps({
                filteredProjects: [],
                projectSearch: '',
            });
            render(<PromoteAdminsSelection {...props} />);

            expect(screen.getByText('Нет проектов с привязкой к VK')).toBeInTheDocument();
        });

        it('чекбокс вызывает onToggleProject', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsSelection {...props} />);

            // Находим первый чекбокс проекта
            const checkboxes = screen.getAllByRole('checkbox');
            fireEvent.click(checkboxes[0]);

            expect(props.onToggleProject).toHaveBeenCalledWith('p1');
        });

        it('кнопка «Все» для проектов вызывает onSelectAllProjects', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsSelection {...props} />);

            // Два кнопки «Все» — для проектов и аккаунтов.
            const allButtons = screen.getAllByText('Все');
            fireEvent.click(allButtons[0]); // Первая — для проектов

            expect(props.onSelectAllProjects).toHaveBeenCalledTimes(1);
        });

        it('кнопка «Сброс» для проектов вызывает onDeselectAllProjects', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsSelection {...props} />);

            const resetButtons = screen.getAllByText('Сброс');
            fireEvent.click(resetButtons[0]);

            expect(props.onDeselectAllProjects).toHaveBeenCalledTimes(1);
        });

        it('показывает счётчик «выбрано: N»', () => {
            const props = createDefaultProps({ selectedProjectCount: 3 });
            render(<PromoteAdminsSelection {...props} />);

            expect(screen.getByText('выбрано: 3')).toBeInTheDocument();
        });
    });

    // === Списки аккаунтов ===

    describe('список аккаунтов', () => {
        it('показывает имена аккаунтов', () => {
            render(<PromoteAdminsSelection {...createDefaultProps()} />);
            expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
            expect(screen.getByText('Петр Петров')).toBeInTheDocument();
        });

        it('показывает ID аккаунтов', () => {
            render(<PromoteAdminsSelection {...createDefaultProps()} />);
            expect(screen.getByText('ID: 200001')).toBeInTheDocument();
            expect(screen.getByText('ID: 200002')).toBeInTheDocument();
        });

        it('показывает лоадер при isLoadingAccounts', () => {
            const props = createDefaultProps({ isLoadingAccounts: true, filteredAccounts: [] });
            render(<PromoteAdminsSelection {...props} />);

            expect(screen.getByText('Загрузка аккаунтов...')).toBeInTheDocument();
        });

        it('показывает плейсхолдер без аккаунтов', () => {
            const props = createDefaultProps({ filteredAccounts: [], accountSearch: '' });
            render(<PromoteAdminsSelection {...props} />);

            expect(screen.getByText('Нет активных системных аккаунтов')).toBeInTheDocument();
        });

        it('кнопка «Все» для аккаунтов вызывает onSelectAllAccounts', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsSelection {...props} />);

            const allButtons = screen.getAllByText('Все');
            fireEvent.click(allButtons[1]); // Вторая — для аккаунтов

            expect(props.onSelectAllAccounts).toHaveBeenCalledTimes(1);
        });
    });

    // === Поиск ===

    describe('поиск', () => {
        it('поле поиска проектов вызывает onSetProjectSearch', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsSelection {...props} />);

            const searchInput = screen.getByPlaceholderText('Поиск проекта...');
            fireEvent.change(searchInput, { target: { value: 'Альфа' } });

            expect(props.onSetProjectSearch).toHaveBeenCalledWith('Альфа');
        });

        it('поле поиска аккаунтов вызывает onSetAccountSearch', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsSelection {...props} />);

            const searchInput = screen.getByPlaceholderText('Поиск аккаунта...');
            fireEvent.change(searchInput, { target: { value: 'Иван' } });

            expect(props.onSetAccountSearch).toHaveBeenCalledWith('Иван');
        });
    });

    // === Футер ===

    describe('футер', () => {
        it('показывает выбранную роль', () => {
            const props = createDefaultProps({ role: 'editor' as const });
            render(<PromoteAdminsSelection {...props} />);

            const select = screen.getByDisplayValue('Редактор');
            expect(select).toBeInTheDocument();
        });

        it('изменение роли вызывает onSetRole', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsSelection {...props} />);

            const select = screen.getByDisplayValue('Администратор');
            fireEvent.change(select, { target: { value: 'moderator' } });

            expect(props.onSetRole).toHaveBeenCalledWith('moderator');
        });

        it('показывает totalPairs когда > 0', () => {
            const props = createDefaultProps({
                totalPairs: 6,
                selectedProjectCount: 3,
                selectedAccountCount: 2,
            });
            render(<PromoteAdminsSelection {...props} />);

            expect(screen.getByText(/6 операций/)).toBeInTheDocument();
        });

        it('не показывает totalPairs когда = 0', () => {
            const props = createDefaultProps({ totalPairs: 0 });
            render(<PromoteAdminsSelection {...props} />);

            expect(screen.queryByText(/операций/)).not.toBeInTheDocument();
        });

        it('кнопка «В админы» disabled когда canStart=false', () => {
            const props = createDefaultProps({ canStart: false });
            render(<PromoteAdminsSelection {...props} />);

            const btns = screen.getAllByText('В админы');
            // Последний — кнопка в футере
            const footerBtn = btns[btns.length - 1].closest('button');
            expect(footerBtn).toBeDisabled();
        });

        it('кнопка «В админы» enabled когда canStart=true', () => {
            const props = createDefaultProps({ canStart: true });
            render(<PromoteAdminsSelection {...props} />);

            const btns = screen.getAllByText('В админы');
            const footerBtn = btns[btns.length - 1].closest('button');
            expect(footerBtn).not.toBeDisabled();
        });

        it('клик «В админы» вызывает onStart', () => {
            const props = createDefaultProps({ canStart: true });
            render(<PromoteAdminsSelection {...props} />);

            const btns = screen.getAllByText('В админы');
            fireEvent.click(btns[btns.length - 1]);
            expect(props.onStart).toHaveBeenCalledTimes(1);
        });

        it('показывает «Выполняется...» при isRunning', () => {
            const props = createDefaultProps({ isRunning: true });
            render(<PromoteAdminsSelection {...props} />);

            expect(screen.getByText('Выполняется...')).toBeInTheDocument();
        });

        it('клик «Отмена» вызывает onClose', () => {
            const props = createDefaultProps();
            render(<PromoteAdminsSelection {...props} />);

            fireEvent.click(screen.getByText('Отмена'));
            expect(props.onClose).toHaveBeenCalledTimes(1);
        });
    });

    // === Ошибка ===

    describe('блок ошибки', () => {
        it('показывает ошибку', () => {
            const props = createDefaultProps({ error: 'Сервер недоступен' });
            render(<PromoteAdminsSelection {...props} />);

            expect(screen.getByText('Сервер недоступен')).toBeInTheDocument();
        });

        it('не показывает блок ошибки когда error=null', () => {
            const props = createDefaultProps({ error: null });
            render(<PromoteAdminsSelection {...props} />);

            expect(screen.queryByText('Сервер недоступен')).not.toBeInTheDocument();
        });
    });
});
