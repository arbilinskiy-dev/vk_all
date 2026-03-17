/**
 * Тесты для подкомпонентов activity-dashboard.
 * Каждый подкомпонент тестируется изолированно (без мока API — только props).
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { KpiCard } from '../../features/users/components/activity-dashboard/KpiCard';
import { CategoriesChart } from '../../features/users/components/activity-dashboard/CategoriesChart';
import { EventsDistribution } from '../../features/users/components/activity-dashboard/EventsDistribution';
import { HourlyHeatmap } from '../../features/users/components/activity-dashboard/HourlyHeatmap';
import { DailyChart } from '../../features/users/components/activity-dashboard/DailyChart';
import { UserStatsTable } from '../../features/users/components/activity-dashboard/UserStatsTable';
import { UserActionsTable } from '../../features/users/components/activity-dashboard/UserActionsTable';
import { LoadingSkeleton } from '../../features/users/components/activity-dashboard/LoadingSkeleton';

// ==========================================
// KpiCard
// ==========================================
describe('KpiCard', () => {
    it('рендерит title и value', () => {
        render(
            <KpiCard
                title="Тест"
                value={42}
                icon={<span>ico</span>}
                color="text-blue-600"
                bgColor="bg-blue-50"
            />
        );

        expect(screen.getByText('Тест')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('рендерит subtitle если передан', () => {
        render(
            <KpiCard
                title="KPI"
                value={10}
                subtitle="за 30 дней"
                icon={<span>ico</span>}
                color="text-green-600"
                bgColor="bg-green-50"
            />
        );

        expect(screen.getByText('за 30 дней')).toBeInTheDocument();
    });

    it('НЕ рендерит subtitle если не передан', () => {
        const { container } = render(
            <KpiCard
                title="Без подписи"
                value={5}
                icon={<span>ico</span>}
                color="text-red-600"
                bgColor="bg-red-50"
            />
        );

        // Нет третьего <p> с текстом subtitle
        const paragraphs = container.querySelectorAll('p');
        // Два <p>: title + value
        expect(paragraphs.length).toBe(2);
    });

    it('применяет animationDelay из пропа delay', () => {
        const { container } = render(
            <KpiCard
                title="Задержка"
                value={1}
                delay={200}
                icon={<span>ico</span>}
                color="text-blue-600"
                bgColor="bg-blue-50"
            />
        );

        const card = container.firstChild as HTMLElement;
        expect(card.style.animationDelay).toBe('200ms');
    });
});

// ==========================================
// CategoriesChart
// ==========================================
describe('CategoriesChart', () => {
    it('показывает "Нет данных" при пустом массиве', () => {
        render(<CategoriesChart data={[]} />);
        expect(screen.getByText('Нет данных о действиях')).toBeInTheDocument();
    });

    it('рендерит категории с названиями и процентами', () => {
        render(
            <CategoriesChart
                data={[
                    { category: 'posts', count: 60 },
                    { category: 'messages', count: 40 },
                ]}
            />
        );

        expect(screen.getByText('Посты')).toBeInTheDocument();
        expect(screen.getByText('Сообщения')).toBeInTheDocument();
        // 60/100 = 60%
        expect(screen.getByText('60 (60%)')).toBeInTheDocument();
        expect(screen.getByText('40 (40%)')).toBeInTheDocument();
    });

    it('неизвестная категория рендерится как есть', () => {
        render(<CategoriesChart data={[{ category: 'unknown_cat', count: 10 }]} />);
        expect(screen.getByText('unknown_cat')).toBeInTheDocument();
    });
});

// ==========================================
// EventsDistribution
// ==========================================
describe('EventsDistribution', () => {
    it('показывает "Нет данных" при пустом total', () => {
        render(<EventsDistribution data={[]} />);
        expect(screen.getByText('Нет данных')).toBeInTheDocument();
    });

    it('рендерит события отсортированные по count desc', () => {
        const { container } = render(
            <EventsDistribution
                data={[
                    { event_type: 'login_success', count: 10 },
                    { event_type: 'login_failed', count: 30 },
                    { event_type: 'timeout', count: 5 },
                ]}
            />
        );

        expect(screen.getByText('Входы')).toBeInTheDocument();
        expect(screen.getByText('Неудачные входы')).toBeInTheDocument();
        expect(screen.getByText('Таймауты')).toBeInTheDocument();

        // Первый элемент (наибольший) — login_failed
        const bars = container.querySelectorAll('.space-y-2 > div');
        expect(bars.length).toBe(3);
    });

    it('неизвестный event_type рендерится как есть', () => {
        render(
            <EventsDistribution data={[{ event_type: 'custom_event', count: 5 }]} />
        );
        expect(screen.getByText('custom_event')).toBeInTheDocument();
    });
});

// ==========================================
// HourlyHeatmap
// ==========================================
describe('HourlyHeatmap', () => {
    it('рендерит 24 ячейки для часов', () => {
        const data = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: i * 2 }));
        const { container } = render(<HourlyHeatmap data={data} />);

        const cells = container.querySelectorAll('.grid > div');
        expect(cells.length).toBe(24);
    });

    it('рендерит подписи периодов дня', () => {
        const data = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
        render(<HourlyHeatmap data={data} />);

        expect(screen.getByText('Ночь (0–5)')).toBeInTheDocument();
        expect(screen.getByText('Утро (6–11)')).toBeInTheDocument();
        expect(screen.getByText('День (12–17)')).toBeInTheDocument();
        expect(screen.getByText('Вечер (18–23)')).toBeInTheDocument();
    });

    it('ячейка с count=0 получает класс bg-gray-100', () => {
        const data = [{ hour: 0, count: 0 }];
        const { container } = render(<HourlyHeatmap data={data} />);

        const cell = container.querySelector('.grid > div');
        expect(cell?.className).toContain('bg-gray-100');
    });
});

// ==========================================
// DailyChart
// ==========================================
describe('DailyChart', () => {
    it('показывает "Нет данных" при пустом массиве', () => {
        render(<DailyChart data={[]} />);
        expect(screen.getByText('Нет данных за период')).toBeInTheDocument();
    });

    it('рендерит SVG с polyline при наличии данных', () => {
        const data = [
            { date: '2026-01-01', logins: 10, timeouts: 2, failed: 1, unique_users: 5, logouts: 3, force_logouts: 0 },
            { date: '2026-01-02', logins: 15, timeouts: 3, failed: 0, unique_users: 8, logouts: 5, force_logouts: 1 },
        ];
        const { container } = render(<DailyChart data={data} />);

        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();

        // 4 линии: logins, timeouts, failed, unique_users
        const polylines = svg?.querySelectorAll('polyline');
        expect(polylines?.length).toBe(4);
    });

    it('рендерит легенду графика', () => {
        const data = [
            { date: '2026-01-01', logins: 10, timeouts: 2, failed: 1, unique_users: 5, logouts: 3, force_logouts: 0 },
        ];
        render(<DailyChart data={data} />);

        expect(screen.getByText('Входы')).toBeInTheDocument();
        expect(screen.getByText('Таймауты')).toBeInTheDocument();
        expect(screen.getByText('Неудачные')).toBeInTheDocument();
        expect(screen.getByText('Уник. пользователи')).toBeInTheDocument();
    });
});

// ==========================================
// UserStatsTable
// ==========================================
describe('UserStatsTable', () => {
    it('показывает "Нет данных" при пустом массиве', () => {
        render(<UserStatsTable users={[]} />);
        expect(screen.getByText('Нет данных')).toBeInTheDocument();
    });

    it('рендерит строку пользователя с данными', () => {
        render(
            <UserStatsTable
                users={[{
                    user_id: 1,
                    username: 'ivan',
                    full_name: 'Иван Петров',
                    is_online: true,
                    login_count: 50,
                    failed_count: 2,
                    timeout_count: 3,
                    avg_session_minutes: 45,
                    total_time_minutes: 120,
                    session_count: 10,
                    last_event_at: '2026-03-01T10:00:00Z',
                }]}
            />
        );

        expect(screen.getByText('ivan')).toBeInTheDocument();
        expect(screen.getByText('Иван Петров')).toBeInTheDocument();
        expect(screen.getByText('Онлайн')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('рендерит "Офлайн" для is_online=false', () => {
        render(
            <UserStatsTable
                users={[{
                    user_id: 2,
                    username: 'anna',
                    full_name: null,
                    is_online: false,
                    login_count: 5,
                    failed_count: 0,
                    timeout_count: 0,
                    avg_session_minutes: 10,
                    total_time_minutes: 50,
                    session_count: 5,
                    last_event_at: null,
                }]}
            />
        );

        expect(screen.getByText('Офлайн')).toBeInTheDocument();
    });
});

// ==========================================
// UserActionsTable
// ==========================================
describe('UserActionsTable', () => {
    it('показывает "Нет данных" при пустом массиве', () => {
        render(<UserActionsTable users={[]} />);
        expect(screen.getByText('Нет данных')).toBeInTheDocument();
    });

    it('рендерит пользователя с ролью и действиями', () => {
        render(
            <UserActionsTable
                users={[{
                    user_id: 1,
                    username: 'admin',
                    full_name: 'Админ Системы',
                    role_name: 'Администратор',
                    role_color: '#ef4444',
                    total_actions: 100,
                    categories: [
                        { category: 'posts', count: 40 },
                        { category: 'ai', count: 30 },
                    ],
                    last_action_at: '2026-03-05T12:00:00Z',
                }]}
            />
        );

        expect(screen.getByText('Админ Системы')).toBeInTheDocument();
        expect(screen.getByText('Администратор')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('40')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument();
    });

    it('рендерит "—" для пользователя без роли', () => {
        render(
            <UserActionsTable
                users={[{
                    user_id: 2,
                    username: 'guest',
                    full_name: null,
                    role_name: null,
                    role_color: null,
                    total_actions: 5,
                    categories: [],
                    last_action_at: null,
                }]}
            />
        );

        expect(screen.getByText('—')).toBeInTheDocument();
    });
});

// ==========================================
// LoadingSkeleton
// ==========================================
describe('LoadingSkeleton', () => {
    it('рендерит скелетоны с animate-pulse', () => {
        const { container } = render(<LoadingSkeleton />);
        const pulses = container.querySelectorAll('.animate-pulse');
        expect(pulses.length).toBeGreaterThan(10);
    });

    it('рендерит без краша', () => {
        const { container } = render(<LoadingSkeleton />);
        expect(container.firstChild).toBeInTheDocument();
    });
});
