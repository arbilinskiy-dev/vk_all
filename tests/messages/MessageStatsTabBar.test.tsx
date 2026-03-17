/**
 * @file MessageStatsTabBar.test.tsx
 * @description Тесты компонента MessageStatsTabBar — панель вкладок статистики сообщений.
 * Проверяет рендер 4 табов, визуальное выделение активного и вызов onTabChange.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MessageStatsTabBar } from '../../features/messages/components/stats/MessageStatsTabBar';

// Дефолтные пропсы
const defaultProps = {
    activeTab: 'incoming' as const,
    onTabChange: vi.fn(),
};

describe('MessageStatsTabBar', () => {
    it('рендерит все 4 вкладки', () => {
        render(<MessageStatsTabBar {...defaultProps} />);

        expect(screen.getByText('Входящие')).toBeInTheDocument();
        expect(screen.getByText('Исходящие')).toBeInTheDocument();
        expect(screen.getByText('Подписки')).toBeInTheDocument();
        expect(screen.getByText('Сотрудники')).toBeInTheDocument();
    });

    it('активная вкладка (incoming) визуально выделена цветным фоном', () => {
        render(<MessageStatsTabBar {...defaultProps} activeTab="incoming" />);

        // Активный таб incoming получает bg-green-100 text-green-700 из TAB_COLOR_MAP
        const activeBtn = screen.getByText('Входящие').closest('button');
        expect(activeBtn).toHaveClass('bg-green-100');
        expect(activeBtn).toHaveClass('text-green-700');
    });

    it('неактивная вкладка НЕ имеет цветного фона', () => {
        render(<MessageStatsTabBar {...defaultProps} activeTab="incoming" />);

        const inactiveBtn = screen.getByText('Исходящие').closest('button');
        expect(inactiveBtn).toHaveClass('text-gray-500');
        expect(inactiveBtn).not.toHaveClass('bg-orange-100');
    });

    it('клик по "Исходящие" вызывает onTabChange("outgoing")', () => {
        const onTabChange = vi.fn();
        render(<MessageStatsTabBar {...defaultProps} onTabChange={onTabChange} />);

        fireEvent.click(screen.getByText('Исходящие'));
        expect(onTabChange).toHaveBeenCalledWith('outgoing');
    });

    it('клик по "Подписки" вызывает onTabChange("subscriptions")', () => {
        const onTabChange = vi.fn();
        render(<MessageStatsTabBar {...defaultProps} onTabChange={onTabChange} />);

        fireEvent.click(screen.getByText('Подписки'));
        expect(onTabChange).toHaveBeenCalledWith('subscriptions');
    });
});
