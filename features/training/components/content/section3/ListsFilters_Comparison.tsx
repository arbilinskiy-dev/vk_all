import React from 'react';

// =====================================================================
// Секция «Sticky-поведение + Сравнение Было/Стало + Реальный кейс»
// =====================================================================
export const FiltersComparisonSection: React.FC = () => {
    return (
        <>
            {/* Закреплённая панель (Sticky) */}
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Закреплённая панель (Sticky)</h2>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Панель фильтров имеет CSS-класс <code className="px-2 py-1 bg-gray-100 text-sm rounded">sticky top-0 z-20</code>, что означает:
            </p>

            <div className="not-prose my-6 space-y-3">
                <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex-shrink-0 px-2 py-1 bg-purple-600 text-white text-xs font-mono rounded">sticky</div>
                    <span className="text-sm text-gray-700">
                        При прокрутке таблицы вниз панель остаётся на экране
                    </span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex-shrink-0 px-2 py-1 bg-indigo-600 text-white text-xs font-mono rounded">top-0</div>
                    <span className="text-sm text-gray-700">
                        Прилипает к верхнему краю окна браузера
                    </span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex-shrink-0 px-2 py-1 bg-emerald-600 text-white text-xs font-mono rounded">z-20</div>
                    <span className="text-sm text-gray-700">
                        Отображается поверх заголовков таблицы (которые имеют <code>z-10</code>)
                    </span>
                </div>
            </div>

            <p className="!text-base !leading-relaxed !text-gray-700">
                Благодаря этому вы можете прокрутить таблицу на 1000 строк вниз, но фильтры всё равно останутся доступными — не нужно возвращаться к началу страницы, чтобы изменить условия отбора.
            </p>

            <hr className="!my-10" />

            {/* Зачем это нужно? */}
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Зачем это нужно?</h2>
            
            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Было: прокрутка тысяч строк вручную</h3>
            <div className="not-prose my-6">
                <div className="border-l-4 border-red-400 bg-red-50 p-4 rounded-r-lg">
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex gap-2">
                            <span className="text-red-500">❌</span>
                            <span>В сообществе 15 000 подписчиков — найти нужного вручную невозможно</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-red-500">❌</span>
                            <span>Нужны только женщины 20-30 лет из Москвы — выписывать ID вручную часами</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-red-500">❌</span>
                            <span>Невозможно быстро отсеять удалённые аккаунты</span>
                        </li>
                    </ul>
                </div>
            </div>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Стало: мгновенная фильтрация</h3>
            <div className="not-prose my-6">
                <div className="border-l-4 border-emerald-400 bg-emerald-50 p-4 rounded-r-lg">
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex gap-2">
                            <span className="text-emerald-500">✅</span>
                            <span><strong>Мгновенный поиск</strong> — введите имя или ID, получите результат за секунду</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-emerald-500">✅</span>
                            <span><strong>Комбинация фильтров</strong> — женщины + 20-30 + Москва + активны сегодня = 342 человека за 1 клик</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-emerald-500">✅</span>
                            <span><strong>Счётчик результатов</strong> — сразу видно, сколько пользователей подходит под условия</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-emerald-500">✅</span>
                            <span><strong>Кнопка "Сбросить"</strong> — вернуться к исходному состоянию одним кликом</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Реальный кейс */}
            <div className="not-prose my-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                <h4 className="text-lg font-bold text-indigo-900 mb-3">💡 Реальный кейс</h4>
                <p className="text-sm text-gray-700 mb-3">
                    Нужно отправить рассылку про студенческую скидку только активным подписчикам 18-25 лет.
                </p>
                <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex gap-2">
                        <span className="font-bold text-indigo-700">1.</span>
                        <span>Открываете список "В рассылке"</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-bold text-indigo-700">2.</span>
                        <span>Фильтр "Возраст" → выбираете "20-25"</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-bold text-indigo-700">3.</span>
                        <span>Фильтр "Статус" → "Активен"</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-bold text-indigo-700">4.</span>
                        <span>Фильтр "Онлайн" → "3 дня"</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="font-bold text-indigo-700">5.</span>
                        <span><strong>Результат:</strong> "Найдено: 842" — за 10 секунд вместо нескольких часов ручной работы</span>
                    </div>
                </div>
            </div>
        </>
    );
};
