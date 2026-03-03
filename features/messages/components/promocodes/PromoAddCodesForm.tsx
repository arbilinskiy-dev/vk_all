/**
 * PromoAddCodesForm — форма добавления промокодов (bulk-ввод: код;описание).
 */

import React from 'react';

interface PromoAddCodesFormProps {
    bulkText: string;
    isSaving: boolean;
    onBulkTextChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
}

export const PromoAddCodesForm: React.FC<PromoAddCodesFormProps> = ({
    bulkText,
    isSaving,
    onBulkTextChange,
    onSave,
    onCancel,
}) => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Шапка */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <button
                    onClick={onCancel}
                    className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Назад"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <span className="text-sm font-medium text-gray-700">Добавить промокоды</span>
            </div>

            {/* Форма */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-3">
                <p className="text-xs text-gray-500">
                    Введите по одному промокоду на строку. Формат: <code className="bg-gray-100 px-1 rounded">код;описание</code>
                </p>
                <textarea
                    value={bulkText}
                    onChange={e => onBulkTextChange(e.target.value)}
                    placeholder={`217831;Даёт скидку 100 рублей\nABC123;Бесплатная доставка\nXYZ789;Подарок к заказу`}
                    className="w-full h-48 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 font-mono resize-none"
                />
                {bulkText.trim() && (
                    <p className="text-xs text-gray-400">
                        Будет добавлено: {bulkText.split('\n').filter(l => l.trim()).length} промокодов
                    </p>
                )}
            </div>

            {/* Кнопки */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                <button
                    onClick={onCancel}
                    className="flex-1 py-2 text-sm font-medium rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                    Отмена
                </button>
                <button
                    onClick={onSave}
                    disabled={!bulkText.trim() || isSaving}
                    className="flex-1 py-2 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-300 transition-colors"
                >
                    {isSaving ? 'Добавление...' : 'Добавить'}
                </button>
            </div>
        </div>
    );
};
