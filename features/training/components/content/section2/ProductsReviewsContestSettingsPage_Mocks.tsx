/**
 * Mock-компоненты для страницы настроек конкурса отзывов товаров.
 *
 * Содержит:
 *   - SegmentedControlMock — переключатель условия завершения
 *   - DaySelectorMock      — селектор дня недели (7 кнопок)
 *   - RichTemplateEditorMock — редактор шаблона с кнопками переменных
 */
import React from 'react';

// =====================================================================
// Segmented Control для выбора условия завершения
// =====================================================================
export const SegmentedControlMock: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
    const options = [
        { id: 'count', label: 'По количеству' },
        { id: 'date', label: 'В определенный день' },
        { id: 'mixed', label: 'День + Количество' }
    ];

    return (
        <div className="bg-gray-200 p-1 rounded-lg flex space-x-1">
            {options.map(option => (
                <button
                    key={option.id}
                    onClick={() => onChange(option.id)}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap focus:outline-none ${
                        value === option.id
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-300'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

// =====================================================================
// Селектор дня недели (7 кнопок)
// =====================================================================
export const DaySelectorMock: React.FC<{ value: number; onChange: (day: number) => void }> = ({ value, onChange }) => {
    const days = [
        { val: 1, label: 'Пн' }, { val: 2, label: 'Вт' }, { val: 3, label: 'Ср' },
        { val: 4, label: 'Чт' }, { val: 5, label: 'Пт' }, { val: 6, label: 'Сб' }, { val: 7, label: 'Вс' }
    ];

    return (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
            {days.map(d => (
                <button
                    key={d.val}
                    onClick={() => onChange(d.val)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                        value === d.val
                            ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5'
                            : 'text-gray-500 hover:bg-white/50'
                    }`}
                >
                    {d.label}
                </button>
            ))}
        </div>
    );
};

// =====================================================================
// Редактор шаблона с кнопками переменных
// =====================================================================
export const RichTemplateEditorMock: React.FC<{ 
    label: string; 
    value: string; 
    specificVariables?: { name: string; value: string }[];
    helpText?: string;
}> = ({ label, value, specificVariables, helpText }) => {
    return (
        <div className="border border-gray-300 rounded-md bg-white overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 p-2">
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <div className="flex items-center gap-1">
                        {/* Кнопки специфичных переменных */}
                        {specificVariables && specificVariables.length > 0 && (
                            <div className="flex gap-1 mr-2 border-r border-gray-300 pr-2">
                                {specificVariables.map(v => (
                                    <button
                                        key={v.value}
                                        type="button"
                                        title={`Вставить переменную: ${v.name}`}
                                        className="px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors border border-indigo-200 cursor-pointer"
                                    >
                                        {v.value}
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {/* Кнопка переменных */}
                        <button 
                            type="button"
                            className="p-1.5 rounded transition-colors text-gray-500 hover:bg-gray-200"
                            title="Переменные проекта"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                        
                        {/* Кнопка эмодзи */}
                        <button 
                            type="button"
                            className="p-1.5 rounded transition-colors text-gray-500 hover:bg-gray-200"
                            title="Эмодзи"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            <textarea
                value={value}
                readOnly
                rows={3}
                className="w-full px-3 py-2 text-sm focus:outline-none bg-transparent custom-scrollbar rounded-b-md resize-none"
                placeholder="Введите текст шаблона..."
            />
            
            {helpText && (
                <div className="bg-gray-50 border-t border-gray-200 px-3 py-2">
                    <p className="text-xs text-gray-500">{helpText}</p>
                </div>
            )}
        </div>
    );
};
