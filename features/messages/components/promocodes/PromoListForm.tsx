/**
 * PromoListForm — форма создания/редактирования списка промокодов.
 * Поля: название, slug (с авто-генерацией), галка «одноразовые».
 */

import React from 'react';
import { PromoList } from '../../../../services/api/promo_lists.api';

interface PromoListFormProps {
    editingList: PromoList | null;
    formName: string;
    formSlug: string;
    formOneTime: boolean;
    isSaving: boolean;
    onFormNameChange: (value: string) => void;
    onFormSlugChange: (value: string) => void;
    onFormOneTimeChange: (value: boolean) => void;
    generateSlug: (name: string) => string;
    onSave: () => void;
    onCancel: () => void;
}

export const PromoListForm: React.FC<PromoListFormProps> = ({
    editingList,
    formName,
    formSlug,
    formOneTime,
    isSaving,
    onFormNameChange,
    onFormSlugChange,
    onFormOneTimeChange,
    generateSlug,
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
                <span className="text-sm font-medium text-gray-700">
                    {editingList ? 'Редактирование списка' : 'Новый список промокодов'}
                </span>
            </div>

            {/* Форма */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-3">
                {/* Название */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Название</label>
                    <input
                        type="text"
                        value={formName}
                        onChange={e => {
                            onFormNameChange(e.target.value);
                            // Авто-генерация slug только при создании
                            if (!editingList) {
                                onFormSlugChange(generateSlug(e.target.value));
                            }
                        }}
                        placeholder="Скидка 100 рублей"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                    />
                </div>

                {/* Slug */}
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Slug (для переменных)
                    </label>
                    <input
                        type="text"
                        value={formSlug}
                        onChange={e => onFormSlugChange(e.target.value.replace(/[^a-z0-9_]/g, ''))}
                        placeholder="sale100"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 font-mono"
                    />
                    {formSlug && (
                        <div className="mt-1.5 text-xs text-gray-400 space-y-0.5">
                            <div>Переменная кода: <code className="bg-gray-100 px-1 rounded text-indigo-600">{'{'}promo_{formSlug}_code{'}'}</code></div>
                            <div>Переменная описания: <code className="bg-gray-100 px-1 rounded text-indigo-600">{'{'}promo_{formSlug}_description{'}'}</code></div>
                        </div>
                    )}
                </div>

                {/* Тип */}
                <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formOneTime}
                            onChange={e => onFormOneTimeChange(e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Одноразовые промокоды</span>
                    </label>
                    <p className="text-xs text-gray-400 mt-1 ml-6">
                        Каждый промокод можно использовать только один раз (выдаётся следующему пользователю)
                    </p>
                </div>
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
                    disabled={!formName.trim() || !formSlug.trim() || isSaving}
                    className="flex-1 py-2 text-sm font-medium rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-300 transition-colors"
                >
                    {isSaving ? 'Сохранение...' : (editingList ? 'Сохранить' : 'Создать')}
                </button>
            </div>
        </div>
    );
};
