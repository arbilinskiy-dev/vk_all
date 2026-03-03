/**
 * Хук логики ChatInput — стейт, эффекты, обработчики.
 * Выделен из ChatInput.tsx при декомпозиции.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { GlobalVariableDefinition, Project } from '../../../../shared/types';
import { useTextUndoHistory } from '../../../../shared/hooks/useTextUndoHistory';
import { getGlobalVariablesForProject } from '../../../../services/api/global_variable.api';
import { getProjectVariables } from '../../../../services/api/project.api';
import { getPromoVariables, PromoVariableInfo } from '../../../../services/api/promo_lists.api';
import { sendTypingStatus } from '../../../../services/api/messages.api';
import { AttachedFile, AUTO_CLOSE_PAIRS, TYPING_THROTTLE_MS, MAX_MESSAGE_LENGTH } from '../../components/chat/chatInputConstants';

interface UseChatInputLogicProps {
    onSendMessage: (text: string, attachments?: File[]) => void;
    disabled?: boolean;
    project: Project | null;
    projectId: string | null;
    userName?: string;
    currentUserId?: number | null;
}

export function useChatInputLogic({
    onSendMessage,
    disabled,
    project,
    projectId,
    userName,
    currentUserId,
}: UseChatInputLogicProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Typing status throttle (10 сек) ---
    const lastTypingSentRef = useRef<number>(0);

    /** Отправить typing в VK (throttle 10 сек) */
    const notifyVkTyping = useCallback(() => {
        if (!projectId || !currentUserId) return;
        const now = Date.now();
        if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return;
        lastTypingSentRef.current = now;
        sendTypingStatus(projectId, currentUserId).catch(() => {
            // Тихо проглатываем — не критично
        });
    }, [projectId, currentUserId]);

    const [text, setText] = useState('');
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [isVariablesOpen, setIsVariablesOpen] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

    // --- Переменные ---
    const [globalVariables, setGlobalVariables] = useState<GlobalVariableDefinition[] | null>(null);
    const [isLoadingGlobalVariables, setIsLoadingGlobalVariables] = useState(false);
    const [projectVariables, setProjectVariables] = useState<{ name: string; value: string }[] | null>(null);
    const [isLoadingProjectVariables, setIsLoadingProjectVariables] = useState(false);

    // --- Промо-переменные ---
    const [promoVariables, setPromoVariables] = useState<PromoVariableInfo[] | null>(null);
    const [isLoadingPromoVariables, setIsLoadingPromoVariables] = useState(false);

    // --- Управление фокусом контейнера (React-стейт, НЕ focus-within) ---
    const [isFocused, setIsFocused] = useState(false);
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    const handleContainerFocus = useCallback(() => {
        clearTimeout(focusTimeoutRef.current);
        setIsFocused(true);
    }, []);

    const handleContainerBlur = useCallback(() => {
        focusTimeoutRef.current = setTimeout(() => {
            setIsFocused(false);
        }, 0);
    }, []);

    useEffect(() => {
        return () => clearTimeout(focusTimeoutRef.current);
    }, []);

    // --- Загрузка глобальных переменных при открытии панели ---
    useEffect(() => {
        if (isVariablesOpen && !globalVariables && projectId) {
            setIsLoadingGlobalVariables(true);
            getGlobalVariablesForProject(projectId)
                .then(({ definitions }) => setGlobalVariables(definitions))
                .catch(() => setGlobalVariables([]))
                .finally(() => setIsLoadingGlobalVariables(false));
        }
    }, [isVariablesOpen, globalVariables, projectId]);

    // --- Загрузка переменных проекта при открытии панели ---
    useEffect(() => {
        if (isVariablesOpen && !projectVariables && projectId) {
            setIsLoadingProjectVariables(true);
            getProjectVariables(projectId)
                .then(vars => setProjectVariables(vars))
                .catch(() => setProjectVariables([]))
                .finally(() => setIsLoadingProjectVariables(false));
        }
    }, [isVariablesOpen, projectVariables, projectId]);

    // --- Загрузка промо-переменных при открытии панели ---
    useEffect(() => {
        if (isVariablesOpen && !promoVariables && projectId) {
            setIsLoadingPromoVariables(true);
            getPromoVariables(projectId)
                .then(vars => setPromoVariables(vars))
                .catch(() => setPromoVariables([]))
                .finally(() => setIsLoadingPromoVariables(false));
        }
    }, [isVariablesOpen, promoVariables, projectId]);

    // --- Undo/Redo через useTextUndoHistory ---
    const { undo, redo, canUndo, canRedo } = useTextUndoHistory({
        text,
        onTextChange: setText,
        textareaRef,
    });

    // --- Вставка текста в позицию курсора ---
    const insertAtCursor = useCallback((value: string) => {
        if (!textareaRef.current) return;
        const { selectionStart, selectionEnd } = textareaRef.current;
        const newText = text.substring(0, selectionStart) + value + text.substring(selectionEnd);
        setText(newText);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newCursorPos = selectionStart + value.length;
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    }, [text]);

    // Вставка переменной
    const handleInsertVariable = useCallback((value: string) => {
        insertAtCursor(value);
    }, [insertAtCursor]);

    // Вставка эмодзи
    const handleInsertEmoji = useCallback((emoji: string) => {
        insertAtCursor(emoji);
    }, [insertAtCursor]);

    // Обёртка выделенного текста
    const wrapSelection = useCallback((prefix: string, suffix: string) => {
        if (!textareaRef.current) return;
        const ta = textareaRef.current;
        const { selectionStart, selectionEnd } = ta;
        const selectedText = text.substring(selectionStart, selectionEnd);

        const newText = text.substring(0, selectionStart) + prefix + selectedText + suffix + text.substring(selectionEnd);
        setText(newText);

        setTimeout(() => {
            ta.focus();
            if (selectedText.length > 0) {
                ta.setSelectionRange(selectionStart + prefix.length, selectionEnd + prefix.length);
            } else {
                const cursorPos = selectionStart + prefix.length;
                ta.setSelectionRange(cursorPos, cursorPos);
            }
        }, 0);
    }, [text]);

    // Вставка ссылки @id
    const handleLink = useCallback(() => {
        wrapSelection('@id (', ')');
    }, [wrapSelection]);

    // --- Отправка сообщения ---
    const handleSend = useCallback(() => {
        const trimmed = text.trim();
        const hasFiles = attachedFiles.length > 0;
        if (!trimmed && !hasFiles) return;

        // Подставляем частную переменную {username} перед отправкой
        let finalText = trimmed;
        if (userName) {
            finalText = finalText.replace(/\{username\}/g, userName);
        }

        const files = hasFiles ? attachedFiles.map(f => f.file) : undefined;
        onSendMessage(finalText, files);
        setText('');
        setAttachedFiles([]);
        setIsEmojiPickerOpen(false);
    }, [text, attachedFiles, userName, onSendMessage]);

    // --- Автозакрытие скобок и кавычек + отправка по Enter ---
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const ta = textareaRef.current;
        if (!ta) return;

        // Enter без Shift — отправка
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
            return;
        }

        const openChar = e.key;
        const closingChar = AUTO_CLOSE_PAIRS[openChar];

        if (closingChar) {
            const { selectionStart, selectionEnd } = ta;
            const selectedText = text.substring(selectionStart, selectionEnd);

            // Перешагивание закрывающего символа для кавычек
            if ((openChar === '"' || openChar === "'") && text[selectionStart] === openChar && selectionStart === selectionEnd) {
                e.preventDefault();
                setTimeout(() => {
                    ta.setSelectionRange(selectionStart + 1, selectionStart + 1);
                }, 0);
                return;
            }

            e.preventDefault();

            if (selectedText.length > 0) {
                // Оборачиваем выделение
                const newText = text.substring(0, selectionStart) + openChar + selectedText + closingChar + text.substring(selectionEnd);
                setText(newText);
                setTimeout(() => {
                    ta.setSelectionRange(selectionStart + 1, selectionEnd + 1);
                }, 0);
            } else {
                // Вставляем пару
                const newText = text.substring(0, selectionStart) + openChar + closingChar + text.substring(selectionEnd);
                setText(newText);
                setTimeout(() => {
                    ta.setSelectionRange(selectionStart + 1, selectionStart + 1);
                }, 0);
            }
            return;
        }

        // Перешагивание закрывающего символа
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

        // Backspace между парных скобок — удаляем оба
        if (e.key === 'Backspace') {
            const { selectionStart, selectionEnd } = ta;
            if (selectionStart === selectionEnd && selectionStart > 0) {
                const charBefore = text[selectionStart - 1];
                const charAfter = text[selectionStart];
                if (AUTO_CLOSE_PAIRS[charBefore] === charAfter) {
                    e.preventDefault();
                    const newText = text.substring(0, selectionStart - 1) + text.substring(selectionStart + 1);
                    setText(newText);
                    setTimeout(() => {
                        ta.setSelectionRange(selectionStart - 1, selectionStart - 1);
                    }, 0);
                    return;
                }
            }
        }
    }, [text, handleSend]);

    // --- Прикрепление файлов ---
    const handleFileSelect = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newAttachments: AttachedFile[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const isPhoto = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            // Всё остальное — документ (pdf, doc, xls, zip и т.д.)
            const fileType: AttachedFile['type'] = isPhoto ? 'photo' : isVideo ? 'video' : 'document';

            newAttachments.push({
                id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                file,
                previewUrl: isPhoto || isVideo ? URL.createObjectURL(file) : '',
                type: fileType,
            });
        }

        setAttachedFiles(prev => [...prev, ...newAttachments]);

        // Сбрасываем input чтобы повторно выбрать тот же файл
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleRemoveFile = useCallback((fileId: string) => {
        setAttachedFiles(prev => {
            const file = prev.find(f => f.id === fileId);
            if (file) URL.revokeObjectURL(file.previewUrl);
            return prev.filter(f => f.id !== fileId);
        });
    }, []);

    // Cleanup URLs при размонтировании
    useEffect(() => {
        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            attachedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
        };
    }, []);

    const charCount = text.length;
    const isOverLimit = charCount > MAX_MESSAGE_LENGTH;
    const canSend = (text.trim().length > 0 || attachedFiles.length > 0) && !isOverLimit && !disabled;

    return {
        state: {
            text,
            isEmojiPickerOpen,
            isVariablesOpen,
            attachedFiles,
            globalVariables,
            isLoadingGlobalVariables,
            projectVariables,
            isLoadingProjectVariables,
            promoVariables,
            isLoadingPromoVariables,
            isFocused,
            canUndo,
            canRedo,
            charCount,
            isOverLimit,
            canSend,
        },
        actions: {
            setText,
            setIsEmojiPickerOpen,
            setIsVariablesOpen,
            insertAtCursor,
            handleInsertVariable,
            handleInsertEmoji,
            handleLink,
            handleSend,
            handleKeyDown,
            handleFileSelect,
            handleFileChange,
            handleRemoveFile,
            handleContainerFocus,
            handleContainerBlur,
            notifyVkTyping,
            undo,
            redo,
        },
        refs: {
            textareaRef,
            fileInputRef,
        },
    };
}
