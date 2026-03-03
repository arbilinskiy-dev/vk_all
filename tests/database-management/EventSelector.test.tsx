/**
 * Тесты: EventSelector
 * Проверяем подкомпонент выбора событий для подписки
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EventSelector } from '../../features/database-management/components/modals/EventSelector';
import { ALL_EVENT_KEYS, CALLBACK_EVENT_CATEGORIES } from '../../shared/utils/callbackEvents';

/** Базовые пропсы */
function createProps(overrides: Partial<React.ComponentProps<typeof EventSelector>> = {}) {
    return {
        selectedEvents: new Set(ALL_EVENT_KEYS),
        showEventSelector: false,
        allSelected: true,
        onToggleShow: vi.fn(),
        onToggleEvent: vi.fn(),
        onToggleCategory: vi.fn(),
        onSelectAll: vi.fn(),
        onDeselectAll: vi.fn(),
        ...overrides,
    };
}

describe('EventSelector', () => {
    it('рендерит кнопку выбора событий с счётчиком', () => {
        render(<EventSelector {...createProps()} />);
        expect(screen.getByText(`Выбрать события (${ALL_EVENT_KEYS.length}/${ALL_EVENT_KEYS.length})`)).toBeInTheDocument();
    });

    it('показывает бейдж «Все события» когда все выбраны', () => {
        render(<EventSelector {...createProps()} />);
        expect(screen.getByText('Все события')).toBeInTheDocument();
    });

    it('показывает бейдж «N из M» когда не все выбраны', () => {
        const selected = new Set(['message_new', 'message_reply']);
        render(<EventSelector {...createProps({
            selectedEvents: selected,
            allSelected: false,
        })} />);
        expect(screen.getByText(`2 из ${ALL_EVENT_KEYS.length}`)).toBeInTheDocument();
    });

    it('вызывает onToggleShow при клике на стрелку', () => {
        const onToggleShow = vi.fn();
        render(<EventSelector {...createProps({ onToggleShow })} />);
        const toggleBtn = screen.getByText(/Выбрать события/).closest('button');
        fireEvent.click(toggleBtn!);
        expect(onToggleShow).toHaveBeenCalledTimes(1);
    });

    it('НЕ показывает категории когда showEventSelector=false', () => {
        render(<EventSelector {...createProps({ showEventSelector: false })} />);
        expect(screen.queryByText('Выбрать все')).not.toBeInTheDocument();
    });

    it('показывает категории когда showEventSelector=true', () => {
        render(<EventSelector {...createProps({ showEventSelector: true })} />);
        // Первая категория — «Сообщения»
        expect(screen.getByText('Сообщения')).toBeInTheDocument();
        // Кнопки управления
        expect(screen.getByText('Выбрать все')).toBeInTheDocument();
        expect(screen.getByText('Снять все')).toBeInTheDocument();
    });

    it('вызывает onSelectAll при клике «Выбрать все»', () => {
        const onSelectAll = vi.fn();
        render(<EventSelector {...createProps({ showEventSelector: true, onSelectAll })} />);
        fireEvent.click(screen.getByText('Выбрать все'));
        expect(onSelectAll).toHaveBeenCalledTimes(1);
    });

    it('вызывает onDeselectAll при клике «Снять все»', () => {
        const onDeselectAll = vi.fn();
        render(<EventSelector {...createProps({ showEventSelector: true, onDeselectAll })} />);
        fireEvent.click(screen.getByText('Снять все'));
        expect(onDeselectAll).toHaveBeenCalledTimes(1);
    });

    it('рендерит все категории событий', () => {
        render(<EventSelector {...createProps({ showEventSelector: true })} />);
        CALLBACK_EVENT_CATEGORIES.forEach(cat => {
            expect(screen.getByText(cat.label)).toBeInTheDocument();
        });
    });

    it('вызывает onToggleEvent для конкретного события', () => {
        const onToggleEvent = vi.fn();
        render(<EventSelector {...createProps({ showEventSelector: true, onToggleEvent })} />);
        // Клик на чекбокс «Входящее сообщение»
        const checkbox = screen.getByLabelText('Входящее сообщение');
        fireEvent.click(checkbox);
        expect(onToggleEvent).toHaveBeenCalledWith('message_new');
    });

    it('вызывает onToggleCategory для категории', () => {
        const onToggleCategory = vi.fn();
        render(<EventSelector {...createProps({ showEventSelector: true, onToggleCategory })} />);
        // Клик на чекбокс категории «Сообщения»
        const categoryCheckbox = screen.getByRole('checkbox', { name: /Сообщения/ });
        fireEvent.click(categoryCheckbox);
        expect(onToggleCategory).toHaveBeenCalledWith(CALLBACK_EVENT_CATEGORIES[0]);
    });
});
