/**
 * TemplateInlineEditor — inline-форма создания/редактирования шаблона.
 * Встроена в TemplatesTab вместо модального окна.
 * Включает: название, текстовое поле, панель переменных (ChatInputVariablesBar),
 * аккордион предпросмотра с реальной подстановкой переменных.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MessageTemplate, MessageTemplateCreate, MessageTemplateUpdate } from '../../../../services/api/message_template.api';
import { GlobalVariableDefinition, Project } from '../../../../shared/types';
import { getGlobalVariablesForProject } from '../../../../services/api/global_variable.api';
import { getProjectVariables } from '../../../../services/api/project.api';
import { getPromoVariables, PromoVariableInfo } from '../../../../services/api/promo_lists.api';
import { VariablesSelector } from '../../../posts/components/VariablesSelector';
import { MESSAGE_SPECIFIC_VARIABLES, MAX_MESSAGE_LENGTH } from '../../components/chat/chatInputConstants';

interface TemplateInlineEditorProps {
    /** null = создание, объект = редактирование */
    template: MessageTemplate | null;
    /** Начальный текст (для «Сохранить как шаблон» из чата) */
    initialText?: string;
    /** Имя собеседника (для {username}) */
    userName?: string;
    /** ID проекта */
    projectId: string | null;
    /** Объект проекта (для VariablesSelector) */
    project: Project | null;
    /** VK user_id собеседника */
    currentUserId?: number | null;
    /** Идёт сохранение */
    isSaving: boolean;
    /** Сохранить */
    onSave: (data: MessageTemplateCreate | MessageTemplateUpdate) => Promise<void>;
    /** Отмена (назад) */
    onCancel: () => void;
    /** Предпросмотр текста (бэкенд API) */
    onPreview: (text: string, userId?: number) => Promise<string>;
}

export const TemplateInlineEditor: React.FC<TemplateInlineEditorProps> = ({
    template,
    initialText,
    userName,
    projectId,
    project,
    currentUserId,
    isSaving,
    onSave,
    onCancel,
    onPreview,
}) => {
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

    // --- Загрузка переменных при открытии панели ---
    useEffect(() => {
        if (isVariablesOpen && !globalVariables && projectId) {
            setIsLoadingGlobalVariables(true);
            getGlobalVariablesForProject(projectId)
                .then(({ definitions }) => setGlobalVariables(definitions))
                .catch(() => setGlobalVariables([]))
                .finally(() => setIsLoadingGlobalVariables(false));
        }
    }, [isVariablesOpen, globalVariables, projectId]);

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

    // --- Обновление предпросмотра при изменении текста / открытии ---
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

    const charCount = text.length;

    return (
        <div className="flex flex-col">
            {/* Ошибка */}
            {error && (
                <div className="mx-4 mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                    {error}
                </div>
            )}

            {/* Название шаблона */}
            <div className="px-4 pt-4 pb-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Название</label>
                <input
                    ref={nameInputRef}
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Например: Оставьте отзыв"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    maxLength={100}
                />
            </div>

            {/* Текст шаблона */}
            <div className="px-4 pb-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Текст сообщения</label>

                {/* Панель переменных — pill-кнопки */}
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                    {/* Частные переменные */}
                    <div className="flex items-center gap-1.5 flex-wrap px-2.5 py-1.5 bg-gray-50 border-b border-gray-200">
                        <span className="text-[11px] text-gray-400 mr-1">Переменные:</span>
                        {MESSAGE_SPECIFIC_VARIABLES.map(v => (
                            <button
                                key={v.value}
                                type="button"
                                onClick={() => insertAtCursor(v.value)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
                                title={v.description}
                            >
                                {v.name}
                            </button>
                        ))}
                        {projectId && (
                            <button
                                type="button"
                                onClick={() => setIsVariablesOpen(prev => !prev)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                                    isVariablesOpen
                                        ? 'bg-indigo-100 border border-indigo-300 text-indigo-700'
                                        : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200'
                                }`}
                                title="Глобальные и проектные переменные"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Ещё переменные
                            </button>
                        )}
                    </div>

                    {/* Аккордион VariablesSelector */}
                    <div className={`overflow-hidden transition-all duration-200 ${isVariablesOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        {projectId && (
                            <div className="px-2.5 py-2 bg-gray-50 border-b border-gray-200">
                                <VariablesSelector
                                    isLoading={isLoadingProjectVariables}
                                    variables={projectVariables}
                                    isLoadingGlobalVariables={isLoadingGlobalVariables}
                                    globalVariables={globalVariables}
                                    project={project}
                                    onInsert={insertAtCursor}
                                    onEditVariables={() => {}}
                                    promoVariables={promoVariables}
                                    isLoadingPromoVariables={isLoadingPromoVariables}
                                />
                            </div>
                        )}
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Здравствуйте, {username}! Спасибо за обращение..."
                        className="w-full px-2.5 py-2 text-sm text-gray-800 bg-white resize-y border-0 outline-none focus:ring-0 focus:outline-none custom-scrollbar"
                        style={{ minHeight: '100px', height: '15vh', maxHeight: '30vh' }}
                        maxLength={MAX_MESSAGE_LENGTH}
                    />

                    {/* Счётчик символов */}
                    <div className="flex items-center justify-between px-2.5 py-1 bg-gray-50 border-t border-gray-200">
                        <span className="text-[11px] text-gray-300">
                            Переменные подставятся при отправке
                        </span>
                        <span className={`text-xs tabular-nums ${charCount > MAX_MESSAGE_LENGTH ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                            {charCount}/{MAX_MESSAGE_LENGTH}
                        </span>
                    </div>
                </div>
            </div>

            {/* Аккордион предпросмотра */}
            <div className="px-4 pb-2">
                <button
                    type="button"
                    onClick={() => setShowPreview(prev => !prev)}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors py-1"
                >
                    <svg className={`w-4 h-4 transition-transform duration-200 ${showPreview ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    {showPreview ? 'Скрыть предпросмотр' : 'Показать предпросмотр'}
                </button>

                {showPreview && (
                    <div className="mt-2 border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 animate-fade-in">
                        <div className="flex items-center gap-1.5 mb-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="text-xs font-medium text-gray-600">Как увидит пользователь</span>
                            {isPreviewLoading && (
                                <div className="loader h-3 w-3 border border-gray-300 border-t-indigo-600 ml-1"></div>
                            )}
                        </div>
                        {previewText ? (
                            <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed bg-white rounded p-2.5 border border-gray-200">
                                {previewText}
                            </div>
                        ) : !text.trim() ? (
                            <p className="text-xs text-gray-400 italic">Введите текст шаблона для предпросмотра</p>
                        ) : null}

                        {/* Расшифровка переменных */}
                        {text.trim() && (text.includes('{username}') || text.match(/\{global_/) || text.match(/\{promo_/)) && (
                            <div className="mt-2 flex flex-col gap-1">
                                {userName && text.includes('{username}') && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <code className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[11px] font-mono">{'{username}'}</code>
                                        <span className="text-gray-400">→</span>
                                        <span className="text-gray-700 font-medium">{userName}</span>
                                    </div>
                                )}
                                {text.match(/\{global_[^}]+\}/g)?.map((v, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                        <code className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[11px] font-mono">{v}</code>
                                        <span className="text-gray-400">→</span>
                                        <span className="text-gray-500 italic text-[11px]">подставится из БД</span>
                                    </div>
                                ))}
                                {text.match(/\{promo_[^}]+\}/g)?.map((v, i) => {
                                    // Извлекаем slug из переменной: {promo_<slug>_code} или {promo_<slug>_description}
                                    const slugMatch = v.match(/\{promo_(\w+?)_(code|description)\}/);
                                    const slug = slugMatch?.[1];
                                    const varType = slugMatch?.[2];
                                    const promoInfo = slug && promoVariables
                                        ? promoVariables.find(p => p.slug === slug)
                                        : null;

                                    return (
                                        <div key={`promo-${i}`} className="flex items-center gap-2 text-xs">
                                            <code className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[11px] font-mono">{v}</code>
                                            <span className="text-gray-400">→</span>
                                            {promoInfo ? (
                                                <span className="text-amber-700 text-[11px]">
                                                    {varType === 'code' ? '🎫' : '📝'} {promoInfo.list_name}
                                                    <span className={`ml-1 ${promoInfo.free_count > 0 ? 'text-emerald-600' : 'text-red-500 font-semibold'}`}>
                                                        ({promoInfo.free_count > 0 ? `свободных: ${promoInfo.free_count}` : 'нет свободных!'})
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-amber-600 italic text-[11px]">промокод при отправке</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Кнопки: Сохранить / Отмена */}
            <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50 mt-2">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Отмена
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving || !name.trim() || !text.trim()}
                    className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                    {isSaving ? (
                        <>
                            <div className="loader h-3.5 w-3.5 border border-white border-t-transparent"></div>
                            Сохранение...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Сохранить
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
