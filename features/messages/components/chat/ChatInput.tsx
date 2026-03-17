/**
 * ChatInput — поле ввода сообщений для чата.
 * ХАБ-КОНТЕЙНЕР: логика в useChatInputLogic, подкомпоненты вынесены.
 * 
 * Реализовано по паттерну дизайн-системы (CommentTextEditor):
 * - Тулбар: вложения, ссылка @id, emoji, undo/redo
 * - Textarea ~25% высоты viewport с resize-y
 * - Inline emoji-пикер
 * - Переменные (глобальные + проектные + частные {username})
 * - Автозакрытие скобок и кавычек
 * - Счётчик символов (4096)
 * - UI прикрепления фото/видео с превью
 * - Круглая кнопка отправки (самолётик)
 */

import React, { useEffect, useRef } from 'react';
import { Project } from '../../../../shared/types';
import { ChatMessageData } from '../../types';
import { EmojiPicker } from '../../../emoji/components/EmojiPicker';
import { useChatInputLogic } from '../../hooks/chat/useChatInputLogic';
import { MAX_MESSAGE_LENGTH } from './chatInputConstants';
import { ChatInputVariablesBar } from './ChatInputVariablesBar';
import { ChatInputTemplatesBar } from './ChatInputTemplatesBar';
import { ChatInputAttachments } from './ChatInputAttachments';
import { ChatInputToolbar } from './ChatInputToolbar';

interface ChatInputProps {
    /** Колбэк отправки сообщения */
    onSendMessage: (text: string, attachments?: File[]) => void;
    /** Заблокировано ли поле */
    disabled?: boolean;
    /** Объект текущего проекта (для переменных и emoji) */
    project: Project | null;
    /** ID проекта */
    projectId: string | null;
    /** Имя собеседника (для подстановки {username}) */
    userName?: string;
    /** VK user_id текущего собеседника (для typing status) */
    currentUserId?: number | null;
    /** Ожидающий шаблон для вставки/замены (text + key + mode) */
    pendingTemplate?: { text: string; key: number; mode: 'insert' | 'replace' } | null;
    /** Колбэк: сохранить текст как шаблон */
    onSaveAsTemplate?: (text: string) => void;
    /** Сообщение, на которое отвечаем (первое из выбранных) */
    replyToMessage?: ChatMessageData | null;
    /** Все выбранные сообщения */
    selectedMessages?: ChatMessageData[];
    /** Отменить ответ (сбросить все выбранные) */
    onCancelReply?: () => void;
    /** Убрать конкретное сообщение из выбранных */
    onRemoveSelected?: (id: string) => void;
}

/**
 * Поле ввода сообщения с тулбаром, emoji, переменными, вложениями.
 * Высота ~25% viewport по умолчанию, с возможностью ресайза (resize-y).
 */
export const ChatInput: React.FC<ChatInputProps> = ({
    onSendMessage,
    disabled,
    project,
    projectId,
    userName,
    currentUserId,
    pendingTemplate,
    onSaveAsTemplate,
    replyToMessage,
    selectedMessages = [],
    onCancelReply,
    onRemoveSelected,
}) => {
    const { state, actions, refs } = useChatInputLogic({
        onSendMessage,
        disabled,
        project,
        projectId,
        userName,
        currentUserId,
    });

    // --- Вставка шаблона из правой панели ---
    const appliedTemplateKeyRef = useRef<number | null>(null);

    // Сброс ref шаблона при смене диалога
    useEffect(() => {
        appliedTemplateKeyRef.current = null;
    }, [projectId, currentUserId]);

    useEffect(() => {
        if (pendingTemplate && pendingTemplate.key !== appliedTemplateKeyRef.current) {
            appliedTemplateKeyRef.current = pendingTemplate.key;
            if (pendingTemplate.mode === 'insert') {
                // Вставить в конец текущего текста
                const currentText = state.text;
                const separator = currentText && !currentText.endsWith('\n') && !currentText.endsWith(' ') ? '\n' : '';
                actions.setText(currentText + separator + pendingTemplate.text);
            } else {
                // Заменить весь текст
                actions.setText(pendingTemplate.text);
            }
            // Фокус на textarea
            setTimeout(() => refs.textareaRef.current?.focus(), 50);
        }
    }, [pendingTemplate, actions, refs, state.text]);

    return (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
            {/* Превью выбранных сообщений (ответ / пересылка) */}
            {selectedMessages.length > 0 && (
                <div className="mb-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-indigo-600">
                            {selectedMessages.length === 1 ? '↩ Ответ на сообщение' : `↩ Выбрано: ${selectedMessages.length} сообщ.`}
                        </span>
                        {onCancelReply && (
                            <button
                                onClick={onCancelReply}
                                className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                                title="Отменить всё"
                            >
                                ✕ Отменить
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                        {selectedMessages.map(msg => (
                            <div key={msg.id} className="flex items-center gap-2">
                                <div className="flex-shrink-0 w-0.5 h-5 bg-indigo-400 rounded-full" />
                                <p className="flex-1 text-[12px] text-gray-600 truncate">
                                    <span className="font-medium text-indigo-500 mr-1">
                                        {msg.direction === 'incoming' ? (userName || 'Клиент') : 'Вы'}:
                                    </span>
                                    {msg.text || 'Вложение'}
                                </p>
                                {selectedMessages.length > 1 && onRemoveSelected && (
                                    <button
                                        onClick={() => onRemoveSelected(msg.id)}
                                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Убрать"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* Скрытый input для загрузки файлов */}
            <input
                ref={refs.fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv"
                multiple
                onChange={actions.handleFileChange}
                className="hidden"
            />

            {/* Основной контейнер: редактор + кнопка отправки */}
            <div className="flex items-end gap-2">
                {/* Редактор — единый блок (переменные + тулбар + textarea + emoji + счётчик) */}
                <div
                    className={`flex-1 border rounded-lg overflow-hidden ${
                        state.isFocused
                            ? 'border-indigo-500 ring-2 ring-indigo-500'
                            : 'border-gray-300'
                    } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
                    onFocus={actions.handleContainerFocus}
                    onBlur={actions.handleContainerBlur}
                >
                    {/* Превью прикреплённых файлов */}
                    <ChatInputAttachments
                        attachedFiles={state.attachedFiles}
                        onRemoveFile={actions.handleRemoveFile}
                    />

                    {/* Аккордеон переменных — раскрывается над тулбаром */}
                    <ChatInputVariablesBar
                        userName={userName}
                        projectId={projectId}
                        project={project}
                        isVariablesOpen={state.isVariablesOpen}
                        globalVariables={state.globalVariables}
                        isLoadingGlobalVariables={state.isLoadingGlobalVariables}
                        projectVariables={state.projectVariables}
                        isLoadingProjectVariables={state.isLoadingProjectVariables}
                        promoVariables={state.promoVariables}
                        isLoadingPromoVariables={state.isLoadingPromoVariables}
                        onToggleVariables={() => actions.setIsVariablesOpen(prev => !prev)}
                        onInsertAtCursor={actions.insertAtCursor}
                        onInsertVariable={actions.handleInsertVariable}
                    />

                    {/* Аккордеон шаблонов — раскрывается над тулбаром */}
                    <ChatInputTemplatesBar
                        isTemplatesOpen={state.isTemplatesOpen}
                        templates={state.templates}
                        isLoading={state.isLoadingTemplates}
                        userName={userName}
                        currentUserId={currentUserId}
                        onPreview={state.previewTemplate}
                        onInsertTemplate={(text) => {
                            // Вставить в конец текущего текста
                            const currentText = state.text;
                            const separator = currentText && !currentText.endsWith('\n') && !currentText.endsWith(' ') ? '\n' : '';
                            actions.setText(currentText + separator + text);
                        }}
                        onReplaceTemplate={(text) => {
                            actions.setText(text);
                        }}
                    />

                    {/* Тулбар (📎, 🔗, 😊, Переменные, undo/redo) — кнопка переменных здесь, всегда на месте */}
                    <ChatInputToolbar
                        disabled={disabled}
                        isEmojiPickerOpen={state.isEmojiPickerOpen}
                        isVariablesOpen={state.isVariablesOpen}
                        isTemplatesOpen={state.isTemplatesOpen}
                        hasProject={!!projectId}
                        hasTemplates={state.templates.length > 0}
                        canUndo={state.canUndo}
                        canRedo={state.canRedo}
                        onFileSelect={actions.handleFileSelect}
                        onLink={actions.handleLink}
                        onToggleEmoji={() => actions.setIsEmojiPickerOpen(prev => !prev)}
                        onToggleVariables={() => {
                            actions.setIsVariablesOpen(prev => {
                                if (!prev) actions.setIsTemplatesOpen(false);
                                return !prev;
                            });
                        }}
                        onToggleTemplates={() => {
                            actions.setIsTemplatesOpen(prev => {
                                if (!prev) actions.setIsVariablesOpen(false);
                                return !prev;
                            });
                        }}
                        onUndo={actions.undo}
                        onRedo={actions.redo}
                    />

                    {/* Textarea — ~25% viewport, resize-y */}
                    <textarea
                        ref={refs.textareaRef}
                        value={state.text}
                        onChange={e => { actions.setText(e.target.value); actions.notifyVkTyping(); }}
                        onFocus={actions.notifyVkTyping}
                        onKeyDown={actions.handleKeyDown}
                        onPaste={actions.handlePaste}
                        rows={state.isEmojiPickerOpen ? 3 : 4}
                        className="w-full p-2.5 text-sm text-gray-800 bg-white resize-y border-0 outline-none focus:ring-0 focus:outline-none custom-scrollbar"
                        placeholder="Написать сообщение..."
                        disabled={disabled}
                        style={{
                            minHeight: '60px',
                            height: state.isEmojiPickerOpen ? '10vh' : '17vh',
                            maxHeight: '35vh',
                        }}
                    />

                    {/* Inline Emoji Picker */}
                    {state.isEmojiPickerOpen && projectId && (
                        <EmojiPicker
                            projectId={projectId}
                            onSelectEmoji={actions.handleInsertEmoji}
                            variant="inline"
                        />
                    )}

                    {/* Счётчик символов + подсказка */}
                    <div className="flex items-center justify-between px-2.5 py-1 bg-gray-50 border-t border-gray-200">
                        <span className="text-[11px] text-gray-300">
                            Enter — отправить, Shift+Enter — новая строка
                        </span>
                        <span className={`text-xs tabular-nums ${state.isOverLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                            {state.charCount}/{MAX_MESSAGE_LENGTH}
                        </span>
                    </div>
                </div>

                {/* Круглая кнопка отправки (самолётик) */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                        onClick={actions.handleSend}
                        disabled={!state.canSend}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                            state.canSend
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        title="Отправить"
                    >
                        {/* Иконка самолётика */}
                        <svg className="w-5 h-5 -rotate-45" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                    {/* Кнопка «Сохранить как шаблон» */}
                    {onSaveAsTemplate && state.text.trim().length > 0 && (
                        <button
                            onClick={() => onSaveAsTemplate(state.text.trim())}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 active:scale-95"
                            title="Сохранить как шаблон"
                        >
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

