import React from 'react';
import { Sandbox } from '../shared';
import { MockStoryRow } from './ProductsStoriesStatsPage_MockComponents';

/**
 * Секция «История публикаций (Таблица)»
 * Панель управления, структура таблицы, интерактивная песочница, особенности.
 */
export const TableSection: React.FC = () => {
    return (
        <>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">История публикаций (Таблица)</h2>

            <p className="!text-base !leading-relaxed !text-gray-700">
                Под дашбордом находится большая таблица со списком всех историй. 
                Здесь показываются как активные истории (ещё доступны в ВКонтакте), так и архивные (уже удалённые или истёкшие).
            </p>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Панель управления (Toolbar)</h3>

            <p className="!text-base !leading-relaxed !text-gray-700">
                В верхней части таблицы расположена панель с двумя кнопками управления.
            </p>

            <p className="!text-base !leading-relaxed !text-gray-700">
                <strong>1. Кнопка "Обновить статистику"</strong>
            </p>

            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li>При клике раскрывается панель быстрых команд (dropdown)</li>
                <li><strong>"Посл:"</strong> 10, 30, 50, 100 — обновить последние N историй</li>
                <li><strong>"Дни:"</strong> 7, 30, 90 — обновить за последние N дней</li>
                <li><strong>"Все"</strong> (красная кнопка) — обновить всю статистику (может занять время)</li>
                <li>Иконка вращается во время загрузки (animate-spin)</li>
            </ul>

            <p className="!text-base !leading-relaxed !text-gray-700">
                <strong>2. Кнопка "Обновить список"</strong>
            </p>

            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li>Перезагружает список историй с сервера</li>
                <li>Синий цвет (indigo-600)</li>
                <li>Показывает спиннер во время загрузки</li>
                <li>Используйте после публикации новой истории, чтобы увидеть её в списке</li>
            </ul>

            <div className="not-prose bg-amber-50 border border-amber-200 rounded-lg p-4 my-6">
                <p className="text-sm text-amber-800 flex items-start gap-2">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                        <strong>Разница между кнопками:</strong> "Обновить статистику" загружает детальные данные с VK API 
                        (лайки, клики, подписки). "Обновить список" просто перезагружает таблицу из базы данных.
                    </span>
                </p>
            </div>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Структура таблицы (4 колонки)</h3>

            <p className="!text-base !leading-relaxed !text-gray-700">
                Таблица состоит из четырёх колонок:
            </p>

            <ol className="!text-base !leading-relaxed !text-gray-700">
                <li>
                    <strong>Превью</strong> — миниатюра изображения из истории (12×20 пикселей, вертикальный формат). 
                    При наведении курсора изображение увеличивается в 2.5 раза. При клике открывается полноэкранный просмотр.
                </li>
                <li>
                    <strong>Информация</strong> — дата и время публикации, тип истории (photo/video), статусные бейджи:
                    <ul>
                        <li><strong>"Активна"</strong> (зелёный) — история ещё доступна в ВКонтакте</li>
                        <li><strong>"Архив"</strong> (серый) — история удалена или истекла</li>
                        <li><strong>"Наш сервис"</strong> (индиго) — опубликовано автоматически</li>
                        <li><strong>"Вручную"</strong> (оранжевый) — опубликовано кнопкой "Опубликовать"</li>
                    </ul>
                </li>
                <li>
                    <strong>Статистика</strong> — адаптивная сетка с 8 мини-карточками (на больших экранах в один ряд, на маленьких — 2×4):
                    <ul>
                        <li>Просм. (индиго)</li>
                        <li>Лайки (розовый)</li>
                        <li>Ответы (синий)</li>
                        <li>Клики (зелёный)</li>
                        <li>Репосты (фиолетовый)</li>
                        <li>Подп. (янтарный)</li>
                        <li>Скрытия (красный)</li>
                        <li>ЛС (голубой)</li>
                    </ul>
                    Если детальная статистика не загружена, показывается только количество просмотров и плашка "Нажмите 'Обновить' для загрузки".
                </li>
                <li>
                    <strong>Действия</strong> — ссылка на историю в ВКонтакте (открывается в новой вкладке) и кнопка "Обновить" 
                    для загрузки статистики конкретной истории.
                </li>
            </ol>

            <Sandbox
                title="Пример строк таблицы"
                description="Три истории с разными статусами и типами статистики."
            >
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-base font-semibold text-gray-900">
                            История публикаций <span className="text-gray-400 font-normal ml-1">3 истории</span>
                        </h3>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Превью</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Информация</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статистика</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                <MockStoryRow 
                                    hasPreview={true}
                                    date="17 фев, 14:30"
                                    type="photo"
                                    isActive={true}
                                    isAutomated={true}
                                    hasStats={true}
                                />
                                <MockStoryRow 
                                    hasPreview={true}
                                    date="16 фев, 10:15"
                                    type="video"
                                    isActive={true}
                                    isAutomated={false}
                                    hasStats={false}
                                />
                                <MockStoryRow 
                                    hasPreview={false}
                                    date="15 фев, 18:45"
                                    type="photo"
                                    isActive={false}
                                    isAutomated={true}
                                    hasStats={true}
                                />
                            </tbody>
                        </table>
                    </div>
                </div>
            </Sandbox>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Особенности таблицы</h3>

            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li>
                    <strong>При наведении курсора на превью</strong> изображение увеличивается и показывается поверх страницы. 
                    Это позволяет быстро проверить качество изображения без открытия полноэкранного режима.
                </li>
                <li>
                    <strong>Строки подсвечиваются</strong> при наведении курсора (светло-серый фон) для удобства чтения.
                </li>
                <li>
                    <strong>Плавная анимация появления</strong> — каждая строка появляется с небольшой задержкой (30ms на строку), 
                    создавая эффект постепенной загрузки.
                </li>
                <li>
                    <strong>Адаптивная сетка статистики</strong> — на широких экранах все 8 метрик в один ряд, 
                    на средних — 4×2, на узких — 2×4.
                </li>
                <li>
                    <strong>Пустое состояние</strong> — если историй нет, показывается иконка архива с текстом 
                    "Опубликуйте первую историю или включите автоматизацию."
                </li>
            </ul>
        </>
    );
};
