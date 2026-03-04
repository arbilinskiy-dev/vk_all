/**
 * TemplateVariablesBar — панель переменных + textarea для текста шаблона.
 * Извлечён из TemplateInlineEditor для декомпозиции.
 *
 * Включает:
 * - Pill-кнопки MESSAGE_SPECIFIC_VARIABLES ({username})
 * - Кнопка «Ещё переменные» (toggle isVariablesOpen)
 * - Аккордион с VariablesSelector (глобальные, проектные, промо переменные)
 * - Textarea для текста шаблона
 * - Счётчик символов
 */

import React from 'react';
import { GlobalVariableDefinition, Project } from '../../../../shared/types';
import { PromoVariableInfo } from '../../../../services/api/promo_lists.api';
import { VariablesSelector } from '../../../posts/components/VariablesSelector';
import { MESSAGE_SPECIFIC_VARIABLES, MAX_MESSAGE_LENGTH } from '../chat/chatInputConstants';

interface TemplateVariablesBarProps {
    /** Текст шаблона */
    text: string;
    /** Колбэк изменения текста */
    onTextChange: (text: string) => void;
    /** Открыт ли аккордион дополнительных переменных */
    isVariablesOpen: boolean;
    /** Toggle аккордиона переменных */
    onToggleVariables: () => void;
    /** Глобальные переменные проекта */
    globalVariables: GlobalVariableDefinition[] | null;
    /** Загружаются ли глобальные переменные */
    isLoadingGlobalVariables: boolean;
    /** Проектные переменные */
    projectVariables: { name: string; value: string }[] | null;
    /** Загружаются ли проектные переменные */
    isLoadingProjectVariables: boolean;
    /** Промо-переменные */
    promoVariables: PromoVariableInfo[] | null;
    /** Загружаются ли промо-переменные */
    isLoadingPromoVariables: boolean;
    /** Вставить переменную в позицию курсора */
    insertAtCursor: (variable: string) => void;
    /** Текущее количество символов */
    charCount: number;
    /** Ref на textarea (для управления курсором извне) */
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    /** ID проекта (null → скрывает кнопку «Ещё переменные») */
    projectId: string | null;
    /** Объект проекта (для VariablesSelector) */
    project: Project | null;
}

export const TemplateVariablesBar: React.FC<TemplateVariablesBarProps> = ({
    text,
    onTextChange,
    isVariablesOpen,
    onToggleVariables,
    globalVariables,
    isLoadingGlobalVariables,
    projectVariables,
    isLoadingProjectVariables,
    promoVariables,
    isLoadingPromoVariables,
    insertAtCursor,
    charCount,
    textareaRef,
    projectId,
    project,
}) => {
    return (
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
                            onClick={onToggleVariables}
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
                    onChange={e => onTextChange(e.target.value)}
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
    );
};
