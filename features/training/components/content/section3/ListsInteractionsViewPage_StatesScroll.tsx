import React from 'react';
import { Sandbox, NavigationButtons } from '../shared';

// =====================================================================
// Секция «Состояния таблицы» + «Бесконечная прокрутка» + «Отличия от других режимов»
// =====================================================================

/** Блок 6 страницы «Просмотр взаимодействий» — состояния, скролл, сравнение */
export const StatesScrollSection: React.FC = () => (
    <>
        {/* ============================================== */}
        {/* 10. СОСТОЯНИЯ ТАБЛИЦЫ */}
        {/* ============================================== */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Состояния таблицы</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Таблица может находиться в одном из трёх состояний:
        </p>

        <Sandbox
            title="Переключение состояний таблицы"
            description="Используйте кнопки сверху, чтобы увидеть каждое состояние"
            instructions={[
                '<strong>Loading</strong> — первичная загрузка данных, показывается спиннер',
                '<strong>Empty</strong> — список пуст, нужно запустить сбор данных',
                '<strong>Data</strong> — обычное отображение таблицы с данными',
            ]}
        >
            <div className="text-center text-gray-500 py-8">
                <p>Интерактивная демонстрация состояний таблицы будет добавлена позже</p>
            </div>
        </Sandbox>

        <div className="not-prose my-6">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-32">Состояние</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Когда показывается</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Что видит пользователь</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">Loading</code></td>
                        <td className="px-4 py-3 text-gray-600">При первой загрузке страницы, пока данные грузятся с сервера</td>
                        <td className="px-4 py-3 text-gray-600">Спиннер (крутящийся круг) + текст "Загрузка данных..."</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">Empty</code></td>
                        <td className="px-4 py-3 text-gray-600">Когда в базе нет данных по выбранному списку (не запускался сбор)</td>
                        <td className="px-4 py-3 text-gray-600">Серый блок с текстом "Список пуст. Запустите сбор данных за период."</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">Data</code></td>
                        <td className="px-4 py-3 text-gray-600">Когда есть хотя бы одна запись в списке</td>
                        <td className="px-4 py-3 text-gray-600">Полноценная таблица со строками, поиск и фильтры активны</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* ============================================== */}
        {/* 11. INFINITE SCROLL */}
        {/* ============================================== */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Бесконечная прокрутка (Infinite Scroll)</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Таблица использует технологию <strong>автоподгрузки данных при прокрутке</strong>. Когда пользователь доскроллил до низа таблицы — автоматически подгружается следующая порция записей.
        </p>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Как это работает?</h3>

        <ol className="!text-base !leading-relaxed !text-gray-700">
            <li>В конце таблицы находится невидимый элемент-триггер</li>
            <li>Используется <code>IntersectionObserver</code> API — браузер отслеживает когда элемент попадает в видимую область</li>
            <li>Когда пользователь доскроллил до триггера — срабатывает запрос на сервер</li>
            <li>Во время загрузки показывается спиннер в нижней части таблицы</li>
            <li>Новые записи добавляются в конец списка</li>
        </ol>

        <div className="not-prose bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg my-6">
            <h4 className="font-bold text-green-900 mb-2">Преимущества подхода</h4>
            <ul className="space-y-2 text-sm text-green-800">
                <li className="flex gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>Быстрая первичная загрузка</strong> — не нужно ждать пока загрузятся все 10 000 записей</span>
                </li>
                <li className="flex gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>Экономия памяти</strong> — браузер не хранит весь массив данных сразу</span>
                </li>
                <li className="flex gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>Плавная работа</strong> — прокрутка не тормозит даже на слабых устройствах</span>
                </li>
            </ul>
        </div>

        {/* ============================================== */}
        {/* 12. ОТЛИЧИЯ ОТ ДРУГИХ РЕЖИМОВ */}
        {/* ============================================== */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Отличия от других режимов просмотра</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            В разделе "Системные списки" доступны три режима просмотра данных. Вот чем они отличаются:
        </p>

        <Sandbox
            title="Сравнительная таблица: Участники vs Посты vs Взаимодействия"
            description="Каждый режим решает свою задачу"
        >
            <div className="text-center text-gray-500 py-8">
                <p>Сравнительная таблица взаимодействий будет добавлена позже</p>
            </div>
        </Sandbox>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Когда использовать каждый режим?</h3>

        <div className="not-prose grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="p-4 border-2 border-purple-200 rounded-lg bg-purple-50">
                <h4 className="font-bold text-purple-900 mb-2">Участники</h4>
                <ul className="space-y-1 text-sm text-purple-800">
                    <li className="flex gap-2">
                        <span>•</span>
                        <span>Массовые рассылки по базе</span>
                    </li>
                    <li className="flex gap-2">
                        <span>•</span>
                        <span>Анализ демографии подписчиков</span>
                    </li>
                    <li className="flex gap-2">
                        <span>•</span>
                        <span>Экспорт контактов</span>
                    </li>
                </ul>
            </div>
            <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                <h4 className="font-bold text-blue-900 mb-2">Посты</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                    <li className="flex gap-2">
                        <span>•</span>
                        <span>Контент-аналитика</span>
                    </li>
                    <li className="flex gap-2">
                        <span>•</span>
                        <span>Поиск лучших публикаций</span>
                    </li>
                    <li className="flex gap-2">
                        <span>•</span>
                        <span>Статистика по каждому посту</span>
                    </li>
                </ul>
            </div>
            <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
                <h4 className="font-bold text-green-900 mb-2">Взаимодействия</h4>
                <ul className="space-y-1 text-sm text-green-800">
                    <li className="flex gap-2">
                        <span>•</span>
                        <span>Выявление "суперфанов"</span>
                    </li>
                    <li className="flex gap-2">
                        <span>•</span>
                        <span>Поощрение активных пользователей</span>
                    </li>
                    <li className="flex gap-2">
                        <span>•</span>
                        <span>Поиск лояльной аудитории</span>
                    </li>
                </ul>
            </div>
        </div>

        {/* ============================================== */}
        {/* НАВИГАЦИЯ */}
        {/* ============================================== */}
        <NavigationButtons currentPath="3-2-5-interactions" />
    </>
);
