import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Мокаем тяжёлые зависимости, чтобы тесты хаба были изолированными
vi.mock('../features/posts/hooks/usePostTextLogic', () => ({
    usePostTextLogic: () => ({
        state: {
            textareaRef: { current: null },
            isEmojiPickerOpen: false,
            isFocused: false,
            canUndo: false,
            canRedo: false,
            currentProject: null,
            charCount: 42,
            isOverLimit: false,
        },
        actions: {
            handleContainerFocus: vi.fn(),
            handleContainerBlur: vi.fn(),
            undo: vi.fn(),
            redo: vi.fn(),
            handleInsertVariable: vi.fn(),
            handleInsertEmoji: vi.fn(),
            handleLink: vi.fn(),
            handleKeyDown: vi.fn(),
            toggleEmojiPicker: vi.fn(),
        },
    }),
}));

vi.mock('../features/posts/components/modals/TextEditorToolbar', () => ({
    TextEditorToolbar: () => <div data-testid="text-editor-toolbar" />,
}));

vi.mock('../features/posts/components/VariablesSelector', () => ({
    VariablesSelector: () => <div data-testid="variables-selector" />,
}));

vi.mock('../features/emoji/components/EmojiPicker', () => ({
    EmojiPicker: () => <div data-testid="emoji-picker" />,
}));

vi.mock('../features/projects/components/modals/ProjectSettingsModal', () => ({
    AccordionSectionKey: {},
}));

import { PostTextSection } from '../features/posts/components/modals/PostTextSection';

/** Базовые пропсы */
function createProps(overrides: Partial<React.ComponentProps<typeof PostTextSection>> = {}) {
    return {
        mode: 'edit' as const,
        postText: 'Текст поста',
        editedText: 'Редактируемый текст',
        onTextChange: vi.fn(),
        projectId: 'proj-1',
        allProjects: [],
        showVariables: true,
        onToggleVariables: vi.fn(),
        onReloadVariables: vi.fn(),
        variables: [{ name: 'var1', value: 'val1' }],
        isLoadingVariables: false,
        globalVariables: null,
        isLoadingGlobalVariables: false,
        onOpenProjectSettings: vi.fn(),
        ...overrides,
    };
}

describe('PostTextSection (хаб)', () => {
    // === Режим edit ===
    describe('режим edit', () => {
        it('рендерит тулбар', () => {
            render(<PostTextSection {...createProps()} />);
            expect(screen.getByTestId('text-editor-toolbar')).toBeInTheDocument();
        });

        it('рендерит VariablesSelector', () => {
            render(<PostTextSection {...createProps()} />);
            expect(screen.getByTestId('variables-selector')).toBeInTheDocument();
        });

        it('рендерит textarea с placeholder', () => {
            render(<PostTextSection {...createProps()} />);
            expect(screen.getByPlaceholderText('Введите текст...')).toBeInTheDocument();
        });

        it('рендерит label «Текст поста»', () => {
            render(<PostTextSection {...createProps()} />);
            expect(screen.getByText('Текст поста')).toBeInTheDocument();
        });

        it('рендерит счётчик символов', () => {
            render(<PostTextSection {...createProps()} />);
            // charCount из мока = 42
            expect(screen.getByText('42/8206')).toBeInTheDocument();
        });

        it('рендерит кнопку «Обновить» для переменных', () => {
            render(<PostTextSection {...createProps()} />);
            expect(screen.getByText('Обновить')).toBeInTheDocument();
        });

        it('рендерит кнопку «Настроить»', () => {
            render(<PostTextSection {...createProps()} />);
            expect(screen.getByText('Настроить')).toBeInTheDocument();
        });
    });

    // === Режим view ===
    describe('режим view', () => {
        it('рендерит текст поста', () => {
            render(<PostTextSection {...createProps({ mode: 'view', postText: 'Мой пост' })} />);
            expect(screen.getByText('Мой пост')).toBeInTheDocument();
        });

        it('рендерит label «Текст публикации»', () => {
            render(<PostTextSection {...createProps({ mode: 'view' })} />);
            expect(screen.getByText('Текст публикации')).toBeInTheDocument();
        });

        it('НЕ рендерит тулбар', () => {
            render(<PostTextSection {...createProps({ mode: 'view' })} />);
            expect(screen.queryByTestId('text-editor-toolbar')).not.toBeInTheDocument();
        });

        it('НЕ рендерит textarea', () => {
            render(<PostTextSection {...createProps({ mode: 'view' })} />);
            expect(screen.queryByPlaceholderText('Введите текст...')).not.toBeInTheDocument();
        });

        it('НЕ рендерит блок переменных', () => {
            render(<PostTextSection {...createProps({ mode: 'view' })} />);
            expect(screen.queryByTestId('variables-selector')).not.toBeInTheDocument();
        });

        it('показывает заглушку при пустом тексте', () => {
            render(<PostTextSection {...createProps({ mode: 'view', postText: '' })} />);
            expect(screen.getByText('Текст отсутствует')).toBeInTheDocument();
        });
    });

    // === Режим copy (аналогичен view) ===
    describe('режим copy', () => {
        it('показывает текст как view', () => {
            render(<PostTextSection {...createProps({ mode: 'copy', postText: 'Текст копии' })} />);
            expect(screen.getByText('Текст копии')).toBeInTheDocument();
        });

        it('НЕ рендерит тулбар', () => {
            render(<PostTextSection {...createProps({ mode: 'copy' })} />);
            expect(screen.queryByTestId('text-editor-toolbar')).not.toBeInTheDocument();
        });
    });
});
