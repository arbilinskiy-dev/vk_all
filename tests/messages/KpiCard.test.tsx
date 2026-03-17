/**
 * Тесты: KpiCard — карточка KPI-метрики.
 * Проверяем: рендер, значения, подпись, иконка, delay.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KpiCard } from '../../features/messages/components/stats/KpiCard';

describe('KpiCard', () => {

    const defaultProps = {
        title: 'Всего действий',
        value: 150,
        subtitle: 'за 30 дн.',
        icon: <span data-testid="icon">⚡</span>,
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-600',
    };

    it('рендерит заголовок', () => {
        render(<KpiCard {...defaultProps} />);
        expect(screen.getByText('Всего действий')).toBeInTheDocument();
    });

    it('рендерит значение', () => {
        render(<KpiCard {...defaultProps} />);
        expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('рендерит подпись (subtitle)', () => {
        render(<KpiCard {...defaultProps} />);
        expect(screen.getByText('за 30 дн.')).toBeInTheDocument();
    });

    it('не рендерит подпись если subtitle не передан', () => {
        const { container } = render(<KpiCard {...defaultProps} subtitle={undefined} />);
        expect(container.querySelector('.text-xs.text-gray-400')).toBeNull();
    });

    it('рендерит иконку', () => {
        render(<KpiCard {...defaultProps} />);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('применяет bgColor к фону иконки', () => {
        const { container } = render(<KpiCard {...defaultProps} />);
        const iconWrapper = container.querySelector('.bg-indigo-50');
        expect(iconWrapper).toBeInTheDocument();
    });

    it('применяет textColor к контейнеру иконки', () => {
        const { container } = render(<KpiCard {...defaultProps} />);
        const textSpan = container.querySelector('.text-indigo-600');
        expect(textSpan).toBeInTheDocument();
    });

    it('устанавливает animationDelay из delay', () => {
        const { container } = render(<KpiCard {...defaultProps} delay={200} />);
        const card = container.firstElementChild as HTMLElement;
        expect(card.style.animationDelay).toBe('200ms');
    });

    it('по умолчанию delay=0', () => {
        const { container } = render(<KpiCard {...defaultProps} />);
        const card = container.firstElementChild as HTMLElement;
        expect(card.style.animationDelay).toBe('0ms');
    });

    it('рендерит JSX в value', () => {
        render(<KpiCard {...defaultProps} value={<span data-testid="custom-value">999</span>} />);
        expect(screen.getByTestId('custom-value')).toBeInTheDocument();
        expect(screen.getByText('999')).toBeInTheDocument();
    });
});
