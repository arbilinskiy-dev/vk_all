import React from 'react';

/** Общий стиль кнопки тулбара */
const toolbarBtnClass = "p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors";
const toolbarBtnDisabledClass = "p-1.5 rounded text-gray-300 cursor-default";

interface TextEditorToolbarProps {
    /** Вставка VK-ссылки */
    onLink: () => void;
    /** Переключение эмодзи-пикера */
    onToggleEmoji: () => void;
    isEmojiPickerOpen: boolean;
    /** Undo/Redo */
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export const TextEditorToolbar: React.FC<TextEditorToolbarProps> = ({
    onLink,
    onToggleEmoji,
    isEmojiPickerOpen,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}) => {
    return (
        <div className="flex items-center gap-0.5 px-2 py-1 bg-gray-50 border-b border-gray-200">
            {/* Ссылка @ */}
            <button type="button" onClick={onLink} title="Упоминание @id (текст)" className={toolbarBtnClass}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </button>

            {/* Разделитель */}
            <div className="w-px h-4 bg-gray-300 mx-1" />

            {/* Эмодзи — переключатель inline-панели */}
            <button
                type="button"
                onClick={onToggleEmoji}
                title="Эмодзи"
                className={`${toolbarBtnClass} ${isEmojiPickerOpen ? '!bg-indigo-100 !text-indigo-600' : ''}`}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>

            {/* Пружина — отодвигает undo/redo вправо */}
            <div className="flex-1" />

            {/* Undo */}
            <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                title="Отменить (Ctrl+Z)"
                className={canUndo ? toolbarBtnClass : toolbarBtnDisabledClass}
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
                className={canRedo ? toolbarBtnClass : toolbarBtnDisabledClass}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" />
                </svg>
            </button>
        </div>
    );
};
