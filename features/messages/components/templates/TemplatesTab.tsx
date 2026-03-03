/**
 * TemplatesTab — вкладка «Шаблоны» в правой панели сообщений.
 * Всё inline: список, создание/редактирование, предпросмотр (аккордеон), удаление.
 * Нет модальных окон — переключение режимов (list / create / edit).
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MessageTemplate, MessageTemplateCreate, MessageTemplateUpdate } from '../../../../services/api/message_template.api';
import { getPromoVariables, PromoVariableInfo } from '../../../../services/api/promo_lists.api';
import { useMessageTemplates } from '../../hooks/useMessageTemplates';
import { TemplateInlineEditor } from './TemplateInlineEditor';
import { Project } from '../../../../shared/types';

interface TemplatesTabProps {
    /** ID проекта */
    projectId: string | null;
    /** Объект проекта (для переменных) */
    project: Project | null;
    /** Вставить/заменить шаблон в поле ввода чата */
    onApplyTemplate: (template: MessageTemplate, mode: 'insert' | 'replace') => void;
    /** Имя собеседника (для {username} в предпросмотре) */
    userName?: string;
    /** VK user_id собеседника (для серверного предпросмотра) */
    currentUserId?: number | null;
    /** Текст из чата для «Сохранить как шаблон» */
    saveAsTemplateText?: string | null;
    /** Сбросить текст «Сохранить как шаблон» после открытия редактора */
    onClearSaveAsTemplate?: () => void;
}

/** Режим работы панели */
type TabMode = 'list' | 'create' | 'edit';

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
    projectId,
    project,
    onApplyTemplate,
    userName,
    currentUserId,
    saveAsTemplateText,
    onClearSaveAsTemplate,
}) => {
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



    // --- Загрузка ---
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center py-8">
                <div className="loader h-5 w-5 border-2 border-gray-300 border-t-indigo-600"></div>
                <span className="text-xs text-gray-400 ml-2">Загрузка шаблонов...</span>
            </div>
        );
    }

    // --- Ошибка ---
    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-xs text-red-400 text-center">{error}</p>
            </div>
        );
    }

    // =============================================
    // Режим: Создание / Редактирование (inline)
    // =============================================
    if (mode === 'create' || mode === 'edit') {
        return (
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Шапка с кнопкой «Назад» */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                    <button
                        onClick={handleBack}
                        className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Назад к списку"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="text-xs font-semibold text-gray-700">
                        {mode === 'edit' ? 'Редактирование шаблона' : 'Новый шаблон'}
                    </span>
                </div>
                {/* Форма редактора */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <TemplateInlineEditor
                        template={editingTemplate}
                        initialText={editorInitialText}
                        userName={userName}
                        projectId={projectId}
                        project={project}
                        currentUserId={currentUserId}
                        isSaving={isSaving}
                        onSave={handleSave}
                        onCancel={handleBack}
                        onPreview={preview}
                    />
                </div>
            </div>
        );
    }

    // =============================================
    // Режим: Список шаблонов (по умолчанию)
    // =============================================
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Шапка: поиск + создание */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Поиск шаблонов..."
                        className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    />
                    <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Создать
                </button>
            </div>

            {/* Список шаблонов */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredTemplates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6">
                        <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-400 text-center mb-1">
                            {searchQuery ? 'Шаблоны не найдены' : 'Нет шаблонов'}
                        </p>
                        {!searchQuery && (
                            <p className="text-xs text-gray-300 text-center">
                                Создайте первый шаблон для быстрых ответов
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 p-3">
                        {filteredTemplates.map(template => (
                            <div key={template.id} className="relative border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all duration-150 group">
                                <div className="p-3">
                                    {/* Шапка: название + hover-кнопки */}
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="font-medium text-sm text-gray-800 truncate">{template.name}</span>
                                        </div>
                                        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                                            <button onClick={() => handleEdit(template)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Редактировать">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => setDeletingId(template.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Удалить">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Превью текста шаблона (исходный, переменные объяснены бейджами ниже) */}
                                    <p className="text-xs text-gray-500 leading-relaxed mb-2 whitespace-pre-line">
                                        {template.text.length > 120
                                            ? template.text.substring(0, 120) + '...'
                                            : template.text}
                                    </p>

                                    {/* Кнопки */}
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleTogglePreview(template)}
                                            className={`text-[11px] transition-colors flex items-center gap-1 ${
                                                previewingId === template.id
                                                    ? 'text-indigo-600 font-medium'
                                                    : 'text-gray-500 hover:text-indigo-600'
                                            }`}
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            {previewingId === template.id ? 'Скрыть' : 'Превью'}
                                        </button>
                                        <button
                                            onClick={() => onApplyTemplate(template, 'insert')}
                                            className="text-[11px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                                            title="Добавить в конец текста в чате"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                            Вставить
                                        </button>
                                        <button
                                            onClick={() => onApplyTemplate(template, 'replace')}
                                            className="text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                                            title="Заменить весь текст в чате"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Заменить
                                        </button>
                                    </div>
                                </div>

                                {/* Inline превью-аккордеон */}
                                {previewingId === template.id && (
                                    <div className="border-t border-indigo-100 bg-indigo-50/30 px-3 py-2.5 animate-fade-in">
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Как увидит пользователь</span>
                                        {previewLoadingIds.has(template.id) ? (
                                            <div className="flex items-center gap-2 py-3 justify-center">
                                                <div className="loader h-3 w-3 border-2 border-gray-300 border-t-indigo-600"></div>
                                                <span className="text-[11px] text-gray-400">Подстановка...</span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed mt-1.5 bg-white border border-indigo-100 rounded-md p-2">
                                                {previewTexts[template.id] || ''}
                                            </p>
                                        )}
                                        {/* Расшифровка переменных */}
                                        {(template.text.includes('{username}') || template.text.match(/\{global_[^}]+\}/) || template.text.match(/\{promo_[^}]+\}/)) && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {userName && template.text.includes('{username}') && (
                                                    <span className="text-[10px] text-indigo-600">
                                                        <code className="px-1 py-0.5 bg-indigo-50 rounded font-mono">{'{username}'}</code> → {userName}
                                                    </span>
                                                )}
                                                {template.text.match(/\{global_[^}]+\}/g)?.map((v, i) => (
                                                    <span key={i} className="text-[10px] text-emerald-600">
                                                        <code className="px-1 py-0.5 bg-emerald-50 rounded font-mono">{v}</code> → из БД
                                                    </span>
                                                ))}
                                                {template.text.match(/\{promo_(\w+?)_(code|description)\}/g)?.map((v, i) => {
                                                    const m = v.match(/\{promo_(\w+?)_(code|description)\}/);
                                                    const slug = m?.[1];
                                                    const varType = m?.[2];
                                                    const info = slug && promoVariables ? promoVariables.find(p => p.slug === slug) : null;
                                                    return (
                                                        <span key={`promo-${i}`} className="text-[10px] text-amber-600">
                                                            <code className="px-1 py-0.5 bg-amber-50 rounded font-mono">{v}</code> →{' '}
                                                            {info ? (
                                                                <>
                                                                    {varType === 'code' ? '🎫' : '📝'} {info.list_name}{' '}
                                                                    <span className={info.free_count > 0 ? 'text-emerald-600' : 'text-red-500 font-semibold'}>
                                                                        ({info.free_count > 0 ? `свободных: ${info.free_count}` : 'нет свободных!'})
                                                                    </span>
                                                                </>
                                                            ) : 'промокод'}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Inline подтверждение удаления */}
                                {deletingId === template.id && (
                                    <div className="border-t border-red-100 bg-red-50 px-3 py-2.5 rounded-b-lg animate-fade-in">
                                        <div className="flex items-center justify-end gap-2">
                                            <p className="text-xs text-red-600 mr-auto">
                                                Удалить «{template.name}»?
                                            </p>
                                            <button
                                                onClick={() => setDeletingId(null)}
                                                className="px-3 py-1 text-xs text-gray-600 hover:bg-red-100 rounded-md transition-colors"
                                            >
                                                Отмена
                                            </button>
                                            <button
                                                onClick={() => handleDelete(template.id)}
                                                disabled={isDeleting}
                                                className="px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                            >
                                                {isDeleting ? (
                                                    <div className="loader h-3 w-3 border border-white border-t-transparent"></div>
                                                ) : 'Удалить'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
