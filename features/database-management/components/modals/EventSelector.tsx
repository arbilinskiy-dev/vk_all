import React from 'react';
import { CALLBACK_EVENT_CATEGORIES, ALL_EVENT_KEYS, CallbackEventCategory } from '../../../../shared/utils/callbackEvents';

// ─── Типы ─────────────────────────────────────────────────────────

interface EventSelectorProps {
    selectedEvents: Set<string>;
    showEventSelector: boolean;
    allSelected: boolean;
    onToggleShow: () => void;
    onToggleEvent: (key: string) => void;
    onToggleCategory: (category: CallbackEventCategory) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
}

// ─── Компонент ────────────────────────────────────────────────────

export const EventSelector: React.FC<EventSelectorProps> = ({
    selectedEvents,
    showEventSelector,
    allSelected,
    onToggleShow,
    onToggleEvent,
    onToggleCategory,
    onSelectAll,
    onDeselectAll,
}) => {
    return (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={onToggleShow}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 transition-transform duration-200 ${showEventSelector ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    Выбрать события ({selectedEvents.size}/{ALL_EVENT_KEYS.length})
                </button>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${allSelected ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {allSelected ? 'Все события' : `${selectedEvents.size} из ${ALL_EVENT_KEYS.length}`}
                </span>
            </div>
            {showEventSelector && (
                <div className="mt-3 space-y-2">
                    {/* Кнопки выбрать / снять все */}
                    <div className="flex gap-2 mb-2">
                        <button type="button" onClick={onSelectAll} className="text-[10px] text-indigo-600 hover:text-indigo-800 underline">Выбрать все</button>
                        <button type="button" onClick={onDeselectAll} className="text-[10px] text-red-500 hover:text-red-700 underline">Снять все</button>
                    </div>
                    <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                        {CALLBACK_EVENT_CATEGORIES.map(category => {
                            const catSelected = category.events.filter(e => selectedEvents.has(e.key)).length;
                            const catAll = catSelected === category.events.length;
                            return (
                                <div key={category.label} className="bg-white rounded-md border border-gray-100 p-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={catAll}
                                            onChange={() => onToggleCategory(category)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                                        />
                                        <span className="text-xs font-medium text-gray-700">
                                            {category.label}
                                            <span className="text-gray-400 font-normal ml-1">({catSelected}/{category.events.length})</span>
                                        </span>
                                    </label>
                                    <div className="ml-5 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                                        {category.events.map(event => (
                                            <label key={event.key} className="flex items-center gap-1 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEvents.has(event.key)}
                                                    onChange={() => onToggleEvent(event.key)}
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                                                />
                                                <span className="text-[10px] text-gray-600">{event.label}</span>
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
