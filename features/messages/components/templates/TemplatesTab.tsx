/**
 * TemplatesTab — вкладка «Шаблоны» в правой панели сообщений.
 * Тонкий хаб: логика в useTemplatesTabLogic, карточка шаблона — в TemplateCard.
 */

import React from 'react';
import { MessageTemplate } from '../../../../services/api/message_template.api';
import { useTemplatesTabLogic } from '../../hooks/useTemplatesTabLogic';
import { TemplateInlineEditor } from './TemplateInlineEditor';
import { TemplateCard } from './TemplateCard';
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

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
    projectId,
    project,
    onApplyTemplate,
    userName,
    currentUserId,
    saveAsTemplateText,
    onClearSaveAsTemplate,
}) => {
    const { state, actions } = useTemplatesTabLogic({
        projectId,
        userName,
        currentUserId,
        saveAsTemplateText,
        onClearSaveAsTemplate,
    });

    // --- Загрузка ---
    if (state.isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center py-8">
                <div className="loader h-5 w-5 border-2 border-gray-300 border-t-indigo-600"></div>
                <span className="text-xs text-gray-400 ml-2">Загрузка шаблонов...</span>
            </div>
        );
    }

    // --- Ошибка ---
    if (state.error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-xs text-red-400 text-center">{state.error}</p>
            </div>
        );
    }

    // =============================================
    // Режим: Создание / Редактирование (inline)
    // =============================================
    if (state.mode === 'create' || state.mode === 'edit') {
        return (
            <>
                {/* Шапка с кнопкой «Назад» — sticky внутри родительского scroll-контейнера */}
                <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                    <button
                        onClick={actions.handleBack}
                        className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Назад к списку"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="text-xs font-semibold text-gray-700">
                        {state.mode === 'edit' ? 'Редактирование шаблона' : 'Новый шаблон'}
                    </span>
                </div>
                {/* Форма редактора — контент скроллируется родителем */}
                <TemplateInlineEditor
                    template={state.editingTemplate}
                    initialText={state.editorInitialText}
                    userName={userName}
                    projectId={projectId}
                    project={project}
                    currentUserId={currentUserId}
                    isSaving={state.isSaving}
                    onSave={actions.handleSave}
                    onCancel={actions.handleBack}
                    onPreview={actions.preview}
                />
            </>
        );
    }

    // =============================================
    // Режим: Список шаблонов (по умолчанию)
    // =============================================
    return (
        <>
            {/* Шапка: поиск + создание — sticky внутри родительского scroll-контейнера */}
            <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={state.searchQuery}
                        onChange={e => actions.setSearchQuery(e.target.value)}
                        placeholder="Поиск шаблонов..."
                        className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    />
                    <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <button
                    onClick={actions.handleCreate}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Создать
                </button>
            </div>

            {/* Список шаблонов — контент скроллируется родителем */}
            {state.filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                    <svg className="w-12 h-12 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-400 text-center mb-1">
                        {state.searchQuery ? 'Шаблоны не найдены' : 'Нет шаблонов'}
                    </p>
                    {!state.searchQuery && (
                        <p className="text-xs text-gray-300 text-center">
                            Создайте первый шаблон для быстрых ответов
                        </p>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-2 p-3">
                    {state.filteredTemplates.map(template => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            previewingId={state.previewingId}
                            previewTexts={state.previewTexts}
                            previewLoadingIds={state.previewLoadingIds}
                            promoVariables={state.promoVariables}
                            expandedTextIds={state.expandedTextIds}
                            deletingId={state.deletingId}
                            isDeleting={state.isDeleting}
                            userName={userName}
                            getEmptyPromoLists={actions.getEmptyPromoLists}
                            onApplyTemplate={onApplyTemplate}
                            onEdit={actions.handleEdit}
                            onDelete={actions.handleDelete}
                            onTogglePreview={actions.handleTogglePreview}
                            onSetDeletingId={actions.setDeletingId}
                            onToggleExpandText={(id) => {
                                actions.setExpandedTextIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(id)) { next.delete(id); } else { next.add(id); }
                                    return next;
                                });
                            }}
                        />
                    ))}
                </div>
            )}
        </>
    );
};
