import React from 'react';

// =====================================================================
// FAQ, совет эксперта и итоговый блок обзора модуля «Контент-менеджмент»
// =====================================================================
export const FAQAndSummary: React.FC = () => (
    <>
        {/* FAQ */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Часто задаваемые вопросы</h2>
        <div className="not-prose space-y-4 my-8">
            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-bold text-gray-900 cursor-pointer">
                    Как переключаться между проектами?
                </summary>
                <p className="text-sm text-gray-700 mt-2">
                    Используйте сайдбар проектов (вторая колонка). Просто кликните по нужному проекту в списке, и рабочая область обновится.
                </p>
            </details>
            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-bold text-gray-900 cursor-pointer">
                    Зачем нужны фильтры в сайдбаре проектов?
                </summary>
                <p className="text-sm text-gray-700 mt-2">
                    Фильтры помогают быстро найти нужные проекты. Вы можете фильтровать по команде (В, С, А) или по количеству отложенных постов (пустые, 1-5, более 10).
                </p>
            </details>
            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-bold text-gray-900 cursor-pointer">
                    Что означают цветные счётчики рядом с проектами?
                </summary>
                <p className="text-sm text-gray-700 mt-2">
                    Счётчики показывают количество отложенных постов: красный — нет постов (0), оранжевый — мало постов (1-4), зелёный — много постов (больше 10), серый — средне (5-10).
                </p>
            </details>
            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-bold text-gray-900 cursor-pointer">
                    Можно ли работать с несколькими проектами одновременно?
                </summary>
                <p className="text-sm text-gray-700 mt-2">
                    Нет, в рабочей области отображается только один проект за раз. Но вы можете быстро переключаться между проектами через сайдбар.
                </p>
            </details>
        </div>

        <hr className="!my-10" />

        {/* Совет эксперта */}
        <div className="not-prose bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 p-6 rounded-r-lg my-8">
            <div className="flex items-start gap-4">
                <div className="text-4xl">💡</div>
                <div>
                    <h3 className="font-bold text-indigo-900 text-lg mb-2">Совет эксперта</h3>
                    <p className="text-sm text-gray-700">
                        Начни с раздела 2.1 "Вкладка Отложенные" — это самая используемая часть модуля, где ты будешь проводить больше всего времени. Изучи работу с календарём, и остальные вкладки покажутся простыми.
                    </p>
                </div>
            </div>
        </div>

        <hr className="!my-10" />

        {/* Итоги */}
        <div className="not-prose bg-gray-100 border border-gray-300 rounded-lg p-6 my-8">
            <h3 className="font-bold text-gray-900 text-lg mb-3">Итоги: что нужно запомнить</h3>
            <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Модуль состоит из 3 вкладок (Отложенные, Предложенные, Товары) + секция Автоматизации</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Интерфейс имеет 3 колонки: главная панель, сайдбар проектов, рабочая область</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Сайдбар проектов общий для всех вкладок — фильтруй, ищи, переключайся</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Цветные счётчики помогают быстро оценить количество контента в проекте</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Рабочая область меняется в зависимости от выбранной вкладки</span>
                </li>
            </ul>
        </div>
    </>
);
