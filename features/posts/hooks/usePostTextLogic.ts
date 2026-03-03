import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Project } from '../../../shared/types';
import { useTextUndoHistory } from '../../../shared/hooks/useTextUndoHistory';
import { AUTO_CLOSE_PAIRS, MAX_TEXT_LENGTH } from '../components/modals/postTextConstants';

interface UsePostTextLogicParams {
    editedText: string;
    onTextChange: (text: string) => void;
    projectId: string;
    allProjects: Project[];
}

export function usePostTextLogic({
    editedText,
    onTextChange,
    projectId,
    allProjects,
}: UsePostTextLogicParams) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

    // --- Управление фокусом контейнера ---
    // React-стейт вместо CSS focus-within, чтобы исключить:
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

    // Undo/Redo: собственный стек истории текста (Ctrl+Z / Ctrl+Shift+Z)
    const { undo, redo, canUndo, canRedo } = useTextUndoHistory({
        text: editedText,
        onTextChange,
        textareaRef,
    });

    const currentProject = allProjects.find(p => p.id === projectId) || null;

    const handleInsertVariable = useCallback((value: string) => {
        if (!textareaRef.current) return;
        const { selectionStart, selectionEnd } = textareaRef.current;
        const newText = editedText.substring(0, selectionStart) + value + editedText.substring(selectionEnd);
        onTextChange(newText);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newCursorPos = selectionStart + value.length;
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    }, [editedText, onTextChange]);

    const handleInsertEmoji = useCallback((emoji: string) => {
        if (!textareaRef.current) return;
        const { selectionStart, selectionEnd } = textareaRef.current;
        const newText = editedText.substring(0, selectionStart) + emoji + editedText.substring(selectionEnd);
        onTextChange(newText);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newCursorPos = selectionStart + emoji.length;
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    }, [editedText, onTextChange]);

    /**
     * Оборачивает выделенный текст или вставляет пару символов в позицию курсора.
     * Если текст выделен — оборачивает его: prefix + selected + suffix.
     * Если нет — вставляет prefix + suffix и ставит курсор между ними.
     */
    const wrapSelection = useCallback((prefix: string, suffix: string) => {
        if (!textareaRef.current) return;
        const ta = textareaRef.current;
        const { selectionStart, selectionEnd } = ta;
        const selectedText = editedText.substring(selectionStart, selectionEnd);

        const newText = editedText.substring(0, selectionStart) + prefix + selectedText + suffix + editedText.substring(selectionEnd);
        onTextChange(newText);

        setTimeout(() => {
            ta.focus();
            if (selectedText.length > 0) {
                // Выделяем обёрнутый текст (без prefix/suffix)
                ta.setSelectionRange(selectionStart + prefix.length, selectionEnd + prefix.length);
            } else {
                // Курсор между prefix и suffix
                const cursorPos = selectionStart + prefix.length;
                ta.setSelectionRange(cursorPos, cursorPos);
            }
        }, 0);
    }, [editedText, onTextChange]);

    // Обработчик тулбара — ссылка
    const handleLink = useCallback(() => {
        if (!textareaRef.current) return;
        const { selectionStart, selectionEnd } = textareaRef.current;
        const selectedText = editedText.substring(selectionStart, selectionEnd);
        if (selectedText) {
            // Если выделен текст — оборачиваем в конструкцию ссылки VK
            wrapSelection('@id (', ')');
        } else {
            // Если ничего не выделено — вставляем шаблон
            wrapSelection('@id (', ')');
        }
    }, [editedText, wrapSelection]);

    /**
     * Автозакрытие скобок и кавычек при вводе.
     * Перехватываем onKeyDown на textarea.
     */
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const ta = textareaRef.current;
        if (!ta) return;

        const openChar = e.key;
        const closingChar = AUTO_CLOSE_PAIRS[openChar];

        if (closingChar) {
            const { selectionStart, selectionEnd } = ta;
            const selectedText = editedText.substring(selectionStart, selectionEnd);

            // Для кавычек (" и ') — если символ после курсора тот же, просто перешагиваем
            if ((openChar === '"' || openChar === "'") && editedText[selectionStart] === openChar && selectionStart === selectionEnd) {
                e.preventDefault();
                setTimeout(() => {
                    ta.setSelectionRange(selectionStart + 1, selectionStart + 1);
                }, 0);
                return;
            }

            e.preventDefault();

            if (selectedText.length > 0) {
                // Оборачиваем выделение
                const newText = editedText.substring(0, selectionStart) + openChar + selectedText + closingChar + editedText.substring(selectionEnd);
                onTextChange(newText);
                setTimeout(() => {
                    ta.setSelectionRange(selectionStart + 1, selectionEnd + 1);
                }, 0);
            } else {
                // Вставляем пару и курсор между ними
                const newText = editedText.substring(0, selectionStart) + openChar + closingChar + editedText.substring(selectionEnd);
                onTextChange(newText);
                setTimeout(() => {
                    ta.setSelectionRange(selectionStart + 1, selectionStart + 1);
                }, 0);
            }
            return;
        }

        // Если нажата закрывающая скобка, а справа от курсора уже стоит такая же — перешагиваем
        const closingChars = Object.values(AUTO_CLOSE_PAIRS);
        if (closingChars.includes(openChar) && !AUTO_CLOSE_PAIRS[openChar]) {
            const { selectionStart, selectionEnd } = ta;
            if (selectionStart === selectionEnd && editedText[selectionStart] === openChar) {
                e.preventDefault();
                setTimeout(() => {
                    ta.setSelectionRange(selectionStart + 1, selectionStart + 1);
                }, 0);
                return;
            }
        }

        // Backspace: удаляем парную скобку/кавычку если курсор стоит между ними
        if (e.key === 'Backspace') {
            const { selectionStart, selectionEnd } = ta;
            if (selectionStart === selectionEnd && selectionStart > 0) {
                const charBefore = editedText[selectionStart - 1];
                const charAfter = editedText[selectionStart];
                if (AUTO_CLOSE_PAIRS[charBefore] === charAfter) {
                    e.preventDefault();
                    const newText = editedText.substring(0, selectionStart - 1) + editedText.substring(selectionStart + 1);
                    onTextChange(newText);
                    setTimeout(() => {
                        ta.setSelectionRange(selectionStart - 1, selectionStart - 1);
                    }, 0);
                    return;
                }
            }
        }
    }, [editedText, onTextChange]);

    // Счётчик символов
    const charCount = editedText.length;
    const isOverLimit = charCount > MAX_TEXT_LENGTH;

    // Переключение эмодзи-пикера
    const toggleEmojiPicker = useCallback(() => {
        setIsEmojiPickerOpen(prev => !prev);
    }, []);

    return {
        state: {
            textareaRef,
            isEmojiPickerOpen,
            isFocused,
            canUndo,
            canRedo,
            currentProject,
            charCount,
            isOverLimit,
        },
        actions: {
            handleContainerFocus,
            handleContainerBlur,
            undo,
            redo,
            handleInsertVariable,
            handleInsertEmoji,
            handleLink,
            handleKeyDown,
            toggleEmojiPicker,
        },
    };
}
