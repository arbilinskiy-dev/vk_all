/**
 * Тулбар ChatInput: вложения, ссылка @id, emoji, переменные, undo/redo.
 */

import React from 'react';
import { TOOLBAR_BTN_CLASS, TOOLBAR_BTN_DISABLED_CLASS } from './chatInputConstants';

interface ChatInputToolbarProps {
    disabled?: boolean;
    isEmojiPickerOpen: boolean;
    isVariablesOpen?: boolean;
    hasProject?: boolean;
    canUndo: boolean;
    canRedo: boolean;
    onFileSelect: () => void;
    onLink: () => void;
    onToggleEmoji: () => void;
    onToggleVariables?: () => void;
    onUndo: () => void;
    onRedo: () => void;
}

export const ChatInputToolbar: React.FC<ChatInputToolbarProps> = ({
    disabled,
    isEmojiPickerOpen,
    isVariablesOpen,
    hasProject,
    canUndo,
    canRedo,
    onFileSelect,
    onLink,
    onToggleEmoji,
    onToggleVariables,
    onUndo,
    onRedo,
}) => {
    return (
        <div className="flex items-center gap-0.5 px-2 py-1 bg-gray-50 border-b border-gray-200">
            {/* Вложения */}
            <button
                type="button"
                onClick={onFileSelect}
                title="Прикрепить фото или видео"
                className={TOOLBAR_BTN_CLASS}
                disabled={disabled}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
            </button>

            <div className="w-px h-4 bg-gray-300 mx-1" />

            {/* Ссылка @id */}
            <button
                type="button"
                onClick={onLink}
                title="Упоминание @id (текст)"
                className={TOOLBAR_BTN_CLASS}
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            </button>

            <div className="w-px h-4 bg-gray-300 mx-1" />

            {/* Эмодзи */}
            <button
                type="button"
                onClick={onToggleEmoji}
                title="Эмодзи"
                className={`${TOOLBAR_BTN_CLASS} ${isEmojiPickerOpen ? '!bg-indigo-100 !text-indigo-600' : ''}`}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>

            {/* Переменные */}
            {hasProject && onToggleVariables && (
                <>
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <button
                        type="button"
                        onClick={onToggleVariables}
                        title="Переменные для подстановки"
                        className={`${TOOLBAR_BTN_CLASS} inline-flex items-center gap-1 !px-1.5 ${isVariablesOpen ? '!bg-indigo-100 !text-indigo-600' : ''}`}
                    >
                        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isVariablesOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-[11px] font-medium">Переменные</span>
                    </button>
                </>
            )}

            {/* Пружина */}
            <div className="flex-1" />

            {/* Undo */}
            <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                title="Отменить (Ctrl+Z)"
                className={canUndo ? TOOLBAR_BTN_CLASS : TOOLBAR_BTN_DISABLED_CLASS}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
                </svg>
            </button>
            {/* Redo */}
            <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                title="Повторить (Ctrl+Shift+Z)"
                className={canRedo ? TOOLBAR_BTN_CLASS : TOOLBAR_BTN_DISABLED_CLASS}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" />
                </svg>
            </button>
        </div>
    );
};
