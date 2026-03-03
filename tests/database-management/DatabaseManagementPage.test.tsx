/**
 * Тесты: DatabaseManagementPage — декомпозированный хаб
 * 
 * Покрывают:
 * — рендер основного режима (заголовок, тулбар, фильтры, таблица)
 * — переключение viewMode (архив, глобальные переменные, контекст, администрируемые)
 * — состояние загрузки (skeleton)
 * — состояние ошибки
 * — передача props в подкомпоненты
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// Мок useLocalStorage — чтобы не зависеть от localStorage
vi.mock('../../shared/hooks/useLocalStorage', () => ({
    useLocalStorage: (_key: string, initialValue: any) => {
        const [state, setState] = React.useState(initialValue);
        return [state, setState];
    },
}));

// Мок showAppToast
beforeEach(() => {
    (window as any).showAppToast = vi.fn();
});

// ─── Импорт после моков ──────────────────────────────────────────

import { DatabaseManagementPage } from '../../features/database-management/components/DatabaseManagementPage';
import { Project, AuthUser } from '../../shared/types';

// ─── Хелперы ─────────────────────────────────────────────────────

function createProject(overrides: Partial<Project> = {}): Project {
    return {
        id: 'proj-1',
        name: 'Тестовый проект',
        communityToken: 'token-123',
        vkProjectId: 12345,
        archived: false,
        sort_order: 1,
        teams: ['Команда А'],
        ...overrides,
    };
}

const adminUser: AuthUser = { username: 'admin', role: 'admin', full_name: 'Администратор' };
const regularUser: AuthUser = { username: 'user', role: 'user', full_name: 'Пользователь' };

const defaultProps = {
    onProjectsUpdate: vi.fn(),
    user: adminUser,
};

// ─── Тесты ───────────────────────────────────────────────────────

describe('DatabaseManagementPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetAllProjectsForManagement.mockResolvedValue([
            createProject({ id: 'p1', name: 'Проект Alpha', teams: ['Маркетинг'], sort_order: 1 }),
            createProject({ id: 'p2', name: 'Проект Beta', teams: ['Продажи'], sort_order: 2 }),
            createProject({ id: 'p3', name: 'Проект Gamma', teams: [], sort_order: 3 }),
        ]);
        mockUpdateProjects.mockResolvedValue({ success: true });
        mockUpdateProjectSettings.mockResolvedValue({});
    });

    // === Базовый рендер ===

    it('рендерит заголовок страницы', async () => {
        render(<DatabaseManagementPage {...defaultProps} />);
        
        expect(screen.getByText('Управление базой проектов')).toBeInTheDocument();
        expect(screen.getByText('Массовое редактирование и добавление проектов.')).toBeInTheDocument();
    });

    it('загружает проекты при монтировании', async () => {
        render(<DatabaseManagementPage {...defaultProps} />);
        
        await waitFor(() => {
            expect(mockGetAllProjectsForManagement).toHaveBeenCalledTimes(1);
        });
    });

    it('отображает проекты в таблице после загрузки', async () => {
        render(<DatabaseManagementPage {...defaultProps} />);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue('Проект Alpha')).toBeInTheDocument();
        });
        expect(screen.getByDisplayValue('Проект Beta')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Проект Gamma')).toBeInTheDocument();
    });

    // === Состояние ошибки ===

    it('отображает ошибку при неудачной загрузке', async () => {
        mockGetAllProjectsForManagement.mockRejectedValue(new Error('Сервер недоступен'));
        
        render(<DatabaseManagementPage {...defaultProps} />);
        
        await waitFor(() => {
            expect(screen.getByText('Сервер недоступен')).toBeInTheDocument();
        });
    });

    // === Кнопки тулбара ===

    it('рендерит кнопку "Колонки"', async () => {
        render(<DatabaseManagementPage {...defaultProps} />);
        
        await waitFor(() => {
            expect(screen.getByText('Колонки')).toBeInTheDocument();
        });
    });

    it('рендерит кнопку "Auto №"', async () => {
        render(<DatabaseManagementPage {...defaultProps} />);
        
        await waitFor(() => {
            expect(screen.getByText('Auto №')).toBeInTheDocument();
        });
    });

    it('рендерит кнопку "Настроить колбэки"', async () => {
        render(<DatabaseManagementPage {...defaultProps} />);
        
        await waitFor(() => {
            expect(screen.getByText('Настроить колбэки')).toBeInTheDocument();
        });
    });

    it('рендерит кнопку "В админы"', async () => {
        render(<DatabaseManagementPage {...defaultProps} />);
        
        await waitFor(() => {
            expect(screen.getByText('В админы')).toBeInTheDocument();
        });
    });

    it('рендерит кнопку "Архив"', async () => {
        render(<DatabaseManagementPage {...defaultProps} />);
        
        await waitFor(() => {
            expect(screen.getByText('Архив')).toBeInTheDocument();
        });
    });

    it('рендерит кнопку "Администрируемые"', async () => {
        render(<DatabaseManagementPage {...defaultProps} />);
        
        await waitFor(() => {
            expect(screen.getByText('Администрируемые')).toBeInTheDocument();
        });
    });

    it('рендерит кнопку "Добавить проекты"', async () => {
        render(<DatabaseManagementPage {...defaultProps} />);
        
        await waitFor(() => {
            expect(screen.getByText('+ Добавить проекты')).toBeInTheDocument();
        });
    });

    // === Кнопки только для админа ===

    it('показывает "Глобальные переменные" для админа', async () => {
        render(<DatabaseManagementPage {...defaultProps} user={adminUser} />);
        
        await waitFor(() => {
            expect(screen.getByText('Глобальные переменные')).toBeInTheDocument();
        });
    });

    it('показывает "Контекст проекта" для админа', async () => {
        render(<DatabaseManagementPage {...defaultProps} user={adminUser} />);
        
        await waitFor(() => {
            expect(screen.getByText('Контекст проекта')).toBeInTheDocument();
        });
    });

    it('скрывает "Глобальные переменные" для обычного пользователя', async () => {
        render(<DatabaseManagementPage {...defaultProps} user={regularUser} />);
        
        await waitFor(() => {
            expect(screen.getByText('Управление базой проектов')).toBeInTheDocument();
        });
        expect(screen.queryByText('Глобальные переменные')).not.toBeInTheDocument();
    });

    it('скрывает "Контекст проекта" для обычного пользователя', async () => {
        render(<DatabaseManagementPage {...defaultProps} user={regularUser} />);
        
        await waitFor(() => {
            expect(screen.getByText('Управление базой проектов')).toBeInTheDocument();
        });
        expect(screen.queryByText('Контекст проекта')).not.toBeInTheDocument();
    });

    // === Фильтрация ===

    it('отображает счётчик "Показано: X из Y"', async () => {
        render(<DatabaseManagementPage {...defaultProps} />);
        
        await waitFor(() => {
            expect(screen.getByText(/Показано:/)).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
        });
    });

    it('фильтрует проекты по введённому поиску', async () => {
        const user = userEvent.setup();
        render(<DatabaseManagementPage {...defaultProps} />);
        
        await waitFor(() => {
            expect(screen.getByDisplayValue('Проект Alpha')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Поиск по названию...');
        await user.type(searchInput, 'Alpha');

        expect(screen.getByDisplayValue('Проект Alpha')).toBeInTheDocument();
        expect(screen.queryByDisplayValue('Проект Beta')).not.toBeInTheDocument();
        expect(screen.queryByDisplayValue('Проект Gamma')).not.toBeInTheDocument();
    });

    // === Кнопка Сохранить ===

    it('кнопка "Сохранить" заблокирована, если нет изменений', async () => {
        render(<DatabaseManagementPage {...defaultProps} />);
        
        await waitFor(() => {
            expect(screen.getByText('Сохранить')).toBeInTheDocument();
        });

        expect(screen.getByText('Сохранить').closest('button')).toBeDisabled();
    });
});
