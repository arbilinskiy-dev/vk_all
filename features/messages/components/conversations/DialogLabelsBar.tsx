/**
 * DialogLabelsBar — горизонтальная полоса меток (ярлыков) диалогов в сайдбаре.
 * Показывает все метки проекта в виде чипов, позволяет фильтровать диалоги по метке,
 * создавать / редактировать / удалять метки (inline).
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DialogLabel } from '../../../../services/api/dialog_labels.api';
import { ConfirmationModal } from '../../../../shared/components/modals/ConfirmationModal';
import { plural } from '../../../../shared/utils/plural';

/** Палитра цветов для меток — 8 вариантов, совместимых с дизайн-системой */
const LABEL_COLORS = [
    '#6366f1', // indigo (primary)
    '#10b981', // emerald
    '#ef4444', // red
    '#3b82f6', // blue
    '#f59e0b', // amber
];

interface DialogLabelsBarProps {
    /** Все метки проекта */
    labels: DialogLabel[];
    /** Загружаются ли метки */
    isLoading: boolean;
    /** Активный фильтр: null = не фильтруем, string = label_id */
    activeFilterLabelId: string | null;
    /** Колбэк: фильтр по метке (null — сброс) */
    onFilterByLabel: (labelId: string | null) => void;
    /** Колбэк: создать метку */
    onCreateLabel: (name: string, color?: string) => Promise<DialogLabel | null>;
    /** Колбэк: переименовать метку */
    onEditLabel: (labelId: string, data: { name?: string; color?: string }) => Promise<void>;
    /** Колбэк: удалить метку */
    onRemoveLabel: (labelId: string) => Promise<void>;
}

export const DialogLabelsBar: React.FC<DialogLabelsBarProps> = ({
    labels,
    isLoading,
    activeFilterLabelId,
    onFilterByLabel,
    onCreateLabel,
    onEditLabel,
    onRemoveLabel,
}) => {
    // --- Состояние инлайн-создания метки ---
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(LABEL_COLORS[0]);
    const createInputRef = useRef<HTMLInputElement>(null);

    // --- Состояние редактирования метки ---
    const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');
    const editInputRef = useRef<HTMLInputElement>(null);

    // --- Контекстное меню ---
    const [contextMenuLabelId, setContextMenuLabelId] = useState<string | null>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    // --- Подтверждение удаления ---
    const [deletingLabelId, setDeletingLabelId] = useState<string | null>(null);

    // Фокус на поле ввода при создании
    useEffect(() => {
        if (isCreating && createInputRef.current) {
            createInputRef.current.focus();
        }
    }, [isCreating]);

    // Фокус на поле ввода при редактировании
    useEffect(() => {
        if (editingLabelId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingLabelId]);

    // Закрытие контекстного меню при клике вне
    useEffect(() => {
        if (!contextMenuLabelId) return;
        const handleClick = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setContextMenuLabelId(null);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [contextMenuLabelId]);

    // Сохранить новую метку
    const handleCreateSave = useCallback(async () => {
        const name = newName.trim();
        if (!name) {
            setIsCreating(false);
            setNewName('');
            return;
        }
        await onCreateLabel(name, newColor);
        setIsCreating(false);
        setNewName('');
        setNewColor(LABEL_COLORS[0]);
    }, [newName, newColor, onCreateLabel]);

    // Сохранить редактирование метки
    const handleEditSave = useCallback(async () => {
        if (!editingLabelId) return;
        const name = editName.trim();
        if (!name) {
            setEditingLabelId(null);
            return;
        }
        await onEditLabel(editingLabelId, { name: editName, color: editColor });
        setEditingLabelId(null);
    }, [editingLabelId, editName, editColor, onEditLabel]);

    // Начать редактирование
    const startEditing = useCallback((label: DialogLabel) => {
        setEditingLabelId(label.id);
        setEditName(label.name);
        setEditColor(label.color);
        setContextMenuLabelId(null);
    }, []);

    // Подтвердить удаление
    const handleConfirmDelete = useCallback(async () => {
        if (!deletingLabelId) return;
        // Сброс фильтра если удаляем активную метку
        if (activeFilterLabelId === deletingLabelId) {
            onFilterByLabel(null);
        }
        await onRemoveLabel(deletingLabelId);
        setDeletingLabelId(null);
    }, [deletingLabelId, activeFilterLabelId, onFilterByLabel, onRemoveLabel]);

    // Если загрузка и нет меток — не показываем секцию
    if (isLoading && labels.length === 0) return null;
    // Если нет меток и не создаём — показываем только кнопку «+»
    const hasLabels = labels.length > 0 || isCreating;

    const deletingLabel = labels.find(l => l.id === deletingLabelId);

    return (
        <>
            <div className="px-3 py-1.5 border-b border-gray-100 overflow-visible">
                <div className="flex items-center gap-1.5 flex-wrap overflow-visible pt-1">
                    {/* Чипы существующих меток */}
                    {labels.map(label => {
                        const isActive = activeFilterLabelId === label.id;
                        const isEditing = editingLabelId === label.id;

                        if (isEditing) {
                            return (
                                <div key={label.id} className="flex items-center gap-1 flex-shrink-0">
                                    {/* Палитра цветов */}
                                    <div className="flex gap-0.5">
                                        {LABEL_COLORS.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setEditColor(c)}
                                                className={`w-5 h-5 rounded-full border-2 transition-all ${
                                                    editColor === c
                                                        ? 'border-gray-600 scale-125'
                                                        : 'border-transparent hover:border-gray-300'
                                                }`}
                                                style={{ backgroundColor: c }}
                                                title={c}
                                            />
                                        ))}
                                    </div>
                                    <input
                                        ref={editInputRef}
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleEditSave();
                                            if (e.key === 'Escape') setEditingLabelId(null);
                                        }}
                                        onBlur={e => {
                                            // Не закрывать если клик по кнопке палитры цветов
                                            const container = e.currentTarget.parentElement;
                                            if (container && e.relatedTarget && container.contains(e.relatedTarget as Node)) return;
                                            handleEditSave();
                                        }}
                                        className="w-24 px-2 py-1 text-xs border border-indigo-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Имя..."
                                    />
                                </div>
                            );
                        }

                        return (
                            <div key={label.id} className="relative flex-shrink-0 group">
                                <button
                                    onClick={() => {
                                        // Клик — фильтр (toggle)
                                        onFilterByLabel(isActive ? null : label.id);
                                    }}
                                    onContextMenu={e => {
                                        e.preventDefault();
                                        setContextMenuLabelId(label.id);
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                                        isActive
                                            ? 'ring-2 ring-offset-1 shadow-sm'
                                            : 'hover:shadow-sm opacity-80 hover:opacity-100'
                                    }`}
                                    style={{
                                        backgroundColor: `${label.color}18`,
                                        color: label.color,
                                        borderColor: `${label.color}40`,
                                        ...(isActive ? { ringColor: label.color } : {}),
                                    }}
                                    title={`${label.name}${label.dialog_count > 0 ? ` — ${label.dialog_count}` : ''} · ПКМ для редактирования`}
                                >
                                    <span
                                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: label.color }}
                                    />
                                    {label.name}
                                    {label.dialog_count > 0 && (
                                        <span className="opacity-60"> — {label.dialog_count}</span>
                                    )}
                                </button>

                                {/* Кнопка удаления × — появляется при наведении */}
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        setDeletingLabelId(label.id);
                                    }}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-400 hover:bg-red-500 text-white rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-all hidden group-hover:flex"
                                    title="Удалить метку"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                {/* Контекстное меню */}
                                {contextMenuLabelId === label.id && (
                                    <div
                                        ref={contextMenuRef}
                                        className="absolute top-full left-0 mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-[100] animate-fade-in-up"
                                    >
                                        <button
                                            onClick={() => startEditing(label)}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            Переименовать
                                        </button>
                                        <button
                                            onClick={() => {
                                                setContextMenuLabelId(null);
                                                setDeletingLabelId(label.id);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Удалить
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Инлайн-создание метки */}
                    {isCreating ? (
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Палитра цветов */}
                            <div className="flex gap-0.5">
                                {LABEL_COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setNewColor(c)}
                                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                                            newColor === c
                                                ? 'border-gray-600 scale-125'
                                                : 'border-transparent hover:border-gray-300'
                                        }`}
                                        style={{ backgroundColor: c }}
                                        title={c}
                                    />
                                ))}
                            </div>
                            <input
                                ref={createInputRef}
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleCreateSave();
                                    if (e.key === 'Escape') {
                                        setIsCreating(false);
                                        setNewName('');
                                    }
                                }}
                                onBlur={e => {
                                    // Не закрывать если клик по кнопке палитры цветов
                                    const container = e.currentTarget.parentElement;
                                    if (container && e.relatedTarget && container.contains(e.relatedTarget as Node)) return;
                                    handleCreateSave();
                                }}
                                className="w-24 px-2 py-1 text-xs border border-indigo-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Метка..."
                            />
                        </div>
                    ) : (
                        /* Кнопка «+» — создать метку */
                        <button
                            onClick={() => setIsCreating(true)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-indigo-400 text-indigo-400 hover:text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 transition-colors whitespace-nowrap flex-shrink-0"
                            title="Создать метку"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Метка
                        </button>
                    )}

                    {/* Кнопка сброса фильтра (если фильтр активен) */}
                    {activeFilterLabelId && (
                        <button
                            onClick={() => onFilterByLabel(null)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
                            title="Сбросить фильтр по метке"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Модалка подтверждения удаления */}
            {deletingLabelId && (
                <ConfirmationModal
                    title="Удалить метку?"
                    message={`Метка «${deletingLabel?.name || ''}» будет удалена со всех диалогов${deletingLabel && deletingLabel.dialog_count > 0 ? ` — ${deletingLabel.dialog_count} ${plural(deletingLabel.dialog_count, ['диалог', 'диалога', 'диалогов'])}` : ''}. Это действие нельзя отменить.`}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setDeletingLabelId(null)}
                    confirmText="Удалить"
                    cancelText="Отмена"
                    confirmButtonVariant="danger"
                />
            )}
        </>
    );
};
