/**
 * Тесты SourcesInfographic (хаб-контейнер).
 * Проверяем: скелетон, null/пустые данные, рендер карточек, сортировку, интеграцию подкомпонентов.
 */

import React from 'react';
import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SourcesInfographic } from '../../features/statistics/dlvry/SourcesInfographic';
import type { SourceTotals } from '../../features/statistics/dlvry/sourcesTypes';

// ─── Фикстуры ────────────────────────────────────────────────────────────────

function createTotals(overrides: Partial<SourceTotals> = {}): SourceTotals {
    return {
        source_site: 40,
        sum_source_site: 20000,
        source_vkapp: 100,
        sum_source_vkapp: 50000,
        source_ios: 30,
        sum_source_ios: 15000,
        source_android: 10,
        sum_source_android: 5000,
        orders: 180,
        revenue: 90000,
        ...overrides,
    };
}

// ─── Тесты ───────────────────────────────────────────────────────────────────

describe('SourcesInfographic', () => {
    it('показывает скелетон при isLoading=true и totals=null', () => {
        const { container } = render(
            <SourcesInfographic totals={null} isLoading={true} />
        );
        // 4 скелетон-карточки с анимацией
        const pulseElements = container.querySelectorAll('.animate-pulse');
        expect(pulseElements.length).toBe(4);
    });

    it('возвращает null при totals=null и isLoading=false', () => {
        const { container } = render(
            <SourcesInfographic totals={null} isLoading={false} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('возвращает null при нулевых заказах', () => {
        const totals = createTotals({
            source_site: 0,
            source_vkapp: 0,
            source_ios: 0,
            source_android: 0,
        });
        const { container } = render(
            <SourcesInfographic totals={totals} isLoading={false} />
        );
        expect(container.firstChild).toBeNull();
    });

    it('рендерит сводную карточку с заголовком «Источники заказов»', () => {
        render(<SourcesInfographic totals={createTotals()} isLoading={false} />);
        expect(screen.getByText('Источники заказов')).toBeInTheDocument();
    });

    it('отображает общую выручку и заказы', () => {
        render(<SourcesInfographic totals={createTotals()} isLoading={false} />);
        // 50000+20000+15000+5000 = 90000 → 90 тыс. ₽
        expect(screen.getByText(/90 тыс/)).toBeInTheDocument();
        // 100+40+30+10 = 180 заказов
        expect(screen.getByText(/180 заказов/)).toBeInTheDocument();
    });

    it('рендерит 4 карточки источников', () => {
        render(<SourcesInfographic totals={createTotals()} isLoading={false} />);
        // Каждый лейбл встречается минимум 2 раза: в BarRace + в карточке
        expect(screen.getAllByText('VK Mini App').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('Сайт').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('iOS').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('Android').length).toBeGreaterThanOrEqual(2);
    });

    it('карточки отсортированы по заказам по убыванию (VK > Сайт > iOS > Android)', () => {
        const { container } = render(
            <SourcesInfographic totals={createTotals()} isLoading={false} />
        );
        // Находим все карточки
        const labels = screen.getAllByText(/VK Mini App|Сайт|iOS|Android/);
        // VK Mini App — первый (100 заказов), Android — последний (10 заказов)
        const texts = labels.map(el => el.textContent);
        const vkIdx = texts.indexOf('VK Mini App');
        const androidIdx = texts.indexOf('Android');
        expect(vkIdx).toBeLessThan(androidIdx);
    });

    it('отображает BarRaceToggle (кнопки «Выручка» и «Заказы»)', () => {
        render(<SourcesInfographic totals={createTotals()} isLoading={false} />);
        expect(screen.getByText('Выручка')).toBeInTheDocument();
        expect(screen.getByText('Заказы')).toBeInTheDocument();
    });

    it('при isLoading=true но totals есть — показывает данные, а не скелетон', () => {
        render(<SourcesInfographic totals={createTotals()} isLoading={true} />);
        expect(screen.getByText('Источники заказов')).toBeInTheDocument();
    });

    it('карточки источников показывают «от выручки»', () => {
        render(<SourcesInfographic totals={createTotals()} isLoading={false} />);
        const labels = screen.getAllByText('от выручки');
        expect(labels.length).toBe(4);
    });

    it('карточки показывают «Заказов» и «Ср. чек»', () => {
        render(<SourcesInfographic totals={createTotals()} isLoading={false} />);
        const ordersLabels = screen.getAllByText('Заказов');
        expect(ordersLabels.length).toBe(4);
        const avgCheckLabels = screen.getAllByText('Ср. чек');
        expect(avgCheckLabels.length).toBe(4);
    });
});
