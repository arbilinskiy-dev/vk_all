/**
 * TemplateCard — карточка одного шаблона сообщений.
 * Включает: заголовок, раскрывающийся текст, кнопки действий,
 * предупреждение о пустых промо-списках, превью-аккордеон с расшифровкой переменных,
 * и inline-подтверждение удаления.
 */

import React, { useRef } from 'react';
import { MessageTemplate } from '../../../../services/api/message_template.api';
import { PromoVariableInfo } from '../../../../services/api/promo_lists.api';

export interface TemplateCardProps {
    /** Данные шаблона */
    template: MessageTemplate;
    /** ID шаблона с раскрытым превью (null = все свёрнуты) */
    previewingId: string | null;
    /** Кешированные тексты превью по ID шаблона */
    previewTexts: Record<string, string>;
    /** Множество ID шаблонов, для которых загружается превью */
    previewLoadingIds: Set<string>;
    /** Информация о промо-переменных (для расшифровки и блокировки) */
    promoVariables: PromoVariableInfo[] | null;
    /** Множество ID шаблонов с раскрытым полным текстом */
    expandedTextIds: Set<string>;
    /** ID шаблона, для которого показано подтверждение удаления */
    deletingId: string | null;
    /** Удаление в процессе */
    isDeleting: boolean;
    /** Имя собеседника (для {username} в превью) */
    userName?: string;
    /** Возвращает список промо-списков без свободных кодов в тексте шаблона */
    getEmptyPromoLists: (text: string) => string[];
    /** Вставить / заменить шаблон в поле ввода чата */
    onApplyTemplate: (template: MessageTemplate, mode: 'insert' | 'replace') => void;
    /** Перейти в режим редактирования */
    onEdit: (template: MessageTemplate) => void;
    /** Удалить шаблон */
    onDelete: (templateId: string) => void;
    /** Тоггл превью-аккордеона */
    onTogglePreview: (template: MessageTemplate) => void;
    /** Установить/сбросить ID шаблона для подтверждения удаления */
    onSetDeletingId: (id: string | null) => void;
    /** Тоггл раскрытия полного текста шаблона */
    onToggleExpandText: (id: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
    template,
    previewingId,
    previewTexts,
    previewLoadingIds,
    promoVariables,
    expandedTextIds,
    deletingId,
    isDeleting,
    userName,
    getEmptyPromoLists,
    onApplyTemplate,
    onEdit,
    onDelete,
    onTogglePreview,
    onSetDeletingId,
    onToggleExpandText,
}) => {
    /** Локальный ref для измерения высоты текста (плавная анимация раскрытия) */
    const textRef = useRef<HTMLParagraphElement | null>(null);

    return (
        <div className="relative border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all duration-150 group">
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
                        <button onClick={() => onEdit(template)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Редактировать">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button onClick={() => onSetDeletingId(template.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Удалить">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Превью текста шаблона с плавным раскрытием по клику */}
                {(() => {
                    const isLong = template.text.length > 120;
                    const isExpanded = expandedTextIds.has(template.id);
                    const measuredH = textRef.current?.scrollHeight || 0;
                    // ~2.6em для 2 строк text-xs leading-relaxed
                    const collapsedH = 34;
                    return (
                        <div
                            onClick={(e) => {
                                if (isLong) {
                                    e.stopPropagation();
                                    onToggleExpandText(template.id);
                                }
                            }}
                            className={`group/text ${isLong ? 'cursor-pointer' : ''}`}
                        >
                            <div
                                className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                                style={{ maxHeight: isExpanded ? (measuredH || 1000) : (isLong ? collapsedH : undefined) }}
                            >
                                <p
                                    ref={textRef}
                                    className="text-xs text-gray-500 leading-relaxed whitespace-pre-line"
                                >
                                    {template.text}
                                </p>
                            </div>
                            {isLong && (
                                <span className="text-[10px] text-indigo-600/70 font-medium group-hover/text:text-indigo-800 transition-colors mt-0.5 inline-flex items-center gap-0.5">
                                    {isExpanded ? '▲ Свернуть' : '▼ Показать полностью...'}
                                </span>
                            )}
                        </div>
                    );
                })()}
                <div className="mb-2" />

                {/* Кнопки действий + предупреждение промо-блокировки */}
                {(() => {
                    const emptyPromos = getEmptyPromoLists(template.text);
                    const isPromoBlocked = emptyPromos.length > 0;
                    return (
                        <>
                            {/* Предупреждение: промокоды закончились */}
                            {isPromoBlocked && (
                                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-red-50 border border-red-200 rounded-md mb-2">
                                    <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <span className="text-[10px] text-red-600 leading-tight">
                                        Нет свободных промокодов: {emptyPromos.join(', ')}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => onTogglePreview(template)}
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
                                    disabled={isPromoBlocked}
                                    className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                                        isPromoBlocked
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'text-white bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                                    title={isPromoBlocked ? `Нет свободных промокодов: ${emptyPromos.join(', ')}` : 'Добавить в конец текста в чате'}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Вставить
                                </button>
                                <button
                                    onClick={() => onApplyTemplate(template, 'replace')}
                                    disabled={isPromoBlocked}
                                    className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                                        isPromoBlocked
                                            ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                            : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                                    }`}
                                    title={isPromoBlocked ? `Нет свободных промокодов: ${emptyPromos.join(', ')}` : 'Заменить весь текст в чате'}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Заменить
                                </button>
                            </div>
                        </>
                    );
                })()}
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
                            onClick={() => onSetDeletingId(null)}
                            className="px-3 py-1 text-xs text-gray-600 hover:bg-red-100 rounded-md transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={() => onDelete(template.id)}
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
    );
};
