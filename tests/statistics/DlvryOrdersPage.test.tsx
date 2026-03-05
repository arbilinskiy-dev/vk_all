/**
 * Тесты компонента DlvryOrdersPage.
 * Проверяем: рендер без проекта, рендер без affiliate_id,
 * отображение статистики, таблицы заказов, пагинации, фильтров.
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Моки API
const mockFetchOrders = vi.fn();
const mockFetchStats = vi.fn();
const mockFetchDetail = vi.fn();

vi.mock('../../services/api/dlvry.api', () => ({
    fetchDlvryOrders: (...args: any[]) => mockFetchOrders(...args),
    fetchDlvryOrdersStats: (...args: any[]) => mockFetchStats(...args),
    fetchDlvryOrderDetail: (...args: any[]) => mockFetchDetail(...args),
}));

// Мок WelcomeScreen
vi.mock('../../shared/components/WelcomeScreen', () => ({
    WelcomeScreen: () => <div data-testid="welcome-screen">Welcome</div>,
}));

import { DlvryOrdersPage } from '../../features/statistics/dlvry/DlvryOrdersPage';
import { Project } from '../../shared/types';

// =============================================================================
// Фикстуры
// =============================================================================

function createMockProject(overrides: Partial<Project> = {}): Project {
    return {
        id: 'proj-1',
        name: 'Тестовый проект',
        vk_group_id: '123',
        access_token: 'token',
        team: 'Команда 1',
        dlvry_affiliate_id: 'aff-100',
        ...overrides,
    } as Project;
}

function createMockOrdersResponse(count = 2) {
    const orders = Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        dlvry_order_id: String(1000 + i),
        affiliate_id: 'aff-100',
        order_date: '2026-03-01T10:00:00',
        client_name: `Клиент ${i + 1}`,
        client_phone: `+7900000000${i}`,
        total: 1500 + i * 100,
        payment_type: 'Онлайн',
        delivery_type: 'Доставка',
        source_name: 'VK Mini App',
        status: 'new',
        items_count: 3,
        created_at: '2026-03-01T10:00:00',
    }));
    return { orders, total: count, skip: 0, limit: 25 };
}

function createMockStatsResponse() {
    return {
        total_orders: 42,
        total_revenue: 63000,
        avg_check: 1500,
        orders_today: 3,
        revenue_today: 4500,
        orders_this_week: 15,
        revenue_this_week: 22500,
        orders_this_month: 42,
        revenue_this_month: 63000,
        top_sources: {},
        top_payment_types: {},
        top_delivery_types: {},
    };
}

// =============================================================================
// Тесты
// =============================================================================

describe('DlvryOrdersPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetchOrders.mockResolvedValue(createMockOrdersResponse());
        mockFetchStats.mockResolvedValue(createMockStatsResponse());
    });

    // ─────────────────────────────────────────────────────────────────────
    // Пустые состояния
    // ─────────────────────────────────────────────────────────────────────

    it('показывает WelcomeScreen без проекта', () => {
        render(<DlvryOrdersPage project={null} />);
        expect(screen.getByTestId('welcome-screen')).toBeInTheDocument();
    });

    it('показывает заглушку если dlvry_affiliate_id не настроен', () => {
        const project = createMockProject({ dlvry_affiliate_id: undefined });
        render(<DlvryOrdersPage project={project} />);

        expect(screen.getByText('DLVRY не настроен')).toBeInTheDocument();
        expect(screen.getByText(/Affiliate ID/i)).toBeInTheDocument();
    });

    // ─────────────────────────────────────────────────────────────────────
    // Основной рендер
    // ─────────────────────────────────────────────────────────────────────

    it('показывает заголовок и название проекта', async () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);

        expect(screen.getByText('DLVRY Заказы')).toBeInTheDocument();
        expect(screen.getByText(/Тестовый проект/)).toBeInTheDocument();
        expect(screen.getByText(/aff-100/)).toBeInTheDocument();
    });

    it('отображает карточки статистики после загрузки', async () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);

        await waitFor(() => {
            expect(screen.getByText('Всего заказов')).toBeInTheDocument();
        });

        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('Средний чек')).toBeInTheDocument();
        expect(screen.getByText('Заказов сегодня')).toBeInTheDocument();
    });

    it('отображает заказы в таблице', async () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);

        await waitFor(() => {
            expect(screen.getByText('Клиент 1')).toBeInTheDocument();
        });

        expect(screen.getByText('Клиент 2')).toBeInTheDocument();
        expect(screen.getByText('#1000')).toBeInTheDocument();
        expect(screen.getByText('#1001')).toBeInTheDocument();
    });

    it('показывает заглушку «Заказов пока нет» при пустом списке', async () => {
        mockFetchOrders.mockResolvedValue({ orders: [], total: 0, skip: 0, limit: 25 });

        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);

        await waitFor(() => {
            expect(screen.getByText('Заказов пока нет')).toBeInTheDocument();
        });
    });

    // ─────────────────────────────────────────────────────────────────────
    // Кнопка обновления
    // ─────────────────────────────────────────────────────────────────────

    it('перезагружает данные при клике на «Обновить»', async () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);

        await waitFor(() => {
            expect(screen.getByText('Клиент 1')).toBeInTheDocument();
        });

        expect(mockFetchOrders).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByText('Обновить'));

        await waitFor(() => {
            expect(mockFetchOrders).toHaveBeenCalledTimes(2);
        });
    });

    // ─────────────────────────────────────────────────────────────────────
    // Поиск
    // ─────────────────────────────────────────────────────────────────────

    it('содержит поле поиска и кнопку «Найти»', () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);

        expect(screen.getByPlaceholderText(/Поиск по имени/i)).toBeInTheDocument();
        expect(screen.getByText('Найти')).toBeInTheDocument();
    });

    // ─────────────────────────────────────────────────────────────────────
    // Пагинация
    // ─────────────────────────────────────────────────────────────────────

    it('не показывает пагинацию если заказов меньше pageSize', async () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);

        await waitFor(() => {
            expect(screen.getByText('Клиент 1')).toBeInTheDocument();
        });

        // total=2, pageSize=25 → 1 страница → пагинация скрыта
        expect(screen.queryByText('→')).not.toBeInTheDocument();
    });

    it('показывает пагинацию при большом кол-ве заказов', async () => {
        mockFetchOrders.mockResolvedValue({
            orders: createMockOrdersResponse(25).orders,
            total: 100,
            skip: 0,
            limit: 25,
        });

        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);

        await waitFor(() => {
            expect(screen.getByText('Клиент 1')).toBeInTheDocument();
        });

        expect(screen.getByText('1 / 4')).toBeInTheDocument();
        expect(screen.getByText('→')).toBeInTheDocument();
        expect(screen.getByText('←')).toBeInTheDocument();
    });

    // ─────────────────────────────────────────────────────────────────────
    // Ошибка
    // ─────────────────────────────────────────────────────────────────────

    it('показывает сообщение об ошибке', async () => {
        mockFetchOrders.mockRejectedValue(new Error('Сервер недоступен'));

        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);

        await waitFor(() => {
            expect(screen.getByText('Сервер недоступен')).toBeInTheDocument();
        });
    });
});
