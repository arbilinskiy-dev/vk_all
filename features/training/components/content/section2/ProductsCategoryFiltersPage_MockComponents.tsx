/**
 * Mock-компоненты и данные для демонстрации работы с категориями товаров.
 *
 * Содержит:
 *   - Интерфейсы MockCategory / GroupedCategory
 *   - Набор тестовых данных mockGroupedCategories
 *   - Утилита splitCategoryName
 *   - Компонент CategorySelectorMock  — выпадающий селектор категорий
 *   - Компонент RefreshCategoriesButtonMock — кнопка обновления категорий
 */
import React, { useState } from 'react';

// =====================================================================
// Типы
// =====================================================================

export interface MockCategory {
    id: number;
    name: string;
    section_id: number;
    section_name: string;
}

export interface GroupedCategory {
    section_name: string;
    categories: MockCategory[];
}

// =====================================================================
// Mock-данные
// =====================================================================

export const mockGroupedCategories: GroupedCategory[] = [
    {
        section_name: 'Одежда',
        categories: [
            { id: 1, name: 'Одежда / Футболки / Мужские', section_id: 1, section_name: 'Одежда' },
            { id: 2, name: 'Одежда / Футболки / Женские', section_id: 1, section_name: 'Одежда' },
            { id: 3, name: 'Одежда / Джинсы', section_id: 1, section_name: 'Одежда' },
        ],
    },
    {
        section_name: 'Обувь',
        categories: [
            { id: 4, name: 'Обувь / Кроссовки / Мужские', section_id: 2, section_name: 'Обувь' },
            { id: 5, name: 'Обувь / Ботинки', section_id: 2, section_name: 'Обувь' },
        ],
    },
    {
        section_name: 'Аксессуары',
        categories: [
            { id: 6, name: 'Аксессуары / Рюкзаки', section_id: 3, section_name: 'Аксессуары' },
            { id: 7, name: 'Аксессуары / Шапки', section_id: 3, section_name: 'Аксессуары' },
        ],
    },
];

// =====================================================================
// Утилита разделения названия категории на «лист» и «путь»
// =====================================================================

export const splitCategoryName = (fullName: string) => {
    const parts = fullName.split(' / ');
    const leaf = parts[parts.length - 1];
    const path = parts.slice(0, parts.length - 1).join(' / ');
    return { leaf, path };
};

// =====================================================================
// CategorySelectorMock — выпадающий селектор с поиском и группировкой
// =====================================================================

export const CategorySelectorMock: React.FC<{
    value: MockCategory | null;
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (cat: MockCategory) => void;
}> = ({ value, isOpen, onToggle, onSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const selectedDisplay = value ? splitCategoryName(value.name) : null;

    const filteredGroups = mockGroupedCategories
        .map(group => ({
            ...group,
            categories: group.categories.filter(cat =>
                cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cat.section_name.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        }))
        .filter(group => group.categories.length > 0);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={onToggle}
                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white flex justify-between items-center h-10"
            >
                {selectedDisplay ? (
                    <div className="flex flex-col items-start overflow-hidden min-w-0 leading-tight w-full">
                        <span className="truncate font-medium text-gray-800 w-full text-left">
                            {selectedDisplay.leaf}
                        </span>
                        {selectedDisplay.path && (
                            <span className="truncate text-[10px] text-gray-400 w-full text-left">
                                {selectedDisplay.path}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-gray-400 truncate">Выберите категорию</span>
                )}
                <svg
                    className="fill-current h-4 w-4 flex-shrink-0 ml-1 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 animate-fade-in-up flex flex-col">
                    <div className="p-2 border-b flex-shrink-0 bg-gray-50">
                        <input
                            type="search"
                            placeholder="Поиск..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                        />
                    </div>
                    <div className="flex-grow max-h-72 overflow-y-auto custom-scrollbar">
                        {filteredGroups.length > 0 ? (
                            filteredGroups.map((group) => (
                                <div key={group.section_name}>
                                    <h3 className="px-3 py-1.5 text-[10px] font-bold text-gray-500 bg-gray-100 sticky top-0 truncate border-t border-b border-gray-200">
                                        {group.section_name.toUpperCase()}
                                    </h3>
                                    <ul>
                                        {group.categories.map((cat) => {
                                            const { leaf, path } = splitCategoryName(cat.name);
                                            return (
                                                <li key={cat.id}>
                                                    <button
                                                        onClick={() => {
                                                            onSelect(cat);
                                                            onToggle();
                                                        }}
                                                        className="block w-full text-left px-3 py-2 text-sm transition-colors hover:bg-indigo-50 group border-b border-gray-50 last:border-0"
                                                    >
                                                        <div className="font-medium text-gray-800 group-hover:text-indigo-700">
                                                            {leaf}
                                                        </div>
                                                        {path && (
                                                            <div className="text-[10px] text-gray-400 group-hover:text-indigo-400 truncate">
                                                                {path}
                                                            </div>
                                                        )}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500">
                                Категории не найдены.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// =====================================================================
// RefreshCategoriesButtonMock — кнопка обновления справочника категорий
// =====================================================================

export const RefreshCategoriesButtonMock: React.FC<{
    isRefreshing: boolean;
    onClick: () => void;
}> = ({ isRefreshing, onClick }) => (
    <button
        onClick={onClick}
        disabled={isRefreshing}
        title="Обновить список категорий товаров из VK"
        className="inline-flex items-center justify-center px-3 h-10 border border-gray-300 text-sm font-medium rounded-md text-gray-600 bg-white hover:bg-gray-50 shadow-sm transition-colors focus:outline-none whitespace-nowrap disabled:opacity-50"
    >
        {isRefreshing ? (
            <div className="loader h-4 w-4 border-2 border-gray-400 border-t-indigo-500"></div>
        ) : (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
            </svg>
        )}
    </button>
);
