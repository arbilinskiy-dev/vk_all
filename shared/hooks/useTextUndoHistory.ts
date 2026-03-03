// useTextUndoHistory — хук для реализации Ctrl+Z / Ctrl+Shift+Z (undo/redo)
// в текстовом поле (textarea) с React controlled component.
//
// React controlled inputs теряют нативную историю undo браузера при
// программном изменении value (вставка AI-текста, эмодзи, переменных).
// Этот хук ведёт собственный стек истории и перехватывает горячие клавиши.

import { useRef, useCallback, useEffect, useState, RefObject } from 'react';

interface UseTextUndoHistoryOptions {
    /** Текущий текст (controlled) */
    text: string;
    /** Колбэк изменения текста */
    onTextChange: (text: string) => void;
    /** Ref на textarea для перехвата клавиш */
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    /** Максимальное количество снапшотов в истории (по умолчанию 100) */
    maxHistory?: number;
}

/**
 * Хук для undo/redo в текстовом поле.
 * Ведёт стек истории изменений текста и обрабатывает Ctrl+Z / Ctrl+Shift+Z.
 */
export function useTextUndoHistory({
    text,
    onTextChange,
    textareaRef,
    maxHistory = 100,
}: UseTextUndoHistoryOptions) {
    // Стек истории: массив снапшотов текста
    const historyRef = useRef<string[]>([text || '']);
    // Текущая позиция в стеке (указатель)
    const positionRef = useRef<number>(0);
    // Флаг: мы сейчас применяем undo/redo (чтобы не записывать это как новое изменение)
    const isUndoRedoRef = useRef<boolean>(false);
    // Таймер для дебаунса сохранения снапшота при обычном наборе
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Реактивные флаги доступности undo/redo (для отображения состояния кнопок)
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    /** Обновляет реактивные флаги canUndo/canRedo на основе текущего стека */
    const updateFlags = useCallback(() => {
        setCanUndo(positionRef.current > 0);
        setCanRedo(positionRef.current < historyRef.current.length - 1);
    }, []);

    /**
     * Записывает новый снапшот в стек истории.
     * Вызывается при каждом значимом изменении текста.
     */
    const pushSnapshot = useCallback((newText: string) => {
        const history = historyRef.current;
        const position = positionRef.current;

        // Не записывать, если текст не изменился
        if (history[position] === newText) return;

        // Обрезаем "будущее" (все снапшоты после текущей позиции)
        const newHistory = history.slice(0, position + 1);
        newHistory.push(newText);

        // Ограничиваем размер стека
        if (newHistory.length > maxHistory) {
            newHistory.shift();
        }

        historyRef.current = newHistory;
        positionRef.current = newHistory.length - 1;
        updateFlags();
    }, [maxHistory, updateFlags]);

    /**
     * Отслеживаем изменения текста извне.
     * При обычном наборе — дебаунсим (300мс), при программной вставке — сохраняем сразу.
     */
    useEffect(() => {
        // Если это undo/redo — не записываем в историю
        if (isUndoRedoRef.current) {
            isUndoRedoRef.current = false;
            return;
        }

        // Очищаем предыдущий таймер
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Дебаунс для набора текста: записываем снапшот через 300мс
        debounceTimerRef.current = setTimeout(() => {
            pushSnapshot(text);
        }, 300);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [text, pushSnapshot]);

    /**
     * Undo — переход на предыдущий снапшот.
     */
    const undo = useCallback(() => {
        // Перед undo — сохраняем текущее состояние, если оно отличается от последнего снапшота
        const history = historyRef.current;
        const position = positionRef.current;

        if (history[position] !== text) {
            pushSnapshot(text);
        }

        if (positionRef.current > 0) {
            // Сдвигаем позицию
            positionRef.current -= 1;
            const prevText = historyRef.current[positionRef.current];

            // Ставим флаг, чтобы useEffect не записал это как новое изменение
            isUndoRedoRef.current = true;
            onTextChange(prevText);
            updateFlags();
        }
    }, [text, onTextChange, pushSnapshot, updateFlags]);

    /**
     * Redo — переход на следующий снапшот.
     */
    const redo = useCallback(() => {
        const history = historyRef.current;
        if (positionRef.current < history.length - 1) {
            positionRef.current += 1;
            const nextText = history[positionRef.current];

            isUndoRedoRef.current = true;
            onTextChange(nextText);
            updateFlags();
        }
    }, [onTextChange, updateFlags]);

    /**
     * Обработчик клавиш на textarea.
     * Ctrl+Z — undo, Ctrl+Shift+Z / Ctrl+Y — redo.
     */
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Z (без Shift) — undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
                return;
            }

            // Ctrl+Shift+Z — redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                redo();
                return;
            }

            // Ctrl+Y — redo (альтернатива)
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
                return;
            }
        };

        textarea.addEventListener('keydown', handleKeyDown);
        return () => textarea.removeEventListener('keydown', handleKeyDown);
    }, [textareaRef, undo, redo]);

    return { undo, redo, canUndo, canRedo };
}
