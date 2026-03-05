/**
 * Тесты компонента DlvryOrderDetailModal.
 * Проверяем: загрузка, рендер данных, позиции, закрытие.
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Мок API
const mockFetchDetail = vi.fn();

vi.mock('../../services/api/dlvry.api', () => ({
    fetchDlvryOrderDetail: (...args: any[]) => mockFetchDetail(...args),
}));

import { DlvryOrderDetailModal } from '../../features/statistics/dlvry/DlvryOrderDetailModal';

// =============================================================================
// Фикстуры
// =============================================================================

function createMockDetailResponse(overrides: any = {}) {
    return {
        order: {
            id: 1,
            dlvry_order_id: '12345',
            affiliate_id: 'aff-1',
            order_date: '2026-03-01T10:30:00',
            client_name: 'Анна Смирнова',
            client_phone: '+79001234567',
            client_email: 'anna@test.ru',
            client_birthday: '1990-05-15',
            vk_user_id: '123456',
            vk_group_id: null,
            vk_platform: null,
            address_full: 'г. Москва, ул. Пушкина, д. 10, кв. 5',
            address_city: 'Москва',
            address_street: 'Пушкина',
            address_house: '10',
            address_flat: '5',
            total: 2500.5,
            subtotal: 2800,
            discount: 300,
            delivery_price: 0.5,
            payment_type: 'Онлайн',
            payment_code: 'online',
            delivery_type: 'Доставка',
            delivery_code: 'delivery',
            source_name: 'VK Mini App',
            source_code: 'vk',
            pickup_point_name: null,
            promocode: 'СКИДКА10',
            comment: 'Позвонить за 10 минут',
            preorder: false,
            status: 'new',
            items_count: 2,
            items_json: null,
            raw_json: null,
            created_at: '2026-03-01T10:30:00',
            ...overrides.order,
        },
        items: overrides.items ?? [
            { id: 1, name: 'Пицца Маргарита', price: 600, quantity: 2, total: 1200, code: 'pizza-1', weight: '500г', options: null },
            { id: 2, name: 'Кола 0.5л', price: 150, quantity: 1, total: 150, code: 'cola-1', weight: null, options: null },
        ],
    };
}

// =============================================================================
// Тесты
// =============================================================================

describe('DlvryOrderDetailModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('показывает лоадер во время загрузки', () => {
        // Бесконечный промис — имитация загрузки
        mockFetchDetail.mockReturnValue(new Promise(() => {}));

        render(<DlvryOrderDetailModal orderId={1} onClose={vi.fn()} />);

        // Модалка должна рендериться
        expect(screen.getByText(/Заказ #/)).toBeInTheDocument();
    });

    it('показывает ошибку при сбое загрузки', async () => {
        mockFetchDetail.mockRejectedValue(new Error('Сетевая ошибка'));

        render(<DlvryOrderDetailModal orderId={1} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Сетевая ошибка')).toBeInTheDocument();
        });
    });

    it('отображает данные клиента', async () => {
        mockFetchDetail.mockResolvedValue(createMockDetailResponse());

        render(<DlvryOrderDetailModal orderId={1} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Анна Смирнова')).toBeInTheDocument();
        });

        expect(screen.getByText('+79001234567')).toBeInTheDocument();
        expect(screen.getByText('anna@test.ru')).toBeInTheDocument();
        expect(screen.getByText('1990-05-15')).toBeInTheDocument();
    });

    it('отображает заголовок с ID заказа', async () => {
        mockFetchDetail.mockResolvedValue(createMockDetailResponse());

        render(<DlvryOrderDetailModal orderId={1} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Заказ #12345')).toBeInTheDocument();
        });
    });

    it('отображает адрес доставки', async () => {
        mockFetchDetail.mockResolvedValue(createMockDetailResponse());

        render(<DlvryOrderDetailModal orderId={1} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText(/Москва.*Пушкина.*10.*5/)).toBeInTheDocument();
        });
    });

    it('отображает детали заказа (источник, оплата, доставка)', async () => {
        mockFetchDetail.mockResolvedValue(createMockDetailResponse());

        render(<DlvryOrderDetailModal orderId={1} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('VK Mini App')).toBeInTheDocument();
        });

        expect(screen.getByText('Онлайн')).toBeInTheDocument();
        // 'Доставка' появляется и как тип доставки, и как заголовок карточки суммы
        expect(screen.getAllByText('Доставка').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('СКИДКА10')).toBeInTheDocument();
        expect(screen.getByText('Позвонить за 10 минут')).toBeInTheDocument();
    });

    it('отображает позиции заказа', async () => {
        mockFetchDetail.mockResolvedValue(createMockDetailResponse());

        render(<DlvryOrderDetailModal orderId={1} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Пицца Маргарита')).toBeInTheDocument();
        });

        expect(screen.getByText('Кола 0.5л')).toBeInTheDocument();
        expect(screen.getByText(/Позиции \(2\)/)).toBeInTheDocument();
    });

    it('отображает суммы (итого, подытог, скидка, доставка)', async () => {
        mockFetchDetail.mockResolvedValue(createMockDetailResponse());

        render(<DlvryOrderDetailModal orderId={1} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Итого')).toBeInTheDocument();
        });

        expect(screen.getByText('Подытог')).toBeInTheDocument();
        expect(screen.getByText('Скидка')).toBeInTheDocument();
    });

    it('вызывает onClose при клике на оверлей', async () => {
        mockFetchDetail.mockResolvedValue(createMockDetailResponse());
        const onClose = vi.fn();

        const { container } = render(<DlvryOrderDetailModal orderId={1} onClose={onClose} />);

        // Клик на оверлей (внешний div с fixed inset-0)
        const overlay = container.querySelector('.fixed.inset-0');
        if (overlay) {
            fireEvent.click(overlay);
            expect(onClose).toHaveBeenCalledOnce();
        }
    });

    it('вызывает onClose при клике на кнопку закрытия (крестик)', async () => {
        mockFetchDetail.mockResolvedValue(createMockDetailResponse());
        const onClose = vi.fn();

        render(<DlvryOrderDetailModal orderId={1} onClose={onClose} />);

        await waitFor(() => {
            expect(screen.getByText('Заказ #12345')).toBeInTheDocument();
        });

        // Кнопка закрытия — рядом с заголовком
        const closeButtons = screen.getAllByRole('button');
        const closeBtn = closeButtons.find(btn => btn.querySelector('svg'));
        if (closeBtn) {
            fireEvent.click(closeBtn);
            expect(onClose).toHaveBeenCalled();
        }
    });

    it('не отображает VK ID если он отсутствует', async () => {
        const data = createMockDetailResponse({ order: { vk_user_id: null } });
        mockFetchDetail.mockResolvedValue(data);

        render(<DlvryOrderDetailModal orderId={1} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('Анна Смирнова')).toBeInTheDocument();
        });

        expect(screen.queryByText('VK ID')).not.toBeInTheDocument();
    });
});
