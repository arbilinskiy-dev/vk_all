import React, { useState } from 'react';
import type { MockProduct } from './ProductsMocks.types';

// =====================================================================
// MockProductRow — строка товара в таблице
// =====================================================================
interface MockProductRowProps {
    product: MockProduct;
    isSelected: boolean;
    onSelect: (selected: boolean) => void;
    onChange?: (field: string, value: any) => void;
    onSave?: () => void;
    onDelete?: () => void;
    isDirty?: boolean;
    hasError?: boolean;
    showNewPhoto?: boolean;
    aiSuggestion?: string;
}

export const MockProductRow: React.FC<MockProductRowProps> = ({
    product,
    isSelected,
    onSelect,
    onChange,
    onSave,
    onDelete,
    isDirty = false,
    hasError = false,
    showNewPhoto = false,
    aiSuggestion
}) => {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    return (
        <tr className={`border-b border-gray-200 hover:bg-gray-50 ${hasError ? 'bg-red-50' : ''}`}>
            {/* Чекбокс */}
            <td className="px-4 py-2 whitespace-nowrap">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelect(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
            </td>

            {/* Действия */}
            <td className="px-4 py-2 whitespace-nowrap">
                <div className="grid grid-cols-2 gap-1 w-fit">
                    {/* Сохранить */}
                    <button
                        onClick={onSave}
                        disabled={!isDirty}
                        className={`flex items-center justify-center h-9 aspect-square p-1 border border-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            isDirty ? 'text-green-600 hover:bg-green-100' : 'text-gray-400'
                        }`}
                        title="Сохранить изменения"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </button>

                    {/* Обновить фото */}
                    <button
                        className="flex items-center justify-center h-9 aspect-square p-1 border border-gray-300 rounded-md transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                        title="Обновить фото"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>

                    {/* Копировать */}
                    <button
                        className="flex items-center justify-center h-9 aspect-square p-1 border border-gray-300 rounded-md transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                        title="Копировать товар"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>

                    {/* Удалить */}
                    <button
                        onClick={onDelete}
                        className="flex items-center justify-center h-9 aspect-square p-1 border border-gray-300 rounded-md transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                        title="Удалить товар"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </td>

            {/* Текущее фото */}
            <td className="px-4 py-2">
                <img src={product.photo} alt={product.title} className="w-16 h-16 object-cover rounded-md border border-gray-300" />
            </td>

            {/* Новое фото (если показываем) */}
            {showNewPhoto && (
                <td className="px-4 py-2">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 text-xs">
                        Нет
                    </div>
                </td>
            )}

            {/* Название */}
            <td className="px-4 py-2">
                <input
                    type="text"
                    value={product.title}
                    onChange={(e) => onChange?.('title', e.target.value)}
                    className={`w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 ${
                        hasError ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                    style={{ minWidth: '200px' }}
                />
            </td>

            {/* Описание */}
            <td className="px-4 py-2">
                <div className="relative group">
                    <textarea
                        value={product.description}
                        onChange={(e) => onChange?.('description', e.target.value)}
                        rows={isDescriptionExpanded ? 8 : 3}
                        className={`w-full p-1 border rounded-md focus:outline-none focus:ring-2 text-sm bg-white custom-scrollbar ${
                            hasError ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                        }`}
                        style={{ minWidth: '250px' }}
                    />
                    {/* Кнопка свернуть/развернуть */}
                    {isDescriptionExpanded && (
                        <button
                            onClick={() => setIsDescriptionExpanded(false)}
                            className="absolute bottom-3 right-3 p-1 text-gray-400 hover:text-gray-700 rounded-full bg-white/50 hover:bg-gray-200 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    )}
                    {!isDescriptionExpanded && (
                        <button
                            onClick={() => setIsDescriptionExpanded(true)}
                            className="absolute bottom-1 right-1 p-1 text-gray-400 hover:text-gray-700 rounded-full bg-white/50 hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            ↕
                        </button>
                    )}
                    {/* Кнопка AI */}
                    <div className="absolute top-1 right-1 flex gap-1">
                        <button
                            className={`p-1 border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 h-8 w-8 flex items-center justify-center ${
                                hasError
                                    ? 'border-red-500 bg-red-50 text-red-500'
                                    : 'border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                            }`}
                            title="AI-коррекция описания"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </button>
                        {aiSuggestion && (
                            <button
                                className="p-1 border border-green-500 bg-green-50 text-green-600 rounded-md transition-colors hover:bg-green-100 flex-shrink-0 h-8 w-8 flex items-center justify-center"
                                title="Применить AI-предложение"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </td>

            {/* Цена */}
            <td className="px-4 py-2">
                <input
                    type="number"
                    value={product.price}
                    onChange={(e) => onChange?.('price', parseFloat(e.target.value))}
                    className={`w-24 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 ${
                        hasError ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                />
            </td>

            {/* Старая цена */}
            <td className="px-4 py-2">
                <input
                    type="number"
                    value={product.oldPrice || ''}
                    onChange={(e) => onChange?.('oldPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="—"
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </td>

            {/* Подборка */}
            <td className="px-4 py-2">
                <select
                    value={product.album || ''}
                    onChange={(e) => onChange?.('album', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    style={{ minWidth: '150px' }}
                >
                    <option value="">Без подборки</option>
                    <option value="Новинки">Новинки</option>
                    <option value="Акции">Акции</option>
                    <option value="Хиты продаж">Хиты продаж</option>
                </select>
            </td>

            {/* Категория */}
            <td className="px-4 py-2">
                <div className="flex items-center gap-1">
                    <select
                        value={product.category || ''}
                        onChange={(e) => onChange?.('category', e.target.value)}
                        className={`flex-1 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 ${
                            hasError ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                        }`}
                        style={{ minWidth: '150px' }}
                    >
                        <option value="">Не выбрана</option>
                        <option value="Одежда">Одежда</option>
                        <option value="Обувь">Обувь</option>
                        <option value="Аксессуары">Аксессуары</option>
                    </select>
                    {/* Кнопка AI */}
                    <button
                        className={`p-1 border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            hasError
                                ? 'border-red-500 bg-red-50 text-red-500'
                                : 'border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                        }`}
                        title="AI-подбор категории"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </button>
                </div>
            </td>

            {/* Артикул */}
            <td className="px-4 py-2">
                <input
                    type="text"
                    value={product.sku || ''}
                    onChange={(e) => onChange?.('sku', e.target.value)}
                    placeholder="—"
                    className="w-32 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </td>

            {/* Ссылка на VK */}
            <td className="px-4 py-2 text-center">
                <a
                    href={`https://vk.com/market-123456789_${product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            </td>
        </tr>
    );
};
