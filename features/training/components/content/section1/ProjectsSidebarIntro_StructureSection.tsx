import React from 'react';

// =====================================================================
// Секция: структура сайдбара (5 частей)
// =====================================================================

/** Описание 5 частей сайдбара с мини-превью */
export const StructureSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Структура сайдбара</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Сайдбар состоит из <strong>пяти частей</strong>. Каждая выполняет свою роль:
        </p>

        <div className="not-prose my-6 space-y-4">
            {/* 1. Шапка с кнопками */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-bold text-gray-800">Проекты</span>
                            <div className="flex gap-1">
                                <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                    </svg>
                                </div>
                                <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-800 mb-1">Шапка с кнопками</p>
                        <p className="text-sm text-gray-600">Заголовок «Проекты» + две кнопки: глобальное обновление всех проектов и обновление списка из базы</p>
                    </div>
                </div>
            </div>

            {/* 2. Поле поиска */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 bg-white border border-gray-200 rounded-lg p-2 shadow-sm w-36">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-300 rounded text-[10px] text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span>Поиск по названию...</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-800 mb-1">Поле поиска</p>
                        <p className="text-sm text-gray-600">Введите часть названия проекта — список мгновенно отфильтруется</p>
                    </div>
                </div>
            </div>

            {/* 3. Фильтр по командам */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                        <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Команды</p>
                        <div className="flex gap-1">
                            <span className="px-1.5 py-0.5 text-[9px] bg-gray-200 text-gray-700 rounded-full ring-1 ring-indigo-400">Все</span>
                            <span className="px-1.5 py-0.5 text-[9px] bg-gray-200 text-gray-700 rounded-full">СММ-1</span>
                            <span className="px-1.5 py-0.5 text-[9px] bg-gray-200 text-gray-600 rounded-full">...</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-800 mb-1">Фильтр по командам</p>
                        <p className="text-sm text-gray-600">Показать проекты конкретной команды или все сразу. Удобно, когда у вас много проектов</p>
                    </div>
                </div>
            </div>

            {/* 4. Фильтр по количеству постов */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                        <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Посты</p>
                        <div className="flex gap-0.5 flex-wrap" style={{ maxWidth: '110px' }}>
                            <span className="px-1.5 py-0.5 text-[8px] bg-gray-300 text-gray-800 rounded-full">Все</span>
                            <span className="px-1.5 py-0.5 text-[8px] bg-gradient-to-t from-gray-300 to-red-200 text-red-900 rounded-full">0</span>
                            <span className="px-1.5 py-0.5 text-[8px] bg-gradient-to-t from-gray-300 to-orange-200 text-orange-900 rounded-full">&lt;5</span>
                            <span className="px-1.5 py-0.5 text-[8px] bg-gray-300 text-gray-700 rounded-full">5-10</span>
                            <span className="px-1.5 py-0.5 text-[8px] bg-gradient-to-t from-gray-300 to-green-200 text-green-900 rounded-full">&gt;10</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-800 mb-1">Фильтр по количеству постов</p>
                        <p className="text-sm text-gray-600">Цветовая кодировка: красный = 0 постов, оранжевый = мало, серый = норма, зелёный = много</p>
                    </div>
                </div>
            </div>

            {/* 5. Список проектов + блок пользователя */}
            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 bg-white border border-gray-200 rounded-lg p-2 shadow-sm w-36">
                        {/* Мини-карточки проектов */}
                        <div className="space-y-1 mb-2">
                            <div className="flex items-center justify-between px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-[9px]">
                                <span className="text-gray-800 truncate">Салон красоты</span>
                                <span className="px-1 bg-gradient-to-t from-gray-300 to-green-200 text-green-900 rounded-full text-[8px]">12</span>
                            </div>
                            <div className="flex items-center justify-between px-1.5 py-0.5 bg-gray-50 border border-gray-200 rounded text-[9px]">
                                <span className="text-gray-800 truncate">Автосервис</span>
                                <span className="px-1 bg-gradient-to-t from-gray-300 to-red-200 text-red-900 rounded-full text-[8px]">0</span>
                            </div>
                        </div>
                        {/* Мини-блок пользователя */}
                        <div className="flex items-center gap-1 pt-1 border-t border-gray-200">
                            <div className="w-4 h-4 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full"></div>
                            <span className="text-[8px] text-gray-600 truncate">Иван И.</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-gray-800 mb-1">Список проектов + блок пользователя</p>
                        <p className="text-sm text-gray-600">Карточки проектов со счётчиком постов. Внизу — ваш аватар, имя и кнопка выхода</p>
                    </div>
                </div>
            </div>
        </div>
    </>
);
