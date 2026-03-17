/**
 * Тесты: GroupPieChart — SVG-круговая диаграмма по группам действий.
 * Проверяем: рендер секторов, легенда, пустые данные, центральный круг.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GroupPieChart } from '../../features/messages/components/stats/GroupPieChart';
import { AmGroupDistribution } from '../../services/api/am_analysis.api';

const mockData: AmGroupDistribution[] = [
    { group: 'dialogs', label: 'Работа с диалогами', count: 90 },
    { group: 'messages', label: 'Отправка сообщений', count: 30 },
    { group: 'labels', label: 'Метки клиентов', count: 25 },
];

describe('GroupPieChart', () => {

    it('отображает «Нет данных» при пустом массиве', () => {
        render(<GroupPieChart data={[]} />);
        expect(screen.getByText('Нет данных')).toBeInTheDocument();
    });

    it('отображает «Нет данных» при всех count=0', () => {
        const zeroData: AmGroupDistribution[] = [
            { group: 'dialogs', label: 'Диалоги', count: 0 },
            { group: 'messages', label: 'Сообщения', count: 0 },
        ];
        render(<GroupPieChart data={zeroData} />);
        expect(screen.getByText('Нет данных')).toBeInTheDocument();
    });

    it('рендерит SVG при наличии данных', () => {
        const { container } = render(<GroupPieChart data={mockData} />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('рендерит сектора (path) по количеству групп', () => {
        const { container } = render(<GroupPieChart data={mockData} />);
        const paths = container.querySelectorAll('svg path');
        expect(paths.length).toBe(mockData.length);
    });

    it('отображает центральный круг с суммой', () => {
        render(<GroupPieChart data={mockData} />);
        const total = mockData.reduce((s, d) => s + d.count, 0);
        expect(screen.getByText(String(total))).toBeInTheDocument();
        expect(screen.getByText('действий')).toBeInTheDocument();
    });

    it('отображает лейблы групп в легенде', () => {
        render(<GroupPieChart data={mockData} />);
        expect(screen.getByText('Работа с диалогами')).toBeInTheDocument();
        expect(screen.getByText('Отправка сообщений')).toBeInTheDocument();
        expect(screen.getByText('Метки клиентов')).toBeInTheDocument();
    });

    it('отображает значения count в легенде', () => {
        render(<GroupPieChart data={mockData} />);
        expect(screen.getByText('90')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('отображает проценты в легенде', () => {
        render(<GroupPieChart data={mockData} />);
        // total = 145. dialogs: 62%, messages: 21%, labels: 17%
        expect(screen.getByText('62%')).toBeInTheDocument();
        expect(screen.getByText('21%')).toBeInTheDocument();
        expect(screen.getByText('17%')).toBeInTheDocument();
    });

    it('применяет fallback-цвет для неизвестной группы', () => {
        const unknownData: AmGroupDistribution[] = [
            { group: 'unknown_group', label: 'Неизвестно', count: 10 },
        ];
        const { container } = render(<GroupPieChart data={unknownData} />);
        const path = container.querySelector('svg path');
        expect(path).toHaveAttribute('fill', '#9ca3af');
    });

    it('обрабатывает одну группу (100%)', () => {
        const singleData: AmGroupDistribution[] = [
            { group: 'dialogs', label: 'Диалоги', count: 50 },
        ];
        render(<GroupPieChart data={singleData} />);
        expect(screen.getByText('100%')).toBeInTheDocument();
        // "50" отображается и в центре SVG, и в легенде — проверяем оба
        expect(screen.getAllByText('50')).toHaveLength(2);
    });
});
