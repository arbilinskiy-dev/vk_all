import React from 'react';
import { NavigationLink, NavigationButtons } from '../shared';

// =====================================================================
// Секция: ключевые возможности + навигация «Что дальше»
// =====================================================================

/** Сетка возможностей (4 карточки) + навигационные ссылки */
export const KeyFeaturesSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Ключевые возможности</h2>

        <div className="not-prose grid md:grid-cols-2 gap-4 my-6">
            {/* Поиск в реальном времени */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Поиск в реальном времени
                </h4>
                <p className="text-sm text-gray-700">
                    Начните вводить название — список обновится мгновенно без задержек.
                </p>
            </div>

            {/* Фильтр по командам */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Фильтр по командам
                </h4>
                <p className="text-sm text-gray-700">
                    Покажите только проекты конкретной команды или без команды.
                </p>
            </div>

            {/* Фильтр по количеству постов */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Фильтр по количеству постов
                </h4>
                <p className="text-sm text-gray-700">
                    Кнопки с цветовой кодировкой: "Нет постов" (красный), "&lt;5" (оранжевый), "5-10" (серый), "&gt;10" (зелёный).
                </p>
            </div>

            {/* Выдвижные кнопки */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Выдвижные кнопки на карточках
                </h4>
                <p className="text-sm text-gray-700">
                    Наведите курсор на проект — слева выдвинутся кнопки "Обновить" и "Настройки".
                </p>
            </div>
        </div>

        <hr className="!my-10" />

        {/* Что дальше */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Что дальше?</h2>

        <div className="not-prose my-6 space-y-3">
            <NavigationLink 
                to="1-2-1-primary-sidebar-intro"
                title="1.2.1. Главная навигационная панель"
                description="Вернуться к описанию левой панели с иконками"
                variant="prev"
            />
            <NavigationLink 
                to="1-2-3-workspace-intro"
                title="1.2.3. Рабочая область"
                description="Основная часть экрана справа, где отображается контент проекта"
                variant="next"
            />
        </div>

        <NavigationButtons currentPath="1-2-2-projects-sidebar-intro" />
    </>
);
