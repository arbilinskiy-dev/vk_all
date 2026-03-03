/**
 * Тесты компонента SummaryCard — сводка результата теста.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCard } from '../../features/sandbox/components/tests/test2-stories-data/SummaryCard';

// ─── Фикстуры ──────────────────────────────────────────

const fullSummary: Record<string, any> = {
    stories_count: 5,
    total_views: 120,
    owner_id: -123456,
    has_stories: true,
};

const summaryWithNull: Record<string, any> = {
    stories_count: null,
    status: 'ok',
};

const summaryWithObject: Record<string, any> = {
    nested: { key: 'value', deep: 123 },
    simple: 'text',
};

// ─── Тесты ──────────────────────────────────────────────

describe('SummaryCard', () => {
    describe('рендер с данными', () => {
        it('отображает метку токена', () => {
            render(<SummaryCard summary={fullSummary} tokenType="user" />);
            expect(screen.getByText(/User \(админ\)/)).toBeInTheDocument();
        });

        it('отображает текст "Извлечённые данные"', () => {
            render(<SummaryCard summary={fullSummary} tokenType="user" />);
            expect(screen.getByText('Извлечённые данные')).toBeInTheDocument();
        });

        it('отображает ключи из summary', () => {
            render(<SummaryCard summary={fullSummary} tokenType="user" />);
            expect(screen.getByText('stories_count:')).toBeInTheDocument();
            expect(screen.getByText('total_views:')).toBeInTheDocument();
            expect(screen.getByText('owner_id:')).toBeInTheDocument();
            expect(screen.getByText('has_stories:')).toBeInTheDocument();
        });

        it('отображает значения из summary', () => {
            render(<SummaryCard summary={fullSummary} tokenType="user" />);
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('120')).toBeInTheDocument();
            expect(screen.getByText('-123456')).toBeInTheDocument();
            expect(screen.getByText('true')).toBeInTheDocument();
        });
    });

    describe('null summary', () => {
        it('возвращает null, если summary=null', () => {
            const { container } = render(<SummaryCard summary={null} tokenType="user" />);
            expect(container.innerHTML).toBe('');
        });
    });

    describe('значения null и undefined', () => {
        it('отображает "—" для null-значений', () => {
            render(<SummaryCard summary={summaryWithNull} tokenType="community" />);
            expect(screen.getByText('—')).toBeInTheDocument();
        });
    });

    describe('вложенные объекты', () => {
        it('сериализует объекты в JSON (обрезка до 60 символов)', () => {
            render(<SummaryCard summary={summaryWithObject} tokenType="service" />);
            // Вложенный объект должен быть сериализован
            expect(screen.getByText(/key.*value/)).toBeInTheDocument();
        });
    });

    describe('разные типы токенов', () => {
        it('community — отображает Community Token', () => {
            render(<SummaryCard summary={fullSummary} tokenType="community" />);
            expect(screen.getByText(/Community Token/)).toBeInTheDocument();
        });

        it('service — отображает Service Token', () => {
            render(<SummaryCard summary={fullSummary} tokenType="service" />);
            expect(screen.getByText(/Service Token/)).toBeInTheDocument();
        });

        it('user_non_admin — отображает User (не админ)', () => {
            render(<SummaryCard summary={fullSummary} tokenType="user_non_admin" />);
            expect(screen.getByText(/User \(не админ\)/)).toBeInTheDocument();
        });

        it('неизвестный тип — fallback на user', () => {
            render(<SummaryCard summary={fullSummary} tokenType="bogus" />);
            expect(screen.getByText(/User \(админ\)/)).toBeInTheDocument();
        });
    });
});
