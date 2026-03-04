/**
 * TemplateInlineEditor — inline-форма создания/редактирования шаблона.
 * Тонкий хаб: логика в useTemplateEditorLogic,
 * подкомпоненты — TemplateVariablesBar и TemplatePreviewSection.
 */

import React from 'react';
import { MessageTemplate, MessageTemplateCreate, MessageTemplateUpdate } from '../../../../services/api/message_template.api';
import { Project } from '../../../../shared/types';
import { useTemplateEditorLogic } from '../../hooks/useTemplateEditorLogic';
import { TemplateVariablesBar } from './TemplateVariablesBar';
import { TemplatePreviewSection } from './TemplatePreviewSection';

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
    const { state, actions, refs } = useTemplateEditorLogic({
        template,
        initialText,
        userName,
        projectId,
        currentUserId,
        onSave,
        onPreview,
    });

    return (
        <div className="flex flex-col">
            {/* Ошибка */}
            {state.error && (
                <div className="mx-4 mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                    {state.error}
                </div>
            )}

            {/* Название шаблона */}
            <div className="px-4 pt-4 pb-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Название</label>
                <input
                    ref={refs.nameInputRef}
                    type="text"
                    value={state.name}
                    onChange={e => actions.setName(e.target.value)}
                    placeholder="Например: Оставьте отзыв"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    maxLength={100}
                />
            </div>

            {/* Текст шаблона + панель переменных */}
            <TemplateVariablesBar
                text={state.text}
                onTextChange={actions.setText}
                isVariablesOpen={state.isVariablesOpen}
                onToggleVariables={() => actions.setIsVariablesOpen(prev => !prev)}
                globalVariables={state.globalVariables}
                isLoadingGlobalVariables={state.isLoadingGlobalVariables}
                projectVariables={state.projectVariables}
                isLoadingProjectVariables={state.isLoadingProjectVariables}
                promoVariables={state.promoVariables}
                isLoadingPromoVariables={state.isLoadingPromoVariables}
                insertAtCursor={actions.insertAtCursor}
                charCount={state.charCount}
                textareaRef={refs.textareaRef}
                projectId={projectId}
                project={project}
            />

            {/* Аккордион предпросмотра */}
            <TemplatePreviewSection
                text={state.text}
                showPreview={state.showPreview}
                onTogglePreview={() => actions.setShowPreview(prev => !prev)}
                previewText={state.previewText}
                isPreviewLoading={state.isPreviewLoading}
                userName={userName}
                promoVariables={state.promoVariables}
            />

            {/* Кнопки: Сохранить / Отмена */}
            <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50 mt-2">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Отмена
                </button>
                <button
                    onClick={actions.handleSave}
                    disabled={isSaving || !state.name.trim() || !state.text.trim()}
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
