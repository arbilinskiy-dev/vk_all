/**
 * Тесты: хук useStatsFilters — P0.
 * Проверяем:
 * — начальное состояние фильтров
 * — projectsMap вычисляется корректно
 * — filteredProjectsStats: фильтр по направлению, поиску, суб-фильтру
 * — displaySummary: пересчёт при фильтре направления
 * — filteredChartData: подмена incoming при суб-фильтре
 * — displayProjectsStats: подмена total_incoming при суб-фильтре
 * — toggleIncomingSubFilter: toggle-поведение
 * — handleSetActiveTab: сброс суб-фильтра при переключении
 * — filterUsersByDirection: фильтр пользователей
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStatsFilters } from '../../features/messages/components/stats/useStatsFilters';
import type { Project } from '../../shared/types';
import type {
    MessageStatsGlobalSummary,
    MessageStatsProjectSummary,
    MessageStatsChartPoint,
    MessageStatsUserItem,
} from '../../services/api/messages_stats.api';

// =============================================================================
// Фабрики мок-данных
// =============================================================================

function createProject(overrides: Partial<Project> = {}): Project {
    return { id: 'proj-1', name: 'Тестовый проект', ...overrides };
}

function createProjectSummary(overrides: Partial<MessageStatsProjectSummary> = {}): MessageStatsProjectSummary {
    return {
        project_id: 'proj-1',
        total_incoming: 100,
        total_outgoing: 50,
        total_messages: 150,
        unique_users: 10,
        incoming_users: 7,
        outgoing_users: 3,
        incoming_payload: 30,
        incoming_text: 70,
        outgoing_system: 20,
        outgoing_bot: 30,
        unique_text_users: 5,
        unique_payload_users: 3,
        unique_dialogs: 8,
        incoming_dialogs: 6,
        dialogs_with_text: 5,
        dialogs_with_payload: 3,
        outgoing_recipients: 4,
        ...overrides,
    };
}

function createSummary(overrides: Partial<MessageStatsGlobalSummary> = {}): MessageStatsGlobalSummary {
    return {
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
        ...overrides,
    };
}

function createChartPoint(overrides: Partial<MessageStatsChartPoint> = {}): MessageStatsChartPoint {
    return {
        hour_slot: '2026-03-06T12:00:00',
        incoming: 10,
        outgoing: 5,
        total: 15,
        unique_users: 3,
        incoming_text: 7,
        incoming_payload: 3,
        ...overrides,
    };
}

function createUser(overrides: Partial<MessageStatsUserItem> = {}): MessageStatsUserItem {
    return {
        vk_user_id: 1001,
        incoming_count: 5,
        outgoing_count: 3,
        total_messages: 8,
        first_message_at: null,
        last_message_at: null,
        first_name: 'Иван',
        last_name: 'Тестов',
        photo_url: null,
        ...overrides,
    };
}

// =============================================================================
// Дефолтные параметры
// =============================================================================

const defaultProjects: Project[] = [
    createProject({ id: 'proj-1', name: 'Проект Альфа' }),
    createProject({ id: 'proj-2', name: 'Проект Бета' }),
];

const defaultProjectsStats: MessageStatsProjectSummary[] = [
    createProjectSummary({ project_id: 'proj-1', total_incoming: 100, total_outgoing: 50 }),
    createProjectSummary({ project_id: 'proj-2', total_incoming: 0, total_outgoing: 80 }),
];

const defaultChartData: MessageStatsChartPoint[] = [
    createChartPoint({ hour_slot: '2026-03-06T10:00:00', incoming: 10, incoming_text: 7, incoming_payload: 3 }),
    createChartPoint({ hour_slot: '2026-03-06T11:00:00', incoming: 20, incoming_text: 12, incoming_payload: 8 }),
];

const defaultSummary = createSummary();

function renderFilters(overrides: Partial<Parameters<typeof useStatsFilters>[0]> = {}) {
    return renderHook(() =>
        useStatsFilters({
            projects: defaultProjects,
            projectsStats: defaultProjectsStats,
            chartData: defaultChartData,
            summary: defaultSummary,
            ...overrides,
        })
    );
}

// =============================================================================
// Тесты
// =============================================================================

describe('useStatsFilters', () => {
    describe('начальное состояние', () => {
        it('значения фильтров по умолчанию', () => {
            const { result } = renderFilters();

            expect(result.current.state.periodType).toBe('today');
            expect(result.current.state.customStartDate).toBe('');
            expect(result.current.state.customEndDate).toBe('');
            expect(result.current.state.selectedProjectId).toBeNull();
            expect(result.current.state.projectSearch).toBe('');
            expect(result.current.state.directionFilter).toBe('all');
            expect(result.current.state.activeTab).toBe('incoming');
            expect(result.current.state.incomingSubFilter).toBe('all');
        });

        it('dateFrom и dateTo вычислены (today по умолчанию)', () => {
            const { result } = renderFilters();

            // Для "today" dateFrom === dateTo === сегодняшняя дата
            expect(result.current.state.dateFrom).toBeTruthy();
            expect(result.current.state.dateTo).toBeTruthy();
            expect(result.current.state.dateFrom).toBe(result.current.state.dateTo);
        });
    });

    describe('projectsMap', () => {
        it('создаёт Map из массива проектов', () => {
            const { result } = renderFilters();

            const map = result.current.state.projectsMap;
            expect(map.size).toBe(2);
            expect(map.get('proj-1')?.name).toBe('Проект Альфа');
            expect(map.get('proj-2')?.name).toBe('Проект Бета');
        });

        it('пустой массив проектов → пустой Map', () => {
            const { result } = renderFilters({ projects: [] });

            expect(result.current.state.projectsMap.size).toBe(0);
        });
    });

    describe('filteredProjectsStats', () => {
        it('без фильтров возвращает все проекты', () => {
            const { result } = renderFilters();

            expect(result.current.state.filteredProjectsStats).toHaveLength(2);
        });

        it('фильтр "incoming" — только проекты с total_incoming > 0', () => {
            const { result } = renderFilters();

            act(() => {
                result.current.actions.toggleDirectionFilter('incoming');
            });

            // proj-1 имеет total_incoming=100, proj-2 имеет total_incoming=0
            expect(result.current.state.filteredProjectsStats).toHaveLength(1);
            expect(result.current.state.filteredProjectsStats[0].project_id).toBe('proj-1');
        });

        it('фильтр "outgoing" — только проекты с total_outgoing > 0', () => {
            const { result } = renderFilters();

            act(() => {
                result.current.actions.toggleDirectionFilter('outgoing');
            });

            // Оба проекта имеют total_outgoing > 0
            expect(result.current.state.filteredProjectsStats).toHaveLength(2);
        });

        it('фильтр по строке поиска (по имени проекта)', () => {
            const { result } = renderFilters();

            act(() => {
                result.current.actions.setProjectSearch('Альфа');
            });

            expect(result.current.state.filteredProjectsStats).toHaveLength(1);
            expect(result.current.state.filteredProjectsStats[0].project_id).toBe('proj-1');
        });

        it('фильтр по строке поиска (по project_id)', () => {
            const { result } = renderFilters();

            act(() => {
                result.current.actions.setProjectSearch('proj-2');
            });

            expect(result.current.state.filteredProjectsStats).toHaveLength(1);
            expect(result.current.state.filteredProjectsStats[0].project_id).toBe('proj-2');
        });

        it('пустой результат при несовпадающем поиске', () => {
            const { result } = renderFilters();

            act(() => {
                result.current.actions.setProjectSearch('Несуществующий');
            });

            expect(result.current.state.filteredProjectsStats).toHaveLength(0);
        });

        it('суб-фильтр "text" на вкладке incoming', () => {
            const stats = [
                createProjectSummary({ project_id: 'proj-1', incoming_text: 70 }),
                createProjectSummary({ project_id: 'proj-2', incoming_text: 0 }),
            ];
            const { result } = renderFilters({ projectsStats: stats });

            act(() => {
                result.current.actions.toggleIncomingSubFilter('text');
            });

            // Только проекты с incoming_text > 0
            expect(result.current.state.filteredProjectsStats).toHaveLength(1);
            expect(result.current.state.filteredProjectsStats[0].project_id).toBe('proj-1');
        });

        it('суб-фильтр "payload" на вкладке incoming', () => {
            const stats = [
                createProjectSummary({ project_id: 'proj-1', incoming_payload: 30 }),
                createProjectSummary({ project_id: 'proj-2', incoming_payload: 0 }),
            ];
            const { result } = renderFilters({ projectsStats: stats });

            act(() => {
                result.current.actions.toggleIncomingSubFilter('payload');
            });

            expect(result.current.state.filteredProjectsStats).toHaveLength(1);
            expect(result.current.state.filteredProjectsStats[0].project_id).toBe('proj-1');
        });
    });

    describe('displaySummary', () => {
        it('при directionFilter=all возвращает оригинальный summary', () => {
            const { result } = renderFilters();

            expect(result.current.state.displaySummary).toBe(defaultSummary);
        });

        it('при directionFilter=incoming пересчитывает из проектов', () => {
            const { result } = renderFilters();

            act(() => {
                result.current.actions.toggleDirectionFilter('incoming');
            });

            const display = result.current.state.displaySummary!;
            // proj-1 total_incoming=100 (единственный с incoming > 0)
            expect(display.total_messages).toBe(100);
            expect(display.total_projects).toBe(1);
            // unique_users берётся из summary.incoming_users
            expect(display.unique_users).toBe(defaultSummary.incoming_users);
        });

        it('при directionFilter=outgoing пересчитывает из проектов', () => {
            const { result } = renderFilters();

            act(() => {
                result.current.actions.toggleDirectionFilter('outgoing');
            });

            const display = result.current.state.displaySummary!;
            // Оба проекта: 50 + 80 = 130
            expect(display.total_messages).toBe(130);
            expect(display.total_projects).toBe(2);
            expect(display.unique_users).toBe(defaultSummary.outgoing_users);
        });

        it('null summary → displaySummary = null', () => {
            const { result } = renderFilters({ summary: null });

            expect(result.current.state.displaySummary).toBeNull();
        });
    });

    describe('filteredChartData', () => {
        it('при incomingSubFilter=all возвращает оригинал', () => {
            const { result } = renderFilters();

            expect(result.current.state.filteredChartData).toBe(defaultChartData);
        });

        it('при incomingSubFilter=text подменяет incoming на incoming_text', () => {
            const { result } = renderFilters();

            act(() => {
                result.current.actions.toggleIncomingSubFilter('text');
            });

            expect(result.current.state.filteredChartData[0].incoming).toBe(7);
            expect(result.current.state.filteredChartData[1].incoming).toBe(12);
        });

        it('при incomingSubFilter=payload подменяет incoming на incoming_payload', () => {
            const { result } = renderFilters();

            act(() => {
                result.current.actions.toggleIncomingSubFilter('payload');
            });

            expect(result.current.state.filteredChartData[0].incoming).toBe(3);
            expect(result.current.state.filteredChartData[1].incoming).toBe(8);
        });

        it('суб-фильтр не влияет на вкладке outgoing', () => {
            const { result } = renderFilters();

            act(() => {
                result.current.actions.setActiveTab('outgoing');
            });
            act(() => {
                result.current.actions.toggleIncomingSubFilter('text');
            });

            // setActiveTab сбрасывает incomingSubFilter → остаётся 'all'
            expect(result.current.state.filteredChartData).toBe(defaultChartData);
        });
    });

    describe('displayProjectsStats', () => {
        it('при incomingSubFilter=all совпадает с filteredProjectsStats', () => {
            const { result } = renderFilters();

            expect(result.current.state.displayProjectsStats).toBe(result.current.state.filteredProjectsStats);
        });

        it('при incomingSubFilter=text подменяет total_incoming', () => {
            const { result } = renderFilters();

            act(() => {
                result.current.actions.toggleIncomingSubFilter('text');
            });

            const first = result.current.state.displayProjectsStats[0];
            // incoming_text из filteredProjectsStats[0] (filtered_incoming_text ?? incoming_text) = 70
            expect(first.total_incoming).toBe(70);
            // incoming_dialogs подменяется на dialogs_with_text = 5
            expect(first.incoming_dialogs).toBe(5);
        });

        it('при incomingSubFilter=payload подменяет total_incoming', () => {
            const { result } = renderFilters();

            act(() => {
                result.current.actions.toggleIncomingSubFilter('payload');
            });

            const first = result.current.state.displayProjectsStats[0];
            // incoming_payload = 30
            expect(first.total_incoming).toBe(30);
            // incoming_dialogs подменяется на dialogs_with_payload = 3
            expect(first.incoming_dialogs).toBe(3);
        });
    });

    describe('actions', () => {
        it('toggleIncomingSubFilter: toggle-поведение', () => {
            const { result } = renderFilters();

            // Активируем text
            act(() => {
                result.current.actions.toggleIncomingSubFilter('text');
            });
            expect(result.current.state.incomingSubFilter).toBe('text');

            // Повторный клик → сброс в 'all'
            act(() => {
                result.current.actions.toggleIncomingSubFilter('text');
            });
            expect(result.current.state.incomingSubFilter).toBe('all');

            // Другой фильтр
            act(() => {
                result.current.actions.toggleIncomingSubFilter('payload');
            });
            expect(result.current.state.incomingSubFilter).toBe('payload');
        });

        it('handleSetActiveTab: переключение вкладки сбрасывает суб-фильтр', () => {
            const { result } = renderFilters();

            act(() => {
                result.current.actions.toggleIncomingSubFilter('text');
            });
            expect(result.current.state.incomingSubFilter).toBe('text');

            act(() => {
                result.current.actions.setActiveTab('outgoing');
            });
            expect(result.current.state.activeTab).toBe('outgoing');
            expect(result.current.state.incomingSubFilter).toBe('all');
        });

        it('handleProjectFilter: toggle-поведение выбора проекта', () => {
            const { result } = renderFilters();

            act(() => {
                result.current.actions.handleProjectFilter('proj-1');
            });
            expect(result.current.state.selectedProjectId).toBe('proj-1');

            // Повторный клик → сброс
            act(() => {
                result.current.actions.handleProjectFilter('proj-1');
            });
            expect(result.current.state.selectedProjectId).toBeNull();
        });

        it('toggleDirectionFilter: toggle-поведение', () => {
            const { result } = renderFilters();

            act(() => {
                result.current.actions.toggleDirectionFilter('incoming');
            });
            expect(result.current.state.directionFilter).toBe('incoming');

            // Повторный клик → сброс в 'all'
            act(() => {
                result.current.actions.toggleDirectionFilter('incoming');
            });
            expect(result.current.state.directionFilter).toBe('all');
        });

        it('filterUsersByDirection: фильтрация пользователей', () => {
            const users: MessageStatsUserItem[] = [
                createUser({ vk_user_id: 1, incoming_count: 5, outgoing_count: 0 }),
                createUser({ vk_user_id: 2, incoming_count: 0, outgoing_count: 3 }),
                createUser({ vk_user_id: 3, incoming_count: 2, outgoing_count: 1 }),
            ];

            const { result } = renderFilters();

            // По умолчанию direction=all → все пользователи
            let filtered = result.current.actions.filterUsersByDirection(users);
            expect(filtered).toHaveLength(3);

            // Фильтр incoming
            act(() => {
                result.current.actions.toggleDirectionFilter('incoming');
            });
            filtered = result.current.actions.filterUsersByDirection(users);
            expect(filtered).toHaveLength(2); // user 1 и 3

            // Фильтр outgoing
            act(() => {
                result.current.actions.toggleDirectionFilter('incoming'); // сброс
            });
            act(() => {
                result.current.actions.toggleDirectionFilter('outgoing');
            });
            filtered = result.current.actions.filterUsersByDirection(users);
            expect(filtered).toHaveLength(2); // user 2 и 3
        });
    });
});
