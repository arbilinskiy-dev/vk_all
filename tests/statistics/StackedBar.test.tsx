/**
 * Тесты компонента StackedBar.
 * Проверяем: пустые данные, один сегмент, несколько сегментов, пропорции.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StackedBar } from '../../features/statistics/dlvry/StackedBar';

describe('StackedBar', () => {
    it('рендерит пустой бар при нулевых значениях', () => {
        const { container } = render(
            <StackedBar segments={[{ value: 0, color: '#f00', label: 'A' }]} />
        );
        // Должен быть один div с округлённым фоном (пустышка)
        const bar = container.firstChild as HTMLElement;
        expect(bar).toBeTruthy();
        expect(bar.children.length).toBe(0); // нет сегментов внутри
    });

    it('рендерит пустой бар при пустом массиве сегментов', () => {
        const { container } = render(<StackedBar segments={[]} />);
        const bar = container.firstChild as HTMLElement;
        expect(bar).toBeTruthy();
    });

    it('рендерит один сегмент на 100%', () => {
        const { container } = render(
            <StackedBar segments={[{ value: 100, color: '#ff0000', label: 'Единственный' }]} />
        );
        const segments = (container.firstChild as HTMLElement).children;
        expect(segments.length).toBe(1);
        const seg = segments[0] as HTMLElement;
        expect(seg.style.width).toBe('100%');
        expect(seg.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('рендерит несколько сегментов с правильными пропорциями', () => {
        const { container } = render(
            <StackedBar segments={[
                { value: 50, color: '#f00', label: 'A' },
                { value: 30, color: '#0f0', label: 'B' },
                { value: 20, color: '#00f', label: 'C' },
            ]} />
        );
        const segments = (container.firstChild as HTMLElement).children;
        expect(segments.length).toBe(3);
        expect((segments[0] as HTMLElement).style.width).toBe('50%');
        expect((segments[1] as HTMLElement).style.width).toBe('30%');
        expect((segments[2] as HTMLElement).style.width).toBe('20%');
    });

    it('фильтрует нулевые сегменты', () => {
        const { container } = render(
            <StackedBar segments={[
                { value: 100, color: '#f00', label: 'A' },
                { value: 0, color: '#0f0', label: 'B' },
            ]} />
        );
        const segments = (container.firstChild as HTMLElement).children;
        expect(segments.length).toBe(1);
    });

    it('title содержит процент', () => {
        const { container } = render(
            <StackedBar segments={[
                { value: 75, color: '#f00', label: 'Красный' },
                { value: 25, color: '#00f', label: 'Синий' },
            ]} />
        );
        const seg = (container.firstChild as HTMLElement).children[0] as HTMLElement;
        expect(seg.title).toContain('75.0%');
        expect(seg.title).toContain('Красный');
    });

    it('принимает кастомную высоту', () => {
        const { container } = render(
            <StackedBar segments={[{ value: 1, color: '#f00', label: 'A' }]} height="h-6" />
        );
        const bar = container.firstChild as HTMLElement;
        expect(bar.className).toContain('h-6');
    });
});
