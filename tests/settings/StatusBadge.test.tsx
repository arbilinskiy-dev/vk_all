/**
 * Тесты компонента StatusBadge.
 * Проверяем рендер для каждого статуса: done, error, pending, processing, fetching.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../features/settings/components/StatusBadge';
import type { RefreshProgress } from '../../services/api/lists.api';

// Хелпер для создания минимального прогресса
const makeProgress = (status: RefreshProgress['status']): RefreshProgress => ({
    status,
});

describe('StatusBadge', () => {
    it('не рендерит ничего при progress === null', () => {
        const { container } = render(<StatusBadge progress={null} />);
        expect(container.innerHTML).toBe('');
    });

    it('рендерит "Готово" со стилем зелёного бейджа', () => {
        render(<StatusBadge progress={makeProgress('done')} />);
        const badge = screen.getByText('Готово');
        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain('bg-green-100');
        expect(badge.className).toContain('text-green-800');
    });

    it('рендерит "Ошибка" со стилем красного бейджа', () => {
        render(<StatusBadge progress={makeProgress('error')} />);
        const badge = screen.getByText('Ошибка');
        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain('bg-red-100');
        expect(badge.className).toContain('text-red-800');
    });

    it('рендерит "Ожидание" со стилем серого бейджа', () => {
        render(<StatusBadge progress={makeProgress('pending')} />);
        const badge = screen.getByText('Ожидание');
        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain('bg-gray-100');
        expect(badge.className).toContain('text-gray-800');
    });

    it('рендерит "Работа" с анимацией pulse для статуса processing', () => {
        render(<StatusBadge progress={makeProgress('processing')} />);
        const badge = screen.getByText('Работа');
        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain('bg-blue-100');
        expect(badge.className).toContain('text-blue-800');
        expect(badge.className).toContain('animate-pulse');
    });

    it('рендерит "Работа" с анимацией pulse для статуса fetching', () => {
        render(<StatusBadge progress={makeProgress('fetching')} />);
        const badge = screen.getByText('Работа');
        expect(badge).toBeInTheDocument();
        expect(badge.className).toContain('animate-pulse');
    });

    it('не рендерит ничего для неизвестного статуса', () => {
        // Преобразуем к any, чтобы передать невалидный статус
        const progress = { status: 'unknown_status' } as any;
        const { container } = render(<StatusBadge progress={progress} />);
        expect(container.innerHTML).toBe('');
    });

    it('все бейджи имеют класс whitespace-nowrap', () => {
        const { rerender } = render(<StatusBadge progress={makeProgress('done')} />);
        expect(screen.getByText('Готово').className).toContain('whitespace-nowrap');

        rerender(<StatusBadge progress={makeProgress('error')} />);
        expect(screen.getByText('Ошибка').className).toContain('whitespace-nowrap');

        rerender(<StatusBadge progress={makeProgress('pending')} />);
        expect(screen.getByText('Ожидание').className).toContain('whitespace-nowrap');
    });
});
