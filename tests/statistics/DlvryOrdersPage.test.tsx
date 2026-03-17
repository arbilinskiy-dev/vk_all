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
const mockFetchAffiliates = vi.fn();

vi.mock('../../services/api/dlvry.api', () => ({
    fetchDlvryOrders: (...args: any[]) => mockFetchOrders(...args),
    fetchDlvryOrdersStats: (...args: any[]) => mockFetchStats(...args),
    fetchDlvryOrderDetail: (...args: any[]) => mockFetchDetail(...args),
}));

vi.mock('../../services/api/dlvryAffiliates.api', () => ({
    fetchDlvryAffiliates: (...args: any[]) => mockFetchAffiliates(...args),
}));

// Мок SalesTabContent — изолируем от побочных эффектов
vi.mock('../../features/statistics/dlvry/SalesTabContent', () => ({
    SalesTabContent: () => <div data-testid="sales-tab-content">Sales</div>,
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
        // Расширенные поля (переключаемые колонки)
        cost: 900 + i * 50,
        discount: 100,
        delivery_price: 200,
        subtotal: 1400 + i * 100,
        payment_bonus: 50,
        markup: 30,
        vk_platform: 'desktop_web',
        vk_user_id: String(100000 + i),
        address_city: 'Белгород',
        persons: 2,
        items_total_qty: 5,
        promocode: 'PROMO10',
        comment: 'Без лука',
        is_preorder: false,
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

/** Переключиться на таб «Заказы» и дождаться загрузки */
async function switchToOrdersTab() {
    // Дождаться, пока загрузится affiliates (убирает isLoadingAffiliates) и табы появятся
    await waitFor(() => {
        expect(screen.getByText('Заказы')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Заказы'));
}

describe('DlvryOrdersPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        mockFetchAffiliates.mockResolvedValue([]);
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

    it('показывает заглушку если dlvry_affiliate_id не настроен', async () => {
        const project = createMockProject({ dlvry_affiliate_id: undefined });
        render(<DlvryOrdersPage project={project} />);

        await waitFor(() => {
            expect(screen.getByText('DLVRY не настроен')).toBeInTheDocument();
        });
    });

    // ─────────────────────────────────────────────────────────────────────
    // Основной рендер
    // ─────────────────────────────────────────────────────────────────────

    it('показывает заголовок и название проекта', async () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);

        await waitFor(() => {
            expect(screen.getByText('DLVRY')).toBeInTheDocument();
        });
        expect(screen.getByText(/Тестовый проект/)).toBeInTheDocument();
        expect(screen.getByText(/aff-100/)).toBeInTheDocument();
    });

    it('отображает карточки статистики после загрузки', async () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);
        await switchToOrdersTab();

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
        await switchToOrdersTab();

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
        await switchToOrdersTab();

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
        await switchToOrdersTab();

        await waitFor(() => {
            expect(screen.getByText('Клиент 1')).toBeInTheDocument();
        });

        const callsBefore = mockFetchOrders.mock.calls.length;

        fireEvent.click(screen.getByText('Обновить'));

        await waitFor(() => {
            expect(mockFetchOrders.mock.calls.length).toBeGreaterThan(callsBefore);
        });
    });

    // ─────────────────────────────────────────────────────────────────────
    // Поиск
    // ─────────────────────────────────────────────────────────────────────

    it('содержит поле поиска и кнопку «Найти»', async () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);
        await switchToOrdersTab();

        expect(screen.getByPlaceholderText(/Поиск по имени/i)).toBeInTheDocument();
        expect(screen.getByText('Найти')).toBeInTheDocument();
    });

    // ─────────────────────────────────────────────────────────────────────
    // Пагинация
    // ─────────────────────────────────────────────────────────────────────

    it('не показывает пагинацию если заказов меньше pageSize', async () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);
        await switchToOrdersTab();

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
        await switchToOrdersTab();

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
        await switchToOrdersTab();

        await waitFor(() => {
            expect(screen.getByText('Сервер недоступен')).toBeInTheDocument();
        });
    });

    // ─────────────────────────────────────────────────────────────────────
    // Переключаемые группы колонок
    // ─────────────────────────────────────────────────────────────────────

    it('отображает кнопки переключения групп колонок', async () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);
        await switchToOrdersTab();

        await waitFor(() => {
            expect(screen.getByText('Клиент 1')).toBeInTheDocument();
        });

        expect(screen.getByText('Столбцы:')).toBeInTheDocument();
        expect(screen.getByText(/Финансы/)).toBeInTheDocument();
        expect(screen.getByText(/Клиент \/ VK/)).toBeInTheDocument();
        expect(screen.getByText(/Дополнительно/)).toBeInTheDocument();
    });

    it('финансовые колонки скрыты по умолчанию', async () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);
        await switchToOrdersTab();

        await waitFor(() => {
            expect(screen.getByText('Клиент 1')).toBeInTheDocument();
        });

        // Заголовки финансовых колонок НЕ видны
        expect(screen.queryByText('Себест.')).not.toBeInTheDocument();
        expect(screen.queryByText('Маржа')).not.toBeInTheDocument();
        expect(screen.queryByText('Скидка')).not.toBeInTheDocument();
        expect(screen.queryByText('Бонусы')).not.toBeInTheDocument();
        expect(screen.queryByText('Наценка')).not.toBeInTheDocument();
    });

    it('показывает финансовые колонки после клика на "Финансы"', async () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);
        await switchToOrdersTab();

        await waitFor(() => {
            expect(screen.getByText('Клиент 1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Финансы/));

        expect(screen.getByText('Себест.')).toBeInTheDocument();
        expect(screen.getByText('Маржа')).toBeInTheDocument();
        expect(screen.getByText('Скидка')).toBeInTheDocument();
        expect(screen.getByText('Бонусы')).toBeInTheDocument();
        expect(screen.getByText('Наценка')).toBeInTheDocument();
    });

    it('показывает клиентские колонки после клика на "Клиент / VK"', async () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);
        await switchToOrdersTab();

        await waitFor(() => {
            expect(screen.getByText('Клиент 1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Клиент \/ VK/));

        expect(screen.getByText('VK платф.')).toBeInTheDocument();
        expect(screen.getByText('VK ID')).toBeInTheDocument();
        expect(screen.getByText('Город')).toBeInTheDocument();
    });

    it('показывает доп. колонки после клика на "Дополнительно"', async () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);
        await switchToOrdersTab();

        await waitFor(() => {
            expect(screen.getByText('Клиент 1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Дополнительно/));

        expect(screen.getByText('Персоны')).toBeInTheDocument();
        expect(screen.getByText('Ед.')).toBeInTheDocument();
        expect(screen.getByText('Промокод')).toBeInTheDocument();
        expect(screen.getByText('Коммент.')).toBeInTheDocument();
    });

    it('скрывает колонки при повторном клике', async () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);
        await switchToOrdersTab();

        await waitFor(() => {
            expect(screen.getByText('Клиент 1')).toBeInTheDocument();
        });

        // Включить
        fireEvent.click(screen.getByText(/Финансы/));
        expect(screen.getByText('Себест.')).toBeInTheDocument();

        // Выключить
        fireEvent.click(screen.getByText(/Финансы/));
        expect(screen.queryByText('Себест.')).not.toBeInTheDocument();
    });

    it('сохраняет выбор колонок в localStorage', async () => {
        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);
        await switchToOrdersTab();

        await waitFor(() => {
            expect(screen.getByText('Клиент 1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/Финансы/));

        const stored = localStorage.getItem('dlvry_orders_col_groups');
        expect(stored).toBeTruthy();
        const parsed = JSON.parse(stored!);
        expect(parsed).toContain('finance');
    });

    it('восстанавливает выбор колонок из localStorage', async () => {
        localStorage.setItem('dlvry_orders_col_groups', JSON.stringify(['client']));

        const project = createMockProject();
        render(<DlvryOrdersPage project={project} />);
        await switchToOrdersTab();

        await waitFor(() => {
            expect(screen.getByText('Клиент 1')).toBeInTheDocument();
        });

        // Клиентские колонки видны (восстановлены из localStorage)
        expect(screen.getByText('VK платф.')).toBeInTheDocument();
        expect(screen.getByText('Город')).toBeInTheDocument();

        // Финансовые — скрыты
        expect(screen.queryByText('Себест.')).not.toBeInTheDocument();
    });
});
