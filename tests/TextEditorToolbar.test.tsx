import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextEditorToolbar } from '../features/posts/components/modals/TextEditorToolbar';
import { vi } from 'vitest';

/** Базовые пропсы для тулбара */
function createProps(overrides: Partial<React.ComponentProps<typeof TextEditorToolbar>> = {}) {
    return {
        onLink: vi.fn(),
        onToggleEmoji: vi.fn(),
        isEmojiPickerOpen: false,
        onUndo: vi.fn(),
        onRedo: vi.fn(),
        canUndo: false,
        canRedo: false,
        ...overrides,
    };
}

describe('TextEditorToolbar', () => {
    // === Рендеринг кнопок ===
    describe('рендеринг', () => {
        it('рендерит 4 кнопки', () => {
            render(<TextEditorToolbar {...createProps()} />);
            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(4);
        });

        it('кнопка ссылки имеет title «Упоминание @id (текст)»', () => {
            render(<TextEditorToolbar {...createProps()} />);
            expect(screen.getByTitle('Упоминание @id (текст)')).toBeInTheDocument();
        });

        it('кнопка эмодзи имеет title «Эмодзи»', () => {
            render(<TextEditorToolbar {...createProps()} />);
            expect(screen.getByTitle('Эмодзи')).toBeInTheDocument();
        });

        it('кнопка Undo имеет title «Отменить (Ctrl+Z)»', () => {
            render(<TextEditorToolbar {...createProps()} />);
            expect(screen.getByTitle('Отменить (Ctrl+Z)')).toBeInTheDocument();
        });

        it('кнопка Redo имеет title «Повторить (Ctrl+Shift+Z)»', () => {
            render(<TextEditorToolbar {...createProps()} />);
            expect(screen.getByTitle('Повторить (Ctrl+Shift+Z)')).toBeInTheDocument();
        });
    });

    // === Клики ===
    describe('клики', () => {
        it('клик по кнопке ссылки вызывает onLink', () => {
            const props = createProps();
            render(<TextEditorToolbar {...props} />);
            fireEvent.click(screen.getByTitle('Упоминание @id (текст)'));
            expect(props.onLink).toHaveBeenCalledOnce();
        });

        it('клик по кнопке эмодзи вызывает onToggleEmoji', () => {
            const props = createProps();
            render(<TextEditorToolbar {...props} />);
            fireEvent.click(screen.getByTitle('Эмодзи'));
            expect(props.onToggleEmoji).toHaveBeenCalledOnce();
        });

        it('клик по Undo вызывает onUndo', () => {
            const props = createProps({ canUndo: true });
            render(<TextEditorToolbar {...props} />);
            fireEvent.click(screen.getByTitle('Отменить (Ctrl+Z)'));
            expect(props.onUndo).toHaveBeenCalledOnce();
        });

        it('клик по Redo вызывает onRedo', () => {
            const props = createProps({ canRedo: true });
            render(<TextEditorToolbar {...props} />);
            fireEvent.click(screen.getByTitle('Повторить (Ctrl+Shift+Z)'));
            expect(props.onRedo).toHaveBeenCalledOnce();
        });
    });

    // === Disabled состояние ===
    describe('disabled-состояние', () => {
        it('Undo disabled когда canUndo=false', () => {
            render(<TextEditorToolbar {...createProps({ canUndo: false })} />);
            expect(screen.getByTitle('Отменить (Ctrl+Z)')).toBeDisabled();
        });

        it('Redo disabled когда canRedo=false', () => {
            render(<TextEditorToolbar {...createProps({ canRedo: false })} />);
            expect(screen.getByTitle('Повторить (Ctrl+Shift+Z)')).toBeDisabled();
        });

        it('Undo enabled когда canUndo=true', () => {
            render(<TextEditorToolbar {...createProps({ canUndo: true })} />);
            expect(screen.getByTitle('Отменить (Ctrl+Z)')).toBeEnabled();
        });

        it('Redo enabled когда canRedo=true', () => {
            render(<TextEditorToolbar {...createProps({ canRedo: true })} />);
            expect(screen.getByTitle('Повторить (Ctrl+Shift+Z)')).toBeEnabled();
        });
    });

    // === Визуальное состояние эмодзи-кнопки ===
    describe('состояние эмодзи-кнопки', () => {
        it('при isEmojiPickerOpen=true кнопка получает indigo-стили', () => {
            render(<TextEditorToolbar {...createProps({ isEmojiPickerOpen: true })} />);
            const btn = screen.getByTitle('Эмодзи');
            expect(btn.className).toContain('!bg-indigo-100');
            expect(btn.className).toContain('!text-indigo-600');
        });

        it('при isEmojiPickerOpen=false кнопка без indigo-стилей', () => {
            render(<TextEditorToolbar {...createProps({ isEmojiPickerOpen: false })} />);
            const btn = screen.getByTitle('Эмодзи');
            expect(btn.className).not.toContain('!bg-indigo-100');
        });
    });
});
