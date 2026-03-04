/**
 * useTemplatesTabLogic — вся бизнес-логика вкладки «Шаблоны».
 * Извлечена из TemplatesTab.tsx для декомпозиции.
 * Компонент остаётся «тонким» — только JSX + вызов этого хука.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MessageTemplate, MessageTemplateCreate, MessageTemplateUpdate } from '../../../services/api/message_template.api';
import { getPromoVariables, PromoVariableInfo } from '../../../services/api/promo_lists.api';
import { useMessageTemplates } from './useMessageTemplates';

// ─── Типы параметров хука ───

export interface UseTemplatesTabLogicParams {
    /** ID проекта */
    projectId: string | null;
    /** Имя собеседника (для {username} в предпросмотре) */
    userName?: string;
    /** VK user_id собеседника (для серверного предпросмотра) */
    currentUserId?: number | null;
    /** Текст из чата для «Сохранить как шаблон» */
    saveAsTemplateText?: string | null;
    /** Сбросить текст «Сохранить как шаблон» после открытия редактора */
    onClearSaveAsTemplate?: () => void;
}

// ─── Типы возвращаемого значения ───

/** Режим работы панели */
export type TabMode = 'list' | 'create' | 'edit';

export interface TemplatesTabState {
    /** Все шаблоны (из useMessageTemplates) */
    templates: MessageTemplate[];
    /** Отфильтрованные шаблоны (по searchQuery) */
    filteredTemplates: MessageTemplate[];
    /** Флаг загрузки шаблонов */
    isLoading: boolean;
    /** Ошибка загрузки */
    error: string | null;
    /** Флаг сохранения */
    isSaving: boolean;
    /** Текущий режим панели */
    mode: TabMode;
    /** Строка поиска */
    searchQuery: string;
    /** Шаблон, который сейчас редактируется */
    editingTemplate: MessageTemplate | null;
    /** ID шаблона с открытым превью (аккордеон) */
    previewingId: string | null;
    /** Кеш текстов превью по ID шаблона */
    previewTexts: Record<string, string>;
    /** ID шаблонов, для которых превью загружается */
    previewLoadingIds: Set<string>;
    /** Информация о промо-переменных */
    promoVariables: PromoVariableInfo[] | null;
    /** ID шаблона, для которого показан диалог удаления */
    deletingId: string | null;
    /** Флаг процесса удаления */
    isDeleting: boolean;
    /** Начальный текст для редактора (при «Сохранить как шаблон») */
    editorInitialText: string | undefined;
    /** ID шаблонов с раскрытым полным текстом */
    expandedTextIds: Set<string>;
}

export interface TemplatesTabActions {
    /** Перейти в режим создания шаблона */
    handleCreate: () => void;
    /** Перейти в режим редактирования шаблона */
    handleEdit: (template: MessageTemplate) => void;
    /** Вернуться к списку */
    handleBack: () => void;
    /** Сохранить шаблон (создание или обновление) */
    handleSave: (data: MessageTemplateCreate | MessageTemplateUpdate) => Promise<void>;
    /** Удалить шаблон */
    handleDelete: (templateId: string) => Promise<void>;
    /** Тоггл превью-аккордеона */
    handleTogglePreview: (template: MessageTemplate) => Promise<void>;
    /** Установить строку поиска */
    setSearchQuery: (q: string) => void;
    /** Установить ID шаблона для диалога удаления */
    setDeletingId: (id: string | null) => void;
    /** Установить набор раскрытых текстов */
    setExpandedTextIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    /** Получить список промо-списков без свободных кодов для текста шаблона */
    getEmptyPromoLists: (templateText: string) => string[];
    /** Превью текста шаблона (из useMessageTemplates) */
    preview: (text: string, userId?: number) => Promise<string>;
}

// ─── Хук ───

export function useTemplatesTabLogic({
    projectId,
    userName,
    currentUserId,
    saveAsTemplateText,
    onClearSaveAsTemplate,
}: UseTemplatesTabLogicParams): { state: TemplatesTabState; actions: TemplatesTabActions } {
    const {
        templates,
        isLoading,
        error,
        isSaving,
        create,
        update,
        remove,
        preview,
    } = useMessageTemplates({ projectId });

    // --- Состояние UI ---
    const [mode, setMode] = useState<TabMode>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
    /** ID шаблона с раскрытым превью (аккордеон, null = все свёрнуты) */
    const [previewingId, setPreviewingId] = useState<string | null>(null);
    const [previewTexts, setPreviewTexts] = useState<Record<string, string>>({});
    const [previewLoadingIds, setPreviewLoadingIds] = useState<Set<string>>(new Set());

    // --- Промо-переменные для расшифровки ---
    const [promoVariables, setPromoVariables] = useState<PromoVariableInfo[] | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editorInitialText, setEditorInitialText] = useState<string | undefined>(undefined);
    /** ID шаблонов с раскрытым полным текстом */
    const [expandedTextIds, setExpandedTextIds] = useState<Set<string>>(new Set());

    // --- Загрузка промо-переменных при наличии промо в шаблонах ---
    useEffect(() => {
        if (!projectId || promoVariables) return;
        const hasPromo = templates.some(t => t.text.includes('{promo_'));
        if (hasPromo) {
            getPromoVariables(projectId)
                .then(vars => setPromoVariables(vars))
                .catch(() => setPromoVariables([]));
        }
    }, [projectId, templates, promoVariables]);

    // --- Обработка «Сохранить как шаблон» из чата ---
    useEffect(() => {
        if (saveAsTemplateText) {
            setEditingTemplate(null);
            setEditorInitialText(saveAsTemplateText);
            setMode('create');
            onClearSaveAsTemplate?.();
        }
    }, [saveAsTemplateText, onClearSaveAsTemplate]);

    // --- Фильтрация шаблонов ---
    const filteredTemplates = useMemo(() => {
        if (!searchQuery.trim()) return templates;
        const q = searchQuery.toLowerCase();
        return templates.filter(t =>
            t.name.toLowerCase().includes(q) || t.text.toLowerCase().includes(q)
        );
    }, [templates, searchQuery]);

    /**
     * Проверяет, заблокирован ли шаблон из-за исчерпанных промокодов.
     * Возвращает список названий списков промо без свободных кодов, или пустой массив.
     */
    const getEmptyPromoLists = useCallback((templateText: string): string[] => {
        if (!promoVariables || promoVariables.length === 0) return [];
        const matches = templateText.match(/\{promo_(\w+?)_(code|description)\}/g);
        if (!matches) return [];
        const emptyNames: string[] = [];
        const checkedSlugs = new Set<string>();
        for (const v of matches) {
            const m = v.match(/\{promo_(\w+?)_(code|description)\}/);
            const slug = m?.[1];
            if (!slug || checkedSlugs.has(slug)) continue;
            checkedSlugs.add(slug);
            const info = promoVariables.find(p => p.slug === slug);
            if (info && info.free_count === 0) {
                emptyNames.push(info.list_name);
            }
        }
        return emptyNames;
    }, [promoVariables]);

    // --- Обработчики ---
    const handleCreate = useCallback(() => {
        setEditingTemplate(null);
        setEditorInitialText(undefined);
        setMode('create');
    }, []);

    const handleEdit = useCallback((template: MessageTemplate) => {
        setEditingTemplate(template);
        setEditorInitialText(undefined);
        setMode('edit');
    }, []);

    const handleBack = useCallback(() => {
        setMode('list');
        setEditingTemplate(null);
        setEditorInitialText(undefined);
    }, []);

    const handleSave = useCallback(async (data: MessageTemplateCreate | MessageTemplateUpdate) => {
        if (editingTemplate) {
            await update(editingTemplate.id, data as MessageTemplateUpdate);
            // Сбрасываем кеш превью для обновлённого шаблона
            setPreviewTexts(prev => {
                const next = { ...prev };
                delete next[editingTemplate.id];
                return next;
            });
        } else {
            await create(data as MessageTemplateCreate);
        }
        setMode('list');
        setEditingTemplate(null);
        setEditorInitialText(undefined);
    }, [editingTemplate, create, update]);

    const handleDelete = useCallback(async (templateId: string) => {
        setIsDeleting(true);
        try {
            await remove(templateId);
        } catch {
            // ошибка обработана в хуке
        } finally {
            setIsDeleting(false);
            setDeletingId(null);
        }
    }, [remove]);

    /** Тоггл превью-аккордеона под карточкой */
    const handleTogglePreview = useCallback(async (template: MessageTemplate) => {
        // Если уже открыт — сворачиваем
        if (previewingId === template.id) {
            setPreviewingId(null);
            return;
        }
        setPreviewingId(template.id);

        // Подгружаем промо-переменные при первом открытии превью
        if (!promoVariables && projectId && template.text.includes('{promo_')) {
            getPromoVariables(projectId)
                .then(vars => setPromoVariables(vars))
                .catch(() => setPromoVariables([]));
        }
        // Всегда запрашиваем свежее превью (не кешируем — данные переменных могут измениться)
        setPreviewLoadingIds(prev => new Set(prev).add(template.id));
        try {
            let textForPreview = template.text;
            if (userName) {
                textForPreview = textForPreview.replace(/\{username\}/g, userName);
            }
            const result = await preview(textForPreview, currentUserId || undefined);
            setPreviewTexts(prev => ({ ...prev, [template.id]: result }));
        } catch {
            let fallback = template.text;
            if (userName) {
                fallback = fallback.replace(/\{username\}/g, userName);
            }
            setPreviewTexts(prev => ({ ...prev, [template.id]: fallback }));
        } finally {
            setPreviewLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(template.id);
                return next;
            });
        }
    }, [previewingId, preview, currentUserId, userName, promoVariables, projectId]);

    // ─── Return ───
    return {
        state: {
            templates,
            filteredTemplates,
            isLoading,
            error,
            isSaving,
            mode,
            searchQuery,
            editingTemplate,
            previewingId,
            previewTexts,
            previewLoadingIds,
            promoVariables,
            deletingId,
            isDeleting,
            editorInitialText,
            expandedTextIds,
        },
        actions: {
            handleCreate,
            handleEdit,
            handleBack,
            handleSave,
            handleDelete,
            handleTogglePreview,
            setSearchQuery,
            setDeletingId,
            setExpandedTextIds,
            getEmptyPromoLists,
            preview,
        },
    };
}
