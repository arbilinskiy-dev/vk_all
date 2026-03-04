/**
 * TemplatePreviewSection — аккордион предпросмотра шаблона.
 * Извлечён из TemplateInlineEditor для декомпозиции.
 *
 * Включает:
 * - Кнопка toggle предпросмотра
 * - Текст превью (previewText)
 * - Спиннер при загрузке
 * - Расшифровка переменных: {username}→имя, {global_*}→из БД, {promo_*}→промо с free_count
 */

import React from 'react';
import { PromoVariableInfo } from '../../../../services/api/promo_lists.api';

interface TemplatePreviewSectionProps {
    /** Оригинальный текст шаблона (для разбора переменных) */
    text: string;
    /** Открыт ли предпросмотр */
    showPreview: boolean;
    /** Toggle предпросмотра */
    onTogglePreview: () => void;
    /** Результат предпросмотра (с подставленными переменными) */
    previewText: string;
    /** Загружается ли предпросмотр */
    isPreviewLoading: boolean;
    /** Имя пользователя (для расшифровки {username}) */
    userName?: string;
    /** Промо-переменные (для расшифровки {promo_*}) */
    promoVariables: PromoVariableInfo[] | null;
}

export const TemplatePreviewSection: React.FC<TemplatePreviewSectionProps> = ({
    text,
    showPreview,
    onTogglePreview,
    previewText,
    isPreviewLoading,
    userName,
    promoVariables,
}) => {
    return (
        <div className="px-4 pb-2">
            <button
                type="button"
                onClick={onTogglePreview}
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
    );
};
