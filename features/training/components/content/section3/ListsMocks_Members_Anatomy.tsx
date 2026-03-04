import React from 'react';

// =====================================================================
// MOCK КОМПОНЕНТ: АННОТИРОВАННАЯ АНАТОМИЯ ТАБЛИЦЫ (раздел 3.2.3)
// =====================================================================

export const MembersTableAnatomy: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Зона 1: Панель фильтров */}
            <div className="relative">
                <div className="bg-white border-2 border-blue-400 rounded-lg p-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-grow">
                            <input 
                                type="text" 
                                placeholder="ФИО, ID, ссылка..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md"
                                disabled
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                        <button className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md text-gray-700">
                            Статус ▼
                        </button>
                        <button className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md text-gray-700">
                            Пол ▼
                        </button>
                        <button className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md text-gray-700">
                            Онлайн ▼
                        </button>
                    </div>
                </div>
                <div className="absolute -top-3 left-4 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
                    1. Панель фильтров
                </div>
            </div>

            {/* Зона 2: Заголовки таблицы */}
            <div className="relative">
                <div className="bg-gray-50 border-2 border-green-400 rounded-lg p-3">
                    <div className="grid grid-cols-9 gap-2 text-xs font-medium text-gray-500 uppercase">
                        <div>Аватар</div>
                        <div>Пользователь</div>
                        <div>Пол</div>
                        <div>ДР</div>
                        <div>Город</div>
                        <div>Онлайн</div>
                        <div>Статус</div>
                        <div>Дата</div>
                        <div>Источник</div>
                    </div>
                </div>
                <div className="absolute -top-3 left-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                    2. Заголовки колонок
                </div>
            </div>

            {/* Зона 3: Строки данных */}
            <div className="relative">
                <div className="bg-white border-2 border-purple-400 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                        <div>Анна Смирнова</div>
                        <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs">Ж</span>
                        <span className="text-xs text-gray-500">15.3.1995</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                        <div>Дмитрий Петров</div>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">М</span>
                        <span className="text-xs text-gray-500">22.8.1988</span>
                    </div>
                </div>
                <div className="absolute -top-3 left-4 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">
                    3. Строки участников
                </div>
            </div>

            {/* Зона 4: Индикатор загрузки */}
            <div className="relative">
                <div className="bg-indigo-50 border-2 border-indigo-400 rounded-lg p-4 text-center">
                    <div className="inline-block h-6 w-6 border-4 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
                <div className="absolute -top-3 left-4 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded">
                    4. Загрузка следующей страницы
                </div>
            </div>
        </div>
    );
};
