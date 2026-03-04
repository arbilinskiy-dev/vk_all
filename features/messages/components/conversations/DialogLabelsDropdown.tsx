/**
 * DialogLabelsDropdown — dropdown с чекбоксами для назначения меток диалогу.
 * Используется в ChatHeader и UserInfoPanel.
 */
import React, { useState, useRef, useEffect } from 'react';
import { DialogLabel } from '../../../../services/api/dialog_labels.api';

interface DialogLabelsDropdownProps {
    /** Все метки проекта */
    labels: DialogLabel[];
    /** ID меток, назначенных этому диалогу */
    assignedLabelIds: string[];
    /** Колбэк: назначить метку диалогу */
    onAssign: (labelId: string) => void;
    /** Колбэк: снять метку с диалога */
    onUnassign: (labelId: string) => void;
    /** Компактный режим — иконка-кнопка (для ChatHeader) */
    compact?: boolean;
}

export const DialogLabelsDropdown: React.FC<DialogLabelsDropdownProps> = ({
    labels,
    assignedLabelIds,
    onAssign,
    onUnassign,
    compact = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Закрытие при клике вне
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    const hasAssigned = assignedLabelIds.length > 0;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Кнопка-триггер */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`${compact ? 'w-8 h-8' : 'w-7 h-7'} flex items-center justify-center rounded-md transition-colors ${
                    isOpen
                        ? 'text-indigo-600 bg-indigo-50'
                        : hasAssigned
                            ? 'text-indigo-500 bg-indigo-50/50 hover:bg-indigo-50'
                            : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'
                }`}
                title="Метки диалога"
            >
                {/* Иконка: tag */}
                <svg xmlns="http://www.w3.org/2000/svg" className={`${compact ? 'h-5 w-5' : 'h-4 w-4'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-[100] animate-fade-in-up">
                    <div className="px-3 py-1.5 border-b border-gray-100">
                        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Метки диалога</span>
                    </div>

                    {labels.length === 0 ? (
                        <div className="px-3 py-3 text-xs text-gray-400 text-center">
                            Нет меток.{' '}
                            <br />
                            Создайте в сайдбаре.
                        </div>
                    ) : (
                        <div className="max-h-48 overflow-y-auto custom-scrollbar py-1">
                            {labels.map(label => {
                                const isAssigned = assignedLabelIds.includes(label.id);
                                return (
                                    <button
                                        key={label.id}
                                        onClick={() => {
                                            if (isAssigned) {
                                                onUnassign(label.id);
                                            } else {
                                                onAssign(label.id);
                                            }
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        {/* Чекбокс */}
                                        <span
                                            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                                isAssigned
                                                    ? 'border-transparent'
                                                    : 'border-gray-300'
                                            }`}
                                            style={isAssigned ? { backgroundColor: label.color } : undefined}
                                        >
                                            {isAssigned && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </span>
                                        {/* Цвет метки */}
                                        <span
                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: label.color }}
                                        />
                                        {/* Название */}
                                        <span className="truncate">{label.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
