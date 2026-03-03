// Тесты компонента SandboxProjectsColumn
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SandboxProjectsColumn } from '../../features/training/components/content/section2/content-management-overview/SandboxProjectsColumn';
import { Project, TeamFilter, PostFilter } from '../../features/training/components/content/section2/content-management-overview/types';

// Тестовые проекты
const mockProjects: Project[] = [
    { id: 'p1', name: 'Проект Альфа', team: 'В', posts: 0, hasWarning: true },
    { id: 'p2', name: 'Проект Бета', team: 'С', posts: 5, hasWarning: false },
    { id: 'p3', name: 'Проект Гамма', team: 'А', posts: 12, hasWarning: false },
];

// Хелпер для создания дефолтных пропсов
const createDefaultProps = (overrides?: Partial<{
    searchQuery: string;
    teamFilter: TeamFilter;
    postFilter: PostFilter;
    filteredProjects: Project[];
    selectedProject: string;
    setSearchQuery: (q: string) => void;
    setTeamFilter: (f: TeamFilter) => void;
    setPostFilter: (f: PostFilter) => void;
    setSelectedProject: (id: string) => void;
}>) => ({
    searchQuery: '',
    teamFilter: 'all' as TeamFilter,
    postFilter: 'all' as PostFilter,
    filteredProjects: mockProjects,
    selectedProject: 'p1',
    setSearchQuery: vi.fn(),
    setTeamFilter: vi.fn(),
    setPostFilter: vi.fn(),
    setSelectedProject: vi.fn(),
    ...overrides,
});

describe('SandboxProjectsColumn', () => {
    it('рендерится без ошибок', () => {
        const props = createDefaultProps();
        render(<SandboxProjectsColumn {...props} />);
        expect(screen.getByText('Проекты')).toBeInTheDocument();
    });

    it('отображает список проектов', () => {
        const props = createDefaultProps();
        render(<SandboxProjectsColumn {...props} />);
        expect(screen.getByText('Проект Альфа')).toBeInTheDocument();
        expect(screen.getByText('Проект Бета')).toBeInTheDocument();
        expect(screen.getByText('Проект Гамма')).toBeInTheDocument();
    });

    it('отображает поле поиска', () => {
        const props = createDefaultProps();
        render(<SandboxProjectsColumn {...props} />);
        expect(screen.getByPlaceholderText('Поиск по названию...')).toBeInTheDocument();
    });

    it('вызывает setSearchQuery при вводе в поле поиска', () => {
        const setSearchQuery = vi.fn();
        const props = createDefaultProps({ setSearchQuery });
        render(<SandboxProjectsColumn {...props} />);

        const input = screen.getByPlaceholderText('Поиск по названию...');
        fireEvent.change(input, { target: { value: 'тест' } });
        expect(setSearchQuery).toHaveBeenCalledWith('тест');
    });

    it('отображает кнопки фильтров команд', () => {
        const props = createDefaultProps();
        render(<SandboxProjectsColumn {...props} />);
        expect(screen.getByText('Команды')).toBeInTheDocument();
        // Кнопка "Все" для команд
        const allButtons = screen.getAllByText('Все');
        expect(allButtons.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('В')).toBeInTheDocument();
        expect(screen.getByText('С')).toBeInTheDocument();
        expect(screen.getByText('А')).toBeInTheDocument();
        expect(screen.getByText('Без команды')).toBeInTheDocument();
    });

    it('вызывает setTeamFilter при клике на фильтр команды', () => {
        const setTeamFilter = vi.fn();
        const props = createDefaultProps({ setTeamFilter });
        render(<SandboxProjectsColumn {...props} />);

        fireEvent.click(screen.getByText('В'));
        expect(setTeamFilter).toHaveBeenCalledWith('В');
    });

    it('отображает кнопки фильтров по количеству постов', () => {
        const props = createDefaultProps();
        render(<SandboxProjectsColumn {...props} />);
        expect(screen.getByText('Отложенные посты')).toBeInTheDocument();
        expect(screen.getByText('Нет постов')).toBeInTheDocument();
        expect(screen.getByText('Есть посты')).toBeInTheDocument();
        expect(screen.getByText('< 5')).toBeInTheDocument();
        expect(screen.getByText('5-10')).toBeInTheDocument();
        expect(screen.getByText('> 10')).toBeInTheDocument();
    });

    it('вызывает setPostFilter при клике на фильтр постов', () => {
        const setPostFilter = vi.fn();
        const props = createDefaultProps({ setPostFilter });
        render(<SandboxProjectsColumn {...props} />);

        fireEvent.click(screen.getByText('Нет постов'));
        expect(setPostFilter).toHaveBeenCalledWith('empty');
    });

    it('вызывает setSelectedProject при клике на проект', () => {
        const setSelectedProject = vi.fn();
        const props = createDefaultProps({ setSelectedProject });
        render(<SandboxProjectsColumn {...props} />);

        fireEvent.click(screen.getByText('Проект Бета'));
        expect(setSelectedProject).toHaveBeenCalledWith('p2');
    });

    it('отображает счётчики постов', () => {
        const props = createDefaultProps();
        render(<SandboxProjectsColumn {...props} />);
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('показывает заглушку при пустом списке проектов', () => {
        const props = createDefaultProps({ filteredProjects: [] });
        render(<SandboxProjectsColumn {...props} />);
        expect(screen.getByText('Проекты не найдены')).toBeInTheDocument();
        expect(screen.getByText('Попробуйте изменить фильтры')).toBeInTheDocument();
    });
});
