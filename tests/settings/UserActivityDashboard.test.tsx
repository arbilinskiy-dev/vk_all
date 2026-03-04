/**
 * Тесты для компонента UserActivityDashboard — аналитика активности.
 * Проверяет рендер KPI, секции бизнес-действий, null-safety, лоадер.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ActivityDashboardResponse } from '../../services/api/user_activity.api';

// --- Мок AnimatedCounter → просто рендерит число ---
vi.mock('../../features/automations/stories-automation/components/dashboard/AnimatedCounter', () => ({
    AnimatedCounter: ({ value }: { value: number }) => <span data-testid="animated-counter">{value}</span>,
}));

// --- Мок api-хаба ---
const mockGetUserActivityDashboard = vi.fn();

vi.mock('../../services/api', () => ({
    getUserActivityDashboard: (...args: any[]) => mockGetUserActivityDashboard(...args),
}));

import { UserActivityDashboard } from '../../features/users/components/UserActivityDashboard';

// --- Фикстуры ---

/** Минимальная summary для KPI */
const MOCK_SUMMARY = {
    total_active_users: 5,
    total_logins: 120,
    total_failed_logins: 3,
    total_timeouts: 7,
    total_force_logouts: 1,
    online_now: 2,
    avg_session_minutes: 45.5,
    period_days: 30,
};

/** Сводка по бизнес-действиям */
const MOCK_ACTIONS_SUMMARY = {
    total_actions: 250,
    active_doers: 4,
    top_categories: [
        { category: 'posts', count: 100 },
        { category: 'messages', count: 80 },
    ],
    top_actions: [
        { action_type: 'post_save', count: 60 },
        { action_type: 'message_send', count: 50 },
    ],
};

/** Полный успешный ответ */
function createFullDashboardData(overrides: Partial<ActivityDashboardResponse> = {}): ActivityDashboardResponse {
    return {
        summary: MOCK_SUMMARY,
        user_stats: [],
        daily_chart: [],
        hourly_chart: [],
        events_chart: [],
        actions_summary: MOCK_ACTIONS_SUMMARY,
        user_actions_stats: [],
        daily_actions: [],
        ...overrides,
    };
}

describe('UserActivityDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- Загрузка ---

    it('показывает лоадер при загрузке (скелетон)', () => {
        // API никогда не резолвится — pending
        mockGetUserActivityDashboard.mockReturnValue(new Promise(() => {}));

        render(<UserActivityDashboard />);

        // Скелетон содержит animate-pulse элементы
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('показывает ошибку при неудачной загрузке', async () => {
        mockGetUserActivityDashboard.mockRejectedValue(new Error('Нет подключения'));

        render(<UserActivityDashboard />);

        await waitFor(() => {
            expect(screen.getByText('Нет подключения')).toBeInTheDocument();
        });
    });

    // --- KPI-карточки ---

    it('отображает KPI-карточки с summary данными', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(createFullDashboardData());

        render(<UserActivityDashboard />);

        await waitFor(() => {
            // AnimatedCounter замокирован → числа рендерятся как текст
            expect(screen.getByText('Сейчас онлайн')).toBeInTheDocument();
            expect(screen.getByText('Уник. пользователей')).toBeInTheDocument();
            expect(screen.getByText('Всего входов')).toBeInTheDocument();
            expect(screen.getByText('Неудачных входов')).toBeInTheDocument();
            expect(screen.getByText('Таймаутов')).toBeInTheDocument();
            expect(screen.getByText('Сред. сессия')).toBeInTheDocument();
        });
    });

    it('отображает заголовок "Аналитика активности"', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(createFullDashboardData());

        render(<UserActivityDashboard />);

        await waitFor(() => {
            expect(screen.getByText('Аналитика активности')).toBeInTheDocument();
        });
    });

    it('отображает кнопки переключения периода', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(createFullDashboardData());

        render(<UserActivityDashboard />);

        await waitFor(() => {
            expect(screen.getByText('7 дней')).toBeInTheDocument();
            expect(screen.getByText('14 дней')).toBeInTheDocument();
            expect(screen.getByText('30 дней')).toBeInTheDocument();
            expect(screen.getByText('90 дней')).toBeInTheDocument();
        });
    });

    // --- Бизнес-действия ---

    it('отображает секцию "Бизнес-действия" если actions_summary присутствует', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(createFullDashboardData());

        render(<UserActivityDashboard />);

        await waitFor(() => {
            expect(screen.getByText('Бизнес-действия')).toBeInTheDocument();
            expect(screen.getByText('Мониторинг реальной работы: кто что делает в системе')).toBeInTheDocument();
        });
    });

    it('отображает KPI бизнес-действий: "Всего действий", "Активных юзеров"', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(createFullDashboardData());

        render(<UserActivityDashboard />);

        await waitFor(() => {
            expect(screen.getByText('Всего действий')).toBeInTheDocument();
            expect(screen.getByText('Активных юзеров')).toBeInTheDocument();
            expect(screen.getByText('Топ категория')).toBeInTheDocument();
            expect(screen.getByText('Топ действие')).toBeInTheDocument();
        });
    });

    it('НЕ отображает "Бизнес-действия" если actions_summary undefined', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(
            createFullDashboardData({ actions_summary: undefined })
        );

        render(<UserActivityDashboard />);

        await waitFor(() => {
            expect(screen.getByText('Аналитика активности')).toBeInTheDocument();
        });

        // Секция "Бизнес-действия" не должна рендериться
        // Заголовок "Бизнес-действия" всегда рендерится, но KPI-карточки — только при наличии actions_summary
        // Проверяем отсутствие KPI "Всего действий"
        expect(screen.queryByText('Всего действий')).not.toBeInTheDocument();
    });

    // --- Null-safety ---

    it('рендерится без краша при daily_chart=null', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(
            createFullDashboardData({ daily_chart: null as any })
        );

        render(<UserActivityDashboard />);

        await waitFor(() => {
            expect(screen.getByText('Аналитика активности')).toBeInTheDocument();
        });
    });

    it('рендерится без краша при hourly_chart=null', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(
            createFullDashboardData({ hourly_chart: null as any })
        );

        render(<UserActivityDashboard />);

        await waitFor(() => {
            expect(screen.getByText('Аналитика активности')).toBeInTheDocument();
        });
    });

    it('рендерится без краша при events_chart=null', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(
            createFullDashboardData({ events_chart: null as any })
        );

        render(<UserActivityDashboard />);

        await waitFor(() => {
            expect(screen.getByText('Аналитика активности')).toBeInTheDocument();
        });
    });

    it('рендерится без краша при user_stats=null', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(
            createFullDashboardData({ user_stats: null as any })
        );

        render(<UserActivityDashboard />);

        await waitFor(() => {
            expect(screen.getByText('Аналитика активности')).toBeInTheDocument();
        });
    });

    it('рендерится без краша при всех полях = null одновременно', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(
            createFullDashboardData({
                daily_chart: null as any,
                hourly_chart: null as any,
                events_chart: null as any,
                user_stats: null as any,
                actions_summary: undefined,
            })
        );

        render(<UserActivityDashboard />);

        await waitFor(() => {
            expect(screen.getByText('Аналитика активности')).toBeInTheDocument();
        });
    });

    // --- top_categories / top_actions ---

    it('рендерит top_categories корректно — "Посты" как топ категория', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(createFullDashboardData());

        render(<UserActivityDashboard />);

        await waitFor(() => {
            // top_categories[0] = {category: 'posts', count: 100} → "Посты"
            // "Посты" может встречаться в KPI-карточке и в графике категорий
            const matches = screen.getAllByText('Посты');
            expect(matches.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('рендерит top_actions корректно — "Сохранение поста"', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(createFullDashboardData());

        render(<UserActivityDashboard />);

        await waitFor(() => {
            // top_actions[0] = {action_type: 'post_save', count: 60} → "Сохранение поста"
            // Может встречаться в KPI и в списке топ-действий
            const matches = screen.getAllByText('Сохранение поста');
            expect(matches.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('рендерит "—" если top_categories пустой массив', async () => {
        const emptyActionsSummary = {
            ...MOCK_ACTIONS_SUMMARY,
            top_categories: [],
            top_actions: [],
        };
        mockGetUserActivityDashboard.mockResolvedValue(
            createFullDashboardData({ actions_summary: emptyActionsSummary })
        );

        render(<UserActivityDashboard />);

        await waitFor(() => {
            // Когда top_categories пуст → KPI-карточка "Топ категория" показывает "—"
            const dashes = screen.getAllByText('—');
            expect(dashes.length).toBeGreaterThanOrEqual(2); // "Топ категория" + "Топ действие"
        });
    });

    it('рендерит "—" если top_categories null', async () => {
        const nullActionsSummary = {
            ...MOCK_ACTIONS_SUMMARY,
            top_categories: null,
            top_actions: null,
        };
        mockGetUserActivityDashboard.mockResolvedValue(
            createFullDashboardData({ actions_summary: nullActionsSummary })
        );

        render(<UserActivityDashboard />);

        await waitFor(() => {
            const dashes = screen.getAllByText('—');
            expect(dashes.length).toBeGreaterThanOrEqual(2);
        });
    });

    // --- Графики (заголовки секций) ---

    it('рендерит заголовки секций графиков', async () => {
        mockGetUserActivityDashboard.mockResolvedValue(createFullDashboardData());

        render(<UserActivityDashboard />);

        await waitFor(() => {
            expect(screen.getByText('Активность по дням')).toBeInTheDocument();
            expect(screen.getByText('Распределение событий')).toBeInTheDocument();
            expect(screen.getByText('Пик активности по часам (входы)')).toBeInTheDocument();
            expect(screen.getByText('Статистика авторизации по пользователям')).toBeInTheDocument();
        });
    });
});
