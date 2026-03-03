import React from 'react';
import { Project, GlobalVariableDefinition } from '../../../../shared/types';
import { AccordionSectionKey } from '../../../projects/components/modals/ProjectSettingsModal';

import { usePostTextLogic } from '../../hooks/usePostTextLogic';
import { MAX_TEXT_LENGTH } from './postTextConstants';
import { TextEditorToolbar } from './TextEditorToolbar';
import { VariablesSelector } from '../VariablesSelector';
import { EmojiPicker } from '../../../emoji/components/EmojiPicker';

interface PostTextSectionProps {
    mode: 'view' | 'edit' | 'copy';
    postText: string;
    editedText: string;
    onTextChange: (text: string) => void;
    projectId: string;
    allProjects: Project[];
    // Переменные
    showVariables: boolean;
    onToggleVariables: () => void;
    onReloadVariables: () => void;
    variables: { name: string; value: string }[] | null;
    isLoadingVariables: boolean;
    globalVariables: GlobalVariableDefinition[] | null;
    isLoadingGlobalVariables: boolean;
    // Открытие настроек проекта (управляется родителем)
    onOpenProjectSettings?: (section: AccordionSectionKey | null) => void;
}

export const PostTextSection: React.FC<PostTextSectionProps> = ({
    mode,
    postText,
    editedText,
    onTextChange,
    projectId,
    allProjects,
    // Переменные
    showVariables,
    onToggleVariables,
    onReloadVariables,
    variables,
    isLoadingVariables,
    globalVariables,
    isLoadingGlobalVariables,
    // Настройки проекта
    onOpenProjectSettings,
}) => {
    const { state, actions } = usePostTextLogic({ editedText, onTextChange, projectId, allProjects });

    // Блок управления переменными (только кнопки обновления и настройки)
    const variablesControls = (
        <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Переменные</span>
            <button type="button" onClick={onReloadVariables} disabled={isLoadingVariables} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:cursor-wait transition-colors">
                {isLoadingVariables ? <div className="loader h-3 w-3 border-2 border-gray-400 border-t-indigo-500"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" /></svg>}
                Обновить
            </button>
            <button type="button" onClick={() => onOpenProjectSettings?.('variables')} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Настроить
            </button>
        </div>
    );

    return (
        <>
            <div className="relative">
                {/* --- ПАНЕЛЬ ИНСТРУМЕНТОВ: переменные --- */}
                {mode === 'edit' && (
                    <div className="flex justify-end items-center mb-1 gap-2 flex-wrap">
                        {variablesControls}
                    </div>
                )}

                {/* --- БЛОК ПЕРЕМЕННЫХ (всегда виден) --- */}
                {mode === 'edit' && (
                    <div className="mt-1">
                        <div className="bg-gray-100 border rounded-md p-3">
                            <VariablesSelector 
                                isLoading={isLoadingVariables} 
                                variables={variables} 
                                isLoadingGlobalVariables={isLoadingGlobalVariables}
                                globalVariables={globalVariables}
                                project={state.currentProject} 
                                onInsert={actions.handleInsertVariable} 
                                onEditVariables={() => onOpenProjectSettings?.('variables')} 
                            />
                        </div>
                    </div>
                )}


                {/* --- ОСНОВНОЕ ТЕКСТОВОЕ ПОЛЕ --- */}
                {mode === 'edit' ? (
                    <div className="mt-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Текст поста</label>
                        {/* Контейнер: тулбар + textarea + счётчик — как единый блок */}
                        <div
                            className={`border rounded-lg overflow-hidden ${
                                state.isFocused
                                    ? 'border-indigo-500 ring-2 ring-indigo-500'
                                    : 'border-gray-300'
                            }`}
                            onFocus={actions.handleContainerFocus}
                            onBlur={actions.handleContainerBlur}
                        >
                            {/* === ТУЛБАР ФОРМАТИРОВАНИЯ === */}
                            <TextEditorToolbar
                                onLink={actions.handleLink}
                                onToggleEmoji={actions.toggleEmojiPicker}
                                isEmojiPickerOpen={state.isEmojiPickerOpen}
                                onUndo={actions.undo}
                                onRedo={actions.redo}
                                canUndo={state.canUndo}
                                canRedo={state.canRedo}
                            />

                            {/* === TEXTAREA === */}
                            <textarea
                                ref={state.textareaRef}
                                value={editedText}
                                onChange={e => onTextChange(e.target.value)}
                                onKeyDown={actions.handleKeyDown}
                                rows={state.isEmojiPickerOpen ? 6 : 12}
                                className="w-full p-2.5 text-sm text-gray-800 bg-white resize-y border-0 outline-none focus:ring-0 focus:outline-none custom-scrollbar"
                                placeholder="Введите текст..."
                            />

                            {/* === INLINE EMOJI PICKER === */}
                            {state.isEmojiPickerOpen && (
                                <EmojiPicker
                                    projectId={projectId}
                                    onSelectEmoji={actions.handleInsertEmoji}
                                    variant="inline"
                                />
                            )}

                            {/* === СЧЁТЧИК СИМВОЛОВ === */}
                            <div className="flex items-center justify-end px-2.5 py-1 bg-gray-50 border-t border-gray-200">
                                <span className={`text-xs tabular-nums ${state.isOverLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                                    {state.charCount}/{MAX_TEXT_LENGTH}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Текст публикации</label>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 p-2 rounded-md min-h-[100px]">{postText || <span className="text-gray-400 italic">Текст отсутствует</span>}</p>
                    </>
                )}
            </div>
        </>
    );
};