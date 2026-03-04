import React from 'react';

// =====================================================================
// MOCK КОМПОНЕНТ: АННОТИРОВАННАЯ ТАБЛИЦА ПОСТОВ (раздел 3.2.4)
// Выделено из ListsMocks_Posts.tsx
// =====================================================================

// Компонент: Аннотированная таблица постов — показывает зоны UI
export const PostsTableAnatomy: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Зона 1: Панель поиска */}
            <div className="relative">
                <div className="bg-white border-2 border-blue-400 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-grow">
                            <input 
                                type="text" 
                                placeholder="Поиск по тексту..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md"
                                disabled
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                        <button className="flex items-center justify-center h-9 px-3 bg-white border border-gray-300 rounded-md text-gray-600">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="absolute -top-3 left-4 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                    1. Панель поиска
                </div>
            </div>

            {/* Зона 2: Заголовки таблицы */}
            <div className="relative">
                <div className="bg-gray-50 border-2 border-green-400 rounded-lg p-3">
                    <div className="grid grid-cols-9 gap-2 text-xs font-medium text-gray-500 uppercase">
                        <div className="w-16">Медиа</div>
                        <div className="col-span-2">Текст</div>
                        <div>Лайки</div>
                        <div>Коммент.</div>
                        <div>Репосты</div>
                        <div>Просмотры</div>
                        <div>Публ.</div>
                        <div>Ссылка</div>
                    </div>
                </div>
                <div className="absolute -top-3 left-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                    2. Заголовки колонок
                </div>
            </div>

            {/* Зона 3: Строки постов */}
            <div className="relative">
                <div className="bg-white border-2 border-purple-400 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-10 h-10 rounded bg-gray-200"></div>
                        <div className="flex-1 truncate">Друзья! Рады сообщить вам об открытии...</div>
                        <span className="text-red-500 font-medium">245</span>
                        <span className="text-gray-700">18</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-10 h-10 rounded bg-gray-200"></div>
                        <div className="flex-1 truncate">Скидки до 50% на все товары...</div>
                        <span className="text-gray-700 font-medium">89</span>
                        <span className="text-gray-700">5</span>
                    </div>
                </div>
                <div className="absolute -top-3 left-4 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">
                    3. Строки постов
                </div>
            </div>

            {/* Зона 4: Индикатор загрузки */}
            <div className="relative">
                <div className="bg-indigo-50 border-2 border-indigo-400 rounded-lg p-4 text-center">
                    <div className="inline-block h-6 w-6 border-4 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
                <div className="absolute -top-3 left-4 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded">
                    4. Загрузка следующих постов
                </div>
            </div>
        </div>
    );
};
