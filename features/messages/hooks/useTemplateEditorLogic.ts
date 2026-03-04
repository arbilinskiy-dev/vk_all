/**
 * useTemplateEditorLogic — хук с бизнес-логикой inline-редактора шаблонов.
 * Извлечён из TemplateInlineEditor.tsx (декомпозиция).
 *
 * Содержит: стейт полей, загрузку переменных, предпросмотр с дебаунсом,
 * вставку в курсор, валидацию и сохранение.
 */

import { useState, useCallback, useRef, useEffect, type Dispatch, type SetStateAction, type RefObject } from 'react';
import {
    MessageTemplate,
    MessageTemplateCreate,
    MessageTemplateUpdate,
} from '../../../services/api/message_template.api';
import { GlobalVariableDefinition } from '../../../shared/types';
import { getGlobalVariablesForProject } from '../../../services/api/global_variable.api';
import { getProjectVariables } from '../../../services/api/project.api';
import { getPromoVariables, PromoVariableInfo } from '../../../services/api/promo_lists.api';
import { MAX_MESSAGE_LENGTH } from '../components/chat/chatInputConstants';

// ─── Параметры хука ───

interface UseTemplateEditorLogicParams {
    /** null = создание, объект = редактирование */
    template: MessageTemplate | null;
    /** Начальный текст (для «Сохранить как шаблон» из чата) */
    initialText?: string;
    /** Имя собеседника (для {username}) */
    userName?: string;
    /** ID проекта */
    projectId: string | null;
    /** VK user_id собеседника */
    currentUserId?: number | null;
    /** Сохранить шаблон */
    onSave: (data: MessageTemplateCreate | MessageTemplateUpdate) => Promise<void>;
    /** Предпросмотр текста (бэкенд API) */
    onPreview: (text: string, userId?: number) => Promise<string>;
}

// ─── Возвращаемый тип ───

interface TemplateEditorState {
    name: string;
    text: string;
    error: string | null;
    isVariablesOpen: boolean;
    globalVariables: GlobalVariableDefinition[] | null;
    isLoadingGlobalVariables: boolean;
    projectVariables: { name: string; value: string }[] | null;
    isLoadingProjectVariables: boolean;
    promoVariables: PromoVariableInfo[] | null;
    isLoadingPromoVariables: boolean;
    showPreview: boolean;
    previewText: string;
    isPreviewLoading: boolean;
    charCount: number;
    isEdit: boolean;
}

interface TemplateEditorActions {
    setName: Dispatch<SetStateAction<string>>;
    setText: Dispatch<SetStateAction<string>>;
    setIsVariablesOpen: Dispatch<SetStateAction<boolean>>;
    setShowPreview: Dispatch<SetStateAction<boolean>>;
    insertAtCursor: (value: string) => void;
    handleSave: () => Promise<void>;
}

interface TemplateEditorRefs {
    nameInputRef: RefObject<HTMLInputElement>;
    textareaRef: RefObject<HTMLTextAreaElement>;
}

export interface UseTemplateEditorLogicReturn {
    state: TemplateEditorState;
    actions: TemplateEditorActions;
    refs: TemplateEditorRefs;
}

// ─── Хук ───

export function useTemplateEditorLogic({
    template,
    initialText,
    userName,
    projectId,
    currentUserId,
    onSave,
    onPreview,
}: UseTemplateEditorLogicParams): UseTemplateEditorLogicReturn {
    const isEdit = !!template;

    // --- Основные поля ---
    const [name, setName] = useState(template?.name || '');
    const [text, setText] = useState(template?.text || initialText || '');
    const [error, setError] = useState<string | null>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // --- Переменные ---
    const [isVariablesOpen, setIsVariablesOpen] = useState(false);
    const [globalVariables, setGlobalVariables] = useState<GlobalVariableDefinition[] | null>(null);
    const [isLoadingGlobalVariables, setIsLoadingGlobalVariables] = useState(false);
    const [projectVariables, setProjectVariables] = useState<{ name: string; value: string }[] | null>(null);
    const [isLoadingProjectVariables, setIsLoadingProjectVariables] = useState(false);

    // --- Промо-переменные ---
    const [promoVariables, setPromoVariables] = useState<PromoVariableInfo[] | null>(null);
    const [isLoadingPromoVariables, setIsLoadingPromoVariables] = useState(false);

    // --- Предпросмотр ---
    const [showPreview, setShowPreview] = useState(false);
    const [previewText, setPreviewText] = useState('');
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    // Фокус на название при открытии
    useEffect(() => {
        setTimeout(() => nameInputRef.current?.focus(), 100);
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

    // --- Загрузка проектных переменных при открытии панели ---
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

    // --- Обновление предпросмотра при изменении текста / открытии (дебаунс 400ms) ---
    useEffect(() => {
        if (!showPreview || !text.trim()) {
            setPreviewText('');
            return;
        }
        const timer = setTimeout(async () => {
            setIsPreviewLoading(true);
            try {
                // Подставляем {username} на клиенте ДО отправки на сервер,
                // чтобы бэкенд не заменял на заглушку [Имя пользователя]
                let textForPreview = text;
                if (userName) {
                    textForPreview = textForPreview.replace(/\{username\}/g, userName);
                }
                const result = await onPreview(textForPreview, currentUserId || undefined);
                setPreviewText(result);
            } catch {
                let fallback = text;
                if (userName) {
                    fallback = fallback.replace(/\{username\}/g, userName);
                }
                setPreviewText(fallback);
            } finally {
                setIsPreviewLoading(false);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [showPreview, text, onPreview, userName, currentUserId]);

    // --- Вставка в позицию курсора ---
    const insertAtCursor = useCallback((value: string) => {
        if (!textareaRef.current) {
            setText(prev => prev + value);
            return;
        }
        const ta = textareaRef.current;
        const { selectionStart, selectionEnd } = ta;
        const newText = text.substring(0, selectionStart) + value + text.substring(selectionEnd);
        setText(newText);
        setTimeout(() => {
            ta.focus();
            const newPos = selectionStart + value.length;
            ta.setSelectionRange(newPos, newPos);
        }, 0);
    }, [text]);

    // --- Сохранение ---
    const handleSave = useCallback(async () => {
        if (!name.trim()) {
            setError('Укажите название шаблона');
            nameInputRef.current?.focus();
            return;
        }
        if (!text.trim()) {
            setError('Текст шаблона не может быть пустым');
            return;
        }
        setError(null);
        try {
            if (isEdit && template) {
                const updateData: MessageTemplateUpdate = {};
                if (name !== template.name) updateData.name = name.trim();
                if (text !== template.text) updateData.text = text;
                await onSave(updateData);
            } else {
                await onSave({
                    name: name.trim(),
                    text: text,
                    attachments: null,
                    sort_order: 0,
                });
            }
        } catch {
            setError('Не удалось сохранить шаблон');
        }
    }, [name, text, isEdit, template, onSave]);

    // --- Вычисляемое ---
    const charCount = text.length;

    // ─── Return ───
    return {
        state: {
            name,
            text,
            error,
            isVariablesOpen,
            globalVariables,
            isLoadingGlobalVariables,
            projectVariables,
            isLoadingProjectVariables,
            promoVariables,
            isLoadingPromoVariables,
            showPreview,
            previewText,
            isPreviewLoading,
            charCount,
            isEdit,
        },
        actions: {
            setName,
            setText,
            setIsVariablesOpen,
            setShowPreview,
            insertAtCursor,
            handleSave,
        },
        refs: {
            nameInputRef,
            textareaRef,
        },
    };
}
