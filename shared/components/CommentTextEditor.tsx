/**
 * CommentTextEditor — переиспользуемый текстовый редактор для комментариев.
 * 
 * Поддерживает:
 * - Emoji-пикер (inline)
 * - Undo/Redo (Ctrl+Z / Ctrl+Shift+Z) через useTextUndoHistory
 * - Вставку переменных (глобальных и локальных) через VariablesSelector
 * - Автозакрытие скобок и кавычек
 * - Счётчик символов
 * - Ссылки @id (текст)
 * 
 * Компонент можно встроить в любую часть системы — он полностью автономен.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { GlobalVariableDefinition, Project } from '../types';
import { useTextUndoHistory } from '../hooks/useTextUndoHistory';
import { VariablesSelector } from '../../features/posts/components/VariablesSelector';
import { EmojiPicker } from '../../features/emoji/components/EmojiPicker';

/** Максимальная длина комментария VK */
const MAX_COMMENT_LENGTH = 4096;

/** Пары авто-закрывающихся символов */
const AUTO_CLOSE_PAIRS: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
    '"': '"',
    "'": "'",
    '«': '»',
};

interface CommentTextEditorProps {
    /** Текст комментария (controlled) */
    text: string;
    /** Колбэк изменения текста */
    onTextChange: (text: string) => void;
    /** ID проекта (для emoji и переменных) */
    projectId: string;
    /** Объект текущего проекта (для VariablesSelector) */
    project: Project | null;
    /** Placeholder для textarea */
    placeholder?: string;
    /** Количество строк textarea */
    rows?: number;
    /** Переменные проекта */
    variables?: { name: string; value: string }[] | null;
    /** Загрузка переменных */
    isLoadingVariables?: boolean;
    /** Глобальные переменные */
    globalVariables?: GlobalVariableDefinition[] | null;
    /** Загрузка глобальных переменных */
    isLoadingGlobalVariables?: boolean;
    /** Показывать ли блок переменных */
    showVariables?: boolean;
    /** Колбэк для открытия настроек переменных */
    onEditVariables?: () => void;
    /** Disabled-состояние */
    disabled?: boolean;
}

export const CommentTextEditor: React.FC<CommentTextEditorProps> = ({
    text,
    onTextChange,
    projectId,
    project,
    placeholder = 'Введите текст комментария...',
    rows = 3,
    variables = null,
    isLoadingVariables = false,
    globalVariables = null,
    isLoadingGlobalVariables = false,
    showVariables = true,
    onEditVariables,
    disabled = false,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

    // --- Управление фокусом контейнера ---
    // Используем React-стейт вместо CSS focus-within, чтобы исключить:
    // 1) чёрную вспышку бордера при transition-all (интерполяция gray→indigo)
    // 2) мерцание обводки при переключении фокуса между элементами внутри контейнера
    const [isFocused, setIsFocused] = useState(false);
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    // При фокусе любого дочернего элемента — мгновенно включаем обводку
    const handleContainerFocus = useCallback(() => {
        clearTimeout(focusTimeoutRef.current);
        setIsFocused(true);
    }, []);

    // При потере фокуса — ждём микротаск, чтобы фокус успел перейти на другой элемент внутри контейнера
    const handleContainerBlur = useCallback(() => {
        focusTimeoutRef.current = setTimeout(() => {
            setIsFocused(false);
        }, 0);
    }, []);

    // Очистка таймера при размонтировании
    useEffect(() => {
        return () => clearTimeout(focusTimeoutRef.current);
    }, []);

    // Undo/Redo: собственный стек истории текста
    const { undo, redo, canUndo, canRedo } = useTextUndoHistory({
        text,
        onTextChange,
        textareaRef,
    });

    // Вставка переменной в позицию курсора
    const handleInsertVariable = useCallback((value: string) => {
        if (!textareaRef.current) return;
        const { selectionStart, selectionEnd } = textareaRef.current;
        const newText = text.substring(0, selectionStart) + value + text.substring(selectionEnd);
        onTextChange(newText);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newCursorPos = selectionStart + value.length;
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    }, [text, onTextChange]);

    // Вставка эмодзи
    const handleInsertEmoji = useCallback((emoji: string) => {
        if (!textareaRef.current) return;
        const { selectionStart, selectionEnd } = textareaRef.current;
        const newText = text.substring(0, selectionStart) + emoji + text.substring(selectionEnd);
        onTextChange(newText);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newCursorPos = selectionStart + emoji.length;
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    }, [text, onTextChange]);

    /**
     * Оборачивает выделенный текст или вставляет пару символов в позицию курсора.
     */
    const wrapSelection = useCallback((prefix: string, suffix: string) => {
        if (!textareaRef.current) return;
        const ta = textareaRef.current;
        const { selectionStart, selectionEnd } = ta;
        const selectedText = text.substring(selectionStart, selectionEnd);

        const newText = text.substring(0, selectionStart) + prefix + selectedText + suffix + text.substring(selectionEnd);
        onTextChange(newText);

        setTimeout(() => {
            ta.focus();
            if (selectedText.length > 0) {
                ta.setSelectionRange(selectionStart + prefix.length, selectionEnd + prefix.length);
            } else {
                const cursorPos = selectionStart + prefix.length;
                ta.setSelectionRange(cursorPos, cursorPos);
            }
        }, 0);
    }, [text, onTextChange]);

    // Вставка ссылки @id
    const handleLink = useCallback(() => {
        wrapSelection('@id (', ')');
    }, [wrapSelection]);

    /**
     * Автозакрытие скобок и кавычек при вводе.
     */
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const ta = textareaRef.current;
        if (!ta) return;

        const openChar = e.key;
        const closingChar = AUTO_CLOSE_PAIRS[openChar];

        if (closingChar) {
            const { selectionStart, selectionEnd } = ta;
            const selectedText = text.substring(selectionStart, selectionEnd);

            // Для кавычек — если символ после курсора тот же, просто перешагиваем
            if ((openChar === '"' || openChar === "'") && text[selectionStart] === openChar && selectionStart === selectionEnd) {
                e.preventDefault();
                setTimeout(() => {
                    ta.setSelectionRange(selectionStart + 1, selectionStart + 1);
                }, 0);
                return;
            }

            e.preventDefault();

            if (selectedText.length > 0) {
                const newText = text.substring(0, selectionStart) + openChar + selectedText + closingChar + text.substring(selectionEnd);
                onTextChange(newText);
                setTimeout(() => {
                    ta.setSelectionRange(selectionStart + 1, selectionEnd + 1);
                }, 0);
            } else {
                const newText = text.substring(0, selectionStart) + openChar + closingChar + text.substring(selectionEnd);
                onTextChange(newText);
                setTimeout(() => {
                    ta.setSelectionRange(selectionStart + 1, selectionStart + 1);
                }, 0);
            }
            return;
        }

        // Перешагиваем закрывающую скобку, если она уже стоит
        const closingChars = Object.values(AUTO_CLOSE_PAIRS);
        if (closingChars.includes(openChar) && !AUTO_CLOSE_PAIRS[openChar]) {
            const { selectionStart, selectionEnd } = ta;
            if (selectionStart === selectionEnd && text[selectionStart] === openChar) {
                e.preventDefault();
                setTimeout(() => {
                    ta.setSelectionRange(selectionStart + 1, selectionStart + 1);
                }, 0);
                return;
            }
        }

        // Backspace: удаляем парную скобку/кавычку
        if (e.key === 'Backspace') {
            const { selectionStart, selectionEnd } = ta;
            if (selectionStart === selectionEnd && selectionStart > 0) {
                const charBefore = text[selectionStart - 1];
                const charAfter = text[selectionStart];
                if (AUTO_CLOSE_PAIRS[charBefore] === charAfter) {
                    e.preventDefault();
                    const newText = text.substring(0, selectionStart - 1) + text.substring(selectionStart + 1);
                    onTextChange(newText);
                    setTimeout(() => {
                        ta.setSelectionRange(selectionStart - 1, selectionStart - 1);
                    }, 0);
                    return;
                }
            }
        }
    }, [text, onTextChange]);

    // Счётчик символов
    const charCount = text.length;
    const isOverLimit = charCount > MAX_COMMENT_LENGTH;

    /** Стили кнопок тулбара */
    const toolbarBtnClass = "p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors";
    const toolbarBtnDisabledClass = "p-1.5 rounded text-gray-300 cursor-default";

    return (
        <div className="space-y-2">
            {/* Блок переменных (компактный) */}
            {showVariables && (variables || globalVariables) && (
                <div className="bg-gray-50 border rounded-md p-2">
                    <VariablesSelector
                        isLoading={isLoadingVariables}
                        variables={variables}
                        isLoadingGlobalVariables={isLoadingGlobalVariables}
                        globalVariables={globalVariables}
                        project={project}
                        onInsert={handleInsertVariable}
                        onEditVariables={onEditVariables}
                    />
                </div>
            )}

            {/* Текстовый редактор */}
            <div
                className={`border rounded-lg overflow-hidden ${
                    isFocused
                        ? 'border-indigo-500 ring-2 ring-indigo-500'
                        : 'border-gray-300'
                } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
                onFocus={handleContainerFocus}
                onBlur={handleContainerBlur}
            >
                {/* Тулбар */}
                <div className="flex items-center gap-0.5 px-2 py-1 bg-gray-50 border-b border-gray-200">
                    {/* Ссылка @ */}
                    <button type="button" onClick={handleLink} title="Упоминание @id (текст)" className={toolbarBtnClass}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                    </button>

                    {/* Разделитель */}
                    <div className="w-px h-4 bg-gray-300 mx-1" />

                    {/* Эмодзи */}
                    <button
                        type="button"
                        onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                        title="Эмодзи"
                        className={`${toolbarBtnClass} ${isEmojiPickerOpen ? '!bg-indigo-100 !text-indigo-600' : ''}`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>

                    {/* Пружина */}
                    <div className="flex-1" />

                    {/* Undo */}
                    <button
                        type="button"
                        onClick={undo}
                        disabled={!canUndo}
                        title="Отменить (Ctrl+Z)"
                        className={canUndo ? toolbarBtnClass : toolbarBtnDisabledClass}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
                        </svg>
                    </button>
                    {/* Redo */}
                    <button
                        type="button"
                        onClick={redo}
                        disabled={!canRedo}
                        title="Повторить (Ctrl+Shift+Z)"
                        className={canRedo ? toolbarBtnClass : toolbarBtnDisabledClass}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" />
                        </svg>
                    </button>
                </div>

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={e => onTextChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={isEmojiPickerOpen ? Math.max(2, rows - 1) : rows}
                    className="w-full p-2.5 text-sm text-gray-800 bg-white resize-y border-0 outline-none focus:ring-0 focus:outline-none custom-scrollbar"
                    placeholder={placeholder}
                    disabled={disabled}
                />

                {/* Inline Emoji Picker */}
                {isEmojiPickerOpen && (
                    <EmojiPicker
                        projectId={projectId}
                        onSelectEmoji={handleInsertEmoji}
                        variant="inline"
                    />
                )}

                {/* Счётчик символов */}
                <div className="flex items-center justify-end px-2.5 py-1 bg-gray-50 border-t border-gray-200">
                    <span className={`text-xs tabular-nums ${isOverLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        {charCount}/{MAX_COMMENT_LENGTH}
                    </span>
                </div>
            </div>
        </div>
    );
};
