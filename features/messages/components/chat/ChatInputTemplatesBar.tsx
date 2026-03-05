/**
 * Панель шаблонов для ChatInput:
 * - Аккордеон (аналогично ChatInputVariablesBar)
 * - Поиск по шаблонам
 * - Предпросмотр шаблона (серверная подстановка переменных)
 * - Клик по шаблону → вставка/замена текста в поле ввода
 */

import React, { useState, useMemo, useCallback } from 'react';
import { MessageTemplate } from '../../../../services/api/message_template.api';

interface ChatInputTemplatesBarProps {
    /** Открыт ли аккордеон шаблонов */
    isTemplatesOpen: boolean;
    /** Список шаблонов */
    templates: MessageTemplate[];
    /** Загрузка шаблонов */
    isLoading: boolean;
    /** Имя собеседника (для отображения подстановки {username}) */
    userName?: string;
    /** VK user_id текущего собеседника (для серверного предпросмотра) */
    currentUserId?: number | null;
    /** Функция серверного предпросмотра (из useMessageTemplates) */
    onPreview?: (text: string, userId?: number) => Promise<string>;
    /** Вставить текст шаблона в позицию курсора */
    onInsertTemplate: (text: string) => void;
    /** Заменить весь текст шаблоном */
    onReplaceTemplate: (text: string) => void;
}

export const ChatInputTemplatesBar: React.FC<ChatInputTemplatesBarProps> = ({
    isTemplatesOpen,
    templates,
    isLoading,
    userName,
    currentUserId,
    onPreview,
    onInsertTemplate,
    onReplaceTemplate,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    /** ID шаблона с открытым превью */
    const [previewingId, setPreviewingId] = useState<string | null>(null);
    /** Кеш текстов превью по ID */
    const [previewTexts, setPreviewTexts] = useState<Record<string, string>>({});
    /** ID шаблонов, для которых превью загружается */
    const [previewLoadingIds, setPreviewLoadingIds] = useState<Set<string>>(new Set());

    // Фильтрация шаблонов по поиску
    const filteredTemplates = useMemo(() => {
        if (!searchQuery.trim()) return templates;
        const q = searchQuery.toLowerCase();
        return templates.filter(
            t => t.name.toLowerCase().includes(q) || t.text.toLowerCase().includes(q)
        );
    }, [templates, searchQuery]);

    /** Подставить {username} в текст для отображения превью */
    const resolveVariables = (text: string) => {
        if (!userName) return text;
        return text.replace(/\{username\}/g, userName);
    };

    /** Тоггл превью с серверной подстановкой переменных */
    const handleTogglePreview = useCallback(async (template: MessageTemplate) => {
        if (previewingId === template.id) {
            setPreviewingId(null);
            return;
        }
        setPreviewingId(template.id);

        // Запрашиваем серверный превью
        if (onPreview) {
            setPreviewLoadingIds(prev => new Set(prev).add(template.id));
            try {
                let textForPreview = template.text;
                if (userName) {
                    textForPreview = textForPreview.replace(/\{username\}/g, userName);
                }
                const result = await onPreview(textForPreview, currentUserId || undefined);
                setPreviewTexts(prev => ({ ...prev, [template.id]: result }));
            } catch {
                // Фолбек на локальную подстановку
                setPreviewTexts(prev => ({ ...prev, [template.id]: resolveVariables(template.text) }));
            } finally {
                setPreviewLoadingIds(prev => {
                    const next = new Set(prev);
                    next.delete(template.id);
                    return next;
                });
            }
        } else {
            // Без серверного превью — локальная подстановка
            setPreviewTexts(prev => ({ ...prev, [template.id]: resolveVariables(template.text) }));
        }
    }, [previewingId, onPreview, userName, currentUserId]);

    return (
        <div
            className={`transition-all duration-200 ${
                isTemplatesOpen ? 'max-h-[40vh] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
            }`}
        >
            <div className="px-2.5 py-2 bg-gray-50 border-b border-gray-200 flex flex-col gap-2 max-h-[40vh] overflow-hidden">
                {/* Поиск */}
                <div className="relative flex-shrink-0">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Поиск шаблонов..."
                        className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors bg-white"
                    />
                    <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Загрузка */}
                {isLoading && (
                    <div className="flex items-center justify-center py-3">
                        <div className="loader h-4 w-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
                        <span className="text-[11px] text-gray-400 ml-2">Загрузка шаблонов...</span>
                    </div>
                )}

                {/* Список шаблонов */}
                {!isLoading && (
                    <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar max-h-[40vh]">
                        {filteredTemplates.length === 0 ? (
                            <div className="flex flex-col items-center py-4 px-2">
                                <svg className="w-8 h-8 text-gray-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-[11px] text-gray-400 text-center">
                                    {searchQuery ? 'Шаблоны не найдены' : 'Нет шаблонов'}
                                </p>
                            </div>
                        ) : (
                            filteredTemplates.map(template => (
                                <TemplateQuickCard
                                    key={template.id}
                                    template={template}
                                    resolvedPreview={resolveVariables(template.text)}
                                    isPreviewOpen={previewingId === template.id}
                                    previewText={previewTexts[template.id]}
                                    isPreviewLoading={previewLoadingIds.has(template.id)}
                                    onTogglePreview={() => handleTogglePreview(template)}
                                    onInsert={() => onInsertTemplate(template.text)}
                                    onReplace={() => onReplaceTemplate(template.text)}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Быстрая карточка шаблона (компактная) ───

interface TemplateQuickCardProps {
    template: MessageTemplate;
    resolvedPreview: string;
    isPreviewOpen: boolean;
    previewText?: string;
    isPreviewLoading: boolean;
    onTogglePreview: () => void;
    onInsert: () => void;
    onReplace: () => void;
}

const TemplateQuickCard: React.FC<TemplateQuickCardProps> = ({
    template,
    resolvedPreview,
    isPreviewOpen,
    previewText,
    isPreviewLoading,
    onTogglePreview,
    onInsert,
    onReplace,
}) => {
    // Обрезаем для превью
    const shortText = resolvedPreview.length > 100
        ? resolvedPreview.substring(0, 100) + '...'
        : resolvedPreview;

    return (
        <div className="rounded-md border border-gray-200 hover:border-indigo-300 transition-all duration-150">
            <div className="group flex items-start gap-2 p-2 cursor-default">
                {/* Иконка + текст */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <svg className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-800 truncate">{template.name}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 whitespace-pre-line">
                        {shortText}
                    </p>
                </div>
                {/* Кнопки в один ряд: глаз + вставить + заменить */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                    <button
                        type="button"
                        onClick={onTogglePreview}
                        className={`p-1 rounded transition-colors ${
                            isPreviewOpen
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                        title={isPreviewOpen ? 'Скрыть предпросмотр' : 'Предпросмотр сообщения'}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={onInsert}
                        className="px-2 py-0.5 text-[10px] font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
                        title="Вставить в конец текста"
                    >
                        Вставить
                    </button>
                    <button
                        type="button"
                        onClick={onReplace}
                        className="px-2 py-0.5 text-[10px] font-medium rounded bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors whitespace-nowrap"
                        title="Заменить весь текст"
                    >
                        Заменить
                    </button>
                </div>
            </div>

            {/* Блок предпросмотра — как увидит пользователь */}
            {isPreviewOpen && (
                <div className="border-t border-indigo-100 bg-indigo-50/30 px-2.5 py-2 animate-fade-in">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Как увидит пользователь</span>
                    {isPreviewLoading ? (
                        <div className="flex items-center gap-2 py-2 justify-center">
                            <div className="loader h-3 w-3 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
                            <span className="text-[11px] text-gray-400">Подстановка...</span>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed mt-1 bg-white border border-indigo-100 rounded-md p-2">
                            {previewText || resolvedPreview}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
