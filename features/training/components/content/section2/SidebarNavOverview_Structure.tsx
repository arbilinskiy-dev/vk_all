import React from 'react';

// =====================================================================
// Блок «Из чего состоит сайдбар» — 7 пронумерованных частей
// =====================================================================
export const SidebarNavOverview_Structure: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900 !mt-10">Из чего состоит сайдбар?</h2>

        <p className="!text-base !leading-relaxed !text-gray-700 !mt-4">
            Сайдбар — это <strong>сложная структура из 7 основных блоков</strong>, каждый из которых выполняет свою функцию. 
            Некоторые из них очевидны (список проектов), другие скрыты до поры (отключённые проекты), 
            а третьи всегда на виду (блок пользователя внизу).
        </p>

        <div className="not-prose space-y-4 my-8">
            {/* Часть 1 */}
            <div className="border-l-4 border-blue-400 pl-4 py-3 bg-blue-50">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-blue-700">1</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-900 mb-2">Элементы списка проектов</h3>
                        <p className="text-sm text-gray-700">
                            Сам список сообществ — название, счётчик постов, индикаторы состояния, 
                            кнопки для обновления и настроек. <strong>При наведении курсора</strong> на проект 
                            слева появляются кнопки управления.
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                            <strong>Что узнаешь:</strong> Из чего состоит один элемент проекта, как им управлять.
                        </p>
                    </div>
                </div>
            </div>

            {/* Часть 2 */}
            <div className="border-l-4 border-green-400 pl-4 py-3 bg-green-50">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-green-700">2</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-green-900 mb-2">Индикаторы состояния</h3>
                        <p className="text-sm text-gray-700">
                            Маленькие значки, которые сообщают о проблемах или обновлениях:
                        </p>
                        <ul className="text-sm text-gray-700 mt-2 space-y-1">
                            <li className="flex items-center gap-2">
                                <svg className="inline-block w-4 h-4 text-amber-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                                <span>Янтарный треугольник — ошибка доступа к проекту</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="inline-block w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></span>
                                <span>Синяя мигающая точка — доступны новые данные для загрузки</span>
                            </li>
                            <li className="text-xs text-gray-600 mt-1">
                                <em>+ Специальные индикаторы для конкурсов (на соответствующей вкладке)</em>
                            </li>
                        </ul>
                        <p className="text-xs text-gray-600 mt-2">
                            <strong>Что узнаешь:</strong> Что означает каждый значок и что делать когда он появляется.
                        </p>
                    </div>
                </div>
            </div>

            {/* Часть 3 */}
            <div className="border-l-4 border-purple-400 pl-4 py-3 bg-purple-50">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-purple-700">3</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-purple-900 mb-2">Счётчики постов</h3>
                        <p className="text-sm text-gray-700">
                            Цифра справа от названия, которая показывает количество черновиков. 
                            Цвет счётчика говорит об уровне контента (красный = срочно, зелёный = отлично).
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                            <strong>Что узнаешь:</strong> Что означает каждый цвет и как использовать счётчики для контроля.
                        </p>
                    </div>
                </div>
            </div>

            {/* Часть 4 */}
            <div className="border-l-4 border-orange-400 pl-4 py-3 bg-orange-50">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-orange-700">4</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-orange-900 mb-2">Фильтры и поиск</h3>
                        <p className="text-sm text-gray-700">
                            Инструменты для быстрого поиска нужного проекта — поиск по названию, 
                            фильтр по командам, фильтр по количеству постов 
                            (показывается только на вкладках "Отложенные" и "Предложенные").
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                            <strong>Что узнаешь:</strong> Как быстро найти нужный проект среди множества сообществ.
                        </p>
                    </div>
                </div>
            </div>

            {/* Часть 5 */}
            <div className="border-l-4 border-indigo-400 pl-4 py-3 bg-indigo-50">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-indigo-700">5</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-indigo-900 mb-2">Глобальное массовое обновление</h3>
                        <p className="text-sm text-gray-700">
                            Специальная кнопка в шапке рядом с заголовком "Проекты", которая запускает 
                            <strong> обновление данных для ВСЕХ проектов одновременно</strong>. 
                            Показывает процент выполнения и работает в фоне.
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                            <strong>Что узнаешь:</strong> Когда использовать глобальное обновление, почему оно медленное, 
                            как следить за прогрессом.
                        </p>
                    </div>
                </div>
            </div>

            {/* Часть 6 */}
            <div className="border-l-4 border-gray-400 pl-4 py-3 bg-gray-50">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-gray-700">6</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 mb-2">Секция отключённых проектов</h3>
                        <p className="text-sm text-gray-700">
                            Коллапсируемая секция под списком активных проектов для временно неактивных сообществ. 
                            По умолчанию развёрнута, сворачивается кнопкой с иконкой глаза.
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                            <strong>Что узнаешь:</strong> Зачем отключать проекты, как это ускоряет работу, 
                            как управлять отключёнными.
                        </p>
                    </div>
                </div>
            </div>

            {/* Часть 7 */}
            <div className="border-l-4 border-purple-400 pl-4 py-3 bg-purple-50">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-purple-700">7</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-purple-900 mb-2">Блок текущего пользователя</h3>
                        <p className="text-sm text-gray-700">
                            Информационный блок в самом низу сайдбара ("прибит" к низу, не скроллится). 
                            Показывает аватар, имя, роль (или иконку VK для пользователей ВКонтакте), 
                            кнопку выхода и версию бэкенда.
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                            <strong>Что узнаешь:</strong> Какие роли существуют, как работает интеграция с VK, 
                            как быстро выйти из системы, зачем нужна версия бэкенда.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </>
);
