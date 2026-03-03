import { renderHook, act } from '@testing-library/react';
import { usePostTextLogic } from '../features/posts/hooks/usePostTextLogic';
import { vi } from 'vitest';

// Мокаем useTextUndoHistory — возвращаем заглушки
vi.mock('../shared/hooks/useTextUndoHistory', () => ({
    useTextUndoHistory: () => ({
        undo: vi.fn(),
        redo: vi.fn(),
        canUndo: false,
        canRedo: false,
    }),
}));

/** Хелпер: базовые параметры хука */
function createParams(overrides: Partial<Parameters<typeof usePostTextLogic>[0]> = {}) {
    return {
        editedText: '',
        onTextChange: vi.fn(),
        projectId: 'proj-1',
        allProjects: [
            { id: 'proj-1', name: 'Тестовый проект', group_id: '123', vk_group_token: 'tok' } as any,
            { id: 'proj-2', name: 'Другой проект', group_id: '456', vk_group_token: 'tok2' } as any,
        ],
        ...overrides,
    };
}

describe('usePostTextLogic', () => {
    // === Начальное состояние ===
    describe('начальное состояние', () => {
        it('isEmojiPickerOpen = false', () => {
            const { result } = renderHook(() => usePostTextLogic(createParams()));
            expect(result.current.state.isEmojiPickerOpen).toBe(false);
        });

        it('isFocused = false', () => {
            const { result } = renderHook(() => usePostTextLogic(createParams()));
            expect(result.current.state.isFocused).toBe(false);
        });

        it('charCount = 0 при пустом тексте', () => {
            const { result } = renderHook(() => usePostTextLogic(createParams()));
            expect(result.current.state.charCount).toBe(0);
        });

        it('isOverLimit = false при пустом тексте', () => {
            const { result } = renderHook(() => usePostTextLogic(createParams()));
            expect(result.current.state.isOverLimit).toBe(false);
        });

        it('textareaRef.current = null', () => {
            const { result } = renderHook(() => usePostTextLogic(createParams()));
            expect(result.current.state.textareaRef.current).toBeNull();
        });
    });

    // === currentProject ===
    describe('currentProject', () => {
        it('находит проект по projectId', () => {
            const { result } = renderHook(() => usePostTextLogic(createParams({ projectId: 'proj-1' })));
            expect(result.current.state.currentProject).toBeTruthy();
            expect(result.current.state.currentProject!.id).toBe('proj-1');
        });

        it('возвращает null при несуществующем projectId', () => {
            const { result } = renderHook(() => usePostTextLogic(createParams({ projectId: 'не-существует' })));
            expect(result.current.state.currentProject).toBeNull();
        });
    });

    // === charCount и isOverLimit ===
    describe('счётчик символов', () => {
        it('charCount отражает длину текста', () => {
            const { result } = renderHook(() => usePostTextLogic(createParams({ editedText: 'Привет' })));
            expect(result.current.state.charCount).toBe(6);
        });

        it('isOverLimit = true при превышении 8206 символов', () => {
            const longText = 'a'.repeat(8207);
            const { result } = renderHook(() => usePostTextLogic(createParams({ editedText: longText })));
            expect(result.current.state.isOverLimit).toBe(true);
        });

        it('isOverLimit = false при ровно 8206 символах', () => {
            const exactText = 'a'.repeat(8206);
            const { result } = renderHook(() => usePostTextLogic(createParams({ editedText: exactText })));
            expect(result.current.state.isOverLimit).toBe(false);
        });
    });

    // === toggleEmojiPicker ===
    describe('toggleEmojiPicker', () => {
        it('переключает isEmojiPickerOpen', () => {
            const { result } = renderHook(() => usePostTextLogic(createParams()));

            expect(result.current.state.isEmojiPickerOpen).toBe(false);

            act(() => {
                result.current.actions.toggleEmojiPicker();
            });
            expect(result.current.state.isEmojiPickerOpen).toBe(true);

            act(() => {
                result.current.actions.toggleEmojiPicker();
            });
            expect(result.current.state.isEmojiPickerOpen).toBe(false);
        });
    });

    // === handleContainerFocus / handleContainerBlur ===
    describe('управление фокусом', () => {
        it('handleContainerFocus устанавливает isFocused = true', () => {
            const { result } = renderHook(() => usePostTextLogic(createParams()));

            act(() => {
                result.current.actions.handleContainerFocus();
            });

            expect(result.current.state.isFocused).toBe(true);
        });

        it('handleContainerBlur сбрасывает isFocused = false (асинхронно)', async () => {
            vi.useFakeTimers();
            const { result } = renderHook(() => usePostTextLogic(createParams()));

            act(() => {
                result.current.actions.handleContainerFocus();
            });
            expect(result.current.state.isFocused).toBe(true);

            act(() => {
                result.current.actions.handleContainerBlur();
            });
            // Ещё true — таймер не сработал
            expect(result.current.state.isFocused).toBe(true);

            // Сдвигаем таймер
            act(() => {
                vi.runAllTimers();
            });
            expect(result.current.state.isFocused).toBe(false);

            vi.useRealTimers();
        });

        it('focus после blur отменяет сброс', () => {
            vi.useFakeTimers();
            const { result } = renderHook(() => usePostTextLogic(createParams()));

            act(() => {
                result.current.actions.handleContainerFocus();
            });
            act(() => {
                result.current.actions.handleContainerBlur();
            });
            // Мгновенно вызываем focus — отменяет таймер blur
            act(() => {
                result.current.actions.handleContainerFocus();
            });
            act(() => {
                vi.runAllTimers();
            });
            expect(result.current.state.isFocused).toBe(true);

            vi.useRealTimers();
        });
    });

    // === Все actions являются функциями ===
    describe('actions — все функции', () => {
        it('содержит все ожидаемые экшены', () => {
            const { result } = renderHook(() => usePostTextLogic(createParams()));
            const { actions } = result.current;

            expect(typeof actions.handleContainerFocus).toBe('function');
            expect(typeof actions.handleContainerBlur).toBe('function');
            expect(typeof actions.undo).toBe('function');
            expect(typeof actions.redo).toBe('function');
            expect(typeof actions.handleInsertVariable).toBe('function');
            expect(typeof actions.handleInsertEmoji).toBe('function');
            expect(typeof actions.handleLink).toBe('function');
            expect(typeof actions.handleKeyDown).toBe('function');
            expect(typeof actions.toggleEmojiPicker).toBe('function');
        });
    });
});
