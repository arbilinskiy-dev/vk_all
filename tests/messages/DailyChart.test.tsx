/**
 * Тесты: DailyChart — SVG-линейный график активности по дням.
 * Проверяем: пустые данные, рендер SVG, линии, легенда, оси.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DailyChart } from '../../features/messages/components/stats/DailyChart';
import { AmDailyPoint } from '../../services/api/am_analysis.api';

const mockData: AmDailyPoint[] = [
    { date: '2026-02-28', total: 30, dialogs_read: 15, unread_dialogs_read: 8, messages_sent: 10, labels: 3, templates: 2, unique_users: 3 },
    { date: '2026-03-01', total: 45, dialogs_read: 25, unread_dialogs_read: 14, messages_sent: 12, labels: 5, templates: 3, unique_users: 4 },
    { date: '2026-03-02', total: 20, dialogs_read: 10, unread_dialogs_read: 5, messages_sent: 8, labels: 2, templates: 1, unique_users: 2 },
];

describe('DailyChart', () => {

    it('отображает «Нет данных за период» при пустом массиве', () => {
        render(<DailyChart data={[]} />);
        expect(screen.getByText('Нет данных за период')).toBeInTheDocument();
    });

    it('рендерит SVG при наличии данных', () => {
        const { container } = render(<DailyChart data={mockData} />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('рендерит 4 polyline (линии графика)', () => {
        const { container } = render(<DailyChart data={mockData} />);
        const polylines = container.querySelectorAll('polyline');
        expect(polylines.length).toBe(4);
    });

    it('линии имеют правильные цвета', () => {
        const { container } = render(<DailyChart data={mockData} />);
        const polylines = container.querySelectorAll('polyline');
        const colors = Array.from(polylines).map(p => p.getAttribute('stroke'));
        expect(colors).toContain('#6366f1'); // total — indigo
        expect(colors).toContain('#10b981'); // dialogs_read — emerald
        expect(colors).toContain('#3b82f6'); // unread_dialogs_read — blue
        expect(colors).toContain('#f59e0b'); // messages_sent — amber
    });

    it('отображает легенду с 4 элементами', () => {
        render(<DailyChart data={mockData} />);
        expect(screen.getByText('Всего')).toBeInTheDocument();
        expect(screen.getByText('Входы')).toBeInTheDocument();
        expect(screen.getByText('Прочтения')).toBeInTheDocument();
        expect(screen.getByText('Отправлено')).toBeInTheDocument();
    });

    it('рендерит сетку (5 горизонтальных линий)', () => {
        const { container } = render(<DailyChart data={mockData} />);
        const lines = container.querySelectorAll('line');
        expect(lines.length).toBe(5);
    });

    it('рендерит прямоугольники легенды', () => {
        const { container } = render(<DailyChart data={mockData} />);
        const rects = container.querySelectorAll('rect');
        expect(rects.length).toBe(4);
    });

    it('обрабатывает массив из одной точки', () => {
        const single: AmDailyPoint[] = [
            { date: '2026-03-01', total: 10, dialogs_read: 5, unread_dialogs_read: 3, messages_sent: 2, labels: 1, templates: 0, unique_users: 1 },
        ];
        const { container } = render(<DailyChart data={single} />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
        // Polylines всё равно рендерятся
        const polylines = container.querySelectorAll('polyline');
        expect(polylines.length).toBe(4);
    });
});
