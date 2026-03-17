/**
 * Тесты компонента BarRaceToggle.
 * Проверяем: рендер баров, переключение режимов, отображение значений.
 */

import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BarRaceToggle } from '../../features/statistics/dlvry/BarRaceToggle';
import type { SourceData } from '../../features/statistics/dlvry/sourcesTypes';

// ─── Фикстура ────────────────────────────────────────────────────────────────

function createSorted(): SourceData[] {
    return [
        {
            key: 'vkapp', label: 'VK Mini App', icon: <span>VK</span>,
            color: '#4C75A3', numberClass: '', iconClass: '', iconBgClass: '',
            hoverBorderClass: '', barClass: '', badgeBg: '', badgeText: '',
            dotClass: 'bg-blue-500',
            orders: 100, revenue: 50000, avgCheck: 500,
        },
        {
            key: 'site', label: 'Сайт', icon: <span>WEB</span>,
            color: '#6366F1', numberClass: '', iconClass: '', iconBgClass: '',
            hoverBorderClass: '', barClass: '', badgeBg: '', badgeText: '',
            dotClass: 'bg-indigo-500',
            orders: 60, revenue: 30000, avgCheck: 500,
        },
        {
            key: 'ios', label: 'iOS', icon: <span>IOS</span>,
            color: '#374151', numberClass: '', iconClass: '', iconBgClass: '',
            hoverBorderClass: '', barClass: '', badgeBg: '', badgeText: '',
            dotClass: 'bg-gray-600',
            orders: 30, revenue: 15000, avgCheck: 500,
        },
        {
            key: 'android', label: 'Android', icon: <span>AND</span>,
            color: '#16A34A', numberClass: '', iconClass: '', iconBgClass: '',
            hoverBorderClass: '', barClass: '', badgeBg: '', badgeText: '',
            dotClass: 'bg-green-500',
            orders: 10, revenue: 5000, avgCheck: 500,
        },
    ];
}

describe('BarRaceToggle', () => {
    const sorted = createSorted();
    const totalOrders = 200;
    const totalRevenue = 100000;
    const maxOrders = 100;
    const maxRevenue = 50000;

    it('рендерит все 4 источника', () => {
        render(
            <BarRaceToggle
                sorted={sorted}
                totalOrders={totalOrders}
                totalRevenue={totalRevenue}
                maxOrders={maxOrders}
                maxRevenue={maxRevenue}
            />
        );
        expect(screen.getByText('VK Mini App')).toBeInTheDocument();
        expect(screen.getByText('Сайт')).toBeInTheDocument();
        expect(screen.getByText('iOS')).toBeInTheDocument();
        expect(screen.getByText('Android')).toBeInTheDocument();
    });

    it('по умолчанию режим «Выручка»', () => {
        render(
            <BarRaceToggle
                sorted={sorted}
                totalOrders={totalOrders}
                totalRevenue={totalRevenue}
                maxOrders={maxOrders}
                maxRevenue={maxRevenue}
            />
        );
        // Кнопка «Выручка» активна (белый фон)
        const revenueBtn = screen.getByText('Выручка');
        expect(revenueBtn.className).toContain('bg-white');

        // Отображается выручка в рублях для первого источника
        expect(screen.getByText(/50 000/)).toBeInTheDocument();
    });

    it('переключается на режим «Заказы»', () => {
        render(
            <BarRaceToggle
                sorted={sorted}
                totalOrders={totalOrders}
                totalRevenue={totalRevenue}
                maxOrders={maxOrders}
                maxRevenue={maxRevenue}
            />
        );
        const ordersBtn = screen.getByText('Заказы');
        fireEvent.click(ordersBtn);

        // Кнопка «Заказы» стала активной
        expect(ordersBtn.className).toContain('bg-white');

        // Отображаются числа заказов (100, 60, 30, 10)
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('60')).toBeInTheDocument();
    });

    it('отображает проценты', () => {
        render(
            <BarRaceToggle
                sorted={sorted}
                totalOrders={totalOrders}
                totalRevenue={totalRevenue}
                maxOrders={maxOrders}
                maxRevenue={maxRevenue}
            />
        );
        // 50000/100000 = 50.0%
        expect(screen.getByText('50.0%')).toBeInTheDocument();
        // 30000/100000 = 30.0%
        expect(screen.getByText('30.0%')).toBeInTheDocument();
    });

    it('переключение туда-обратно корректно', () => {
        render(
            <BarRaceToggle
                sorted={sorted}
                totalOrders={totalOrders}
                totalRevenue={totalRevenue}
                maxOrders={maxOrders}
                maxRevenue={maxRevenue}
            />
        );
        const ordersBtn = screen.getByText('Заказы');
        const revenueBtn = screen.getByText('Выручка');

        fireEvent.click(ordersBtn);
        expect(ordersBtn.className).toContain('bg-white');

        fireEvent.click(revenueBtn);
        expect(revenueBtn.className).toContain('bg-white');
        // Снова выручка
        expect(screen.getByText(/50 000/)).toBeInTheDocument();
    });
});
