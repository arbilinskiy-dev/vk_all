import React from 'react';
import { CALLBACK_EVENT_CATEGORIES, ALL_EVENT_KEYS, CallbackEventCategory } from '../../../../../shared/utils/callbackEvents';

interface CallbackEventSelectorProps {
    showEventSelector: boolean;
    onToggleSelector: () => void;
    selectedEvents: Set<string>;
    onToggleEvent: (key: string) => void;
    onToggleCategory: (category: CallbackEventCategory) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
}

export const CallbackEventSelector: React.FC<CallbackEventSelectorProps> = ({
    showEventSelector,
    onToggleSelector,
    selectedEvents,
    onToggleEvent,
    onToggleCategory,
    onSelectAll,
    onDeselectAll,
}) => {
    return (
        <div className="mt-3">
            <button
                type="button"
                onClick={onToggleSelector}
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${showEventSelector ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                Выбрать события ({selectedEvents.size}/{ALL_EVENT_KEYS.length})
            </button>

            {showEventSelector && (
                <div className="mt-2 p-3 bg-white rounded-lg border border-indigo-100 max-h-64 overflow-y-auto custom-scrollbar">
                    {/* Кнопки все / ничего */}
                    <div className="flex gap-2 mb-2 pb-2 border-b border-gray-100">
                        <button type="button" onClick={onSelectAll} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                            Выбрать все
                        </button>
                        <span className="text-gray-300">|</span>
                        <button type="button" onClick={onDeselectAll} className="text-xs text-red-500 hover:text-red-700 font-medium">
                            Снять все
                        </button>
                    </div>

                    {/* Категории событий */}
                    <div className="space-y-3">
                        {CALLBACK_EVENT_CATEGORIES.map(category => {
                            const categoryKeys = category.events.map(e => e.key);
                            const checkedCount = categoryKeys.filter(k => selectedEvents.has(k)).length;
                            const allChecked = checkedCount === categoryKeys.length;
                            const someChecked = checkedCount > 0 && !allChecked;

                            return (
                                <div key={category.label}>
                                    {/* Заголовок категории с чекбоксом */}
                                    <label className="flex items-center gap-1.5 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={allChecked}
                                            ref={el => { if (el) el.indeterminate = someChecked; }}
                                            onChange={() => onToggleCategory(category)}
                                            className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-xs font-semibold text-gray-700 group-hover:text-indigo-700">
                                            {category.label}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            ({checkedCount}/{categoryKeys.length})
                                        </span>
                                    </label>
                                    {/* Список событий */}
                                    <div className="ml-5 mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5">
                                        {category.events.map(event => (
                                            <label key={event.key} className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEvents.has(event.key)}
                                                    onChange={() => onToggleEvent(event.key)}
                                                    className="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-[11px] text-gray-600">{event.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
