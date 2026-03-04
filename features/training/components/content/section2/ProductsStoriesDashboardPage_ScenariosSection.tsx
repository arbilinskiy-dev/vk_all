import React from 'react';

// =====================================================================
// Раздел 4: Сценарии использования дашборда + финальные советы
// =====================================================================

export const ScenariosSection: React.FC = () => (
    <>
        {/* РАЗДЕЛ 4: СЦЕНАРИИ ИСПОЛЬЗОВАНИЯ ДАШБОРДА */}
        <hr className="!my-10" />
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">4. Сценарии использования дашборда</h2>
        
        <p className="!text-base !leading-relaxed !text-gray-700">
            Дашборд — это не просто набор цифр. Это инструмент для принятия решений. 
            Вот три частых сценария, когда дашборд особенно полезен.
        </p>

        <div className="not-prose space-y-6 mt-6">
            {/* Сценарий 1 */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-3 border-b border-purple-200">
                    <h3 className="font-bold text-purple-900">Сценарий 1: Сравнение ручных и автоматических историй</h3>
                </div>
                <div className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="bg-purple-100 rounded-full p-2 mt-0.5">
                            <span className="text-purple-700 font-bold text-sm">1</span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Выберите фильтр "Наш сервис"</p>
                            <p className="text-sm text-gray-600">Посмотрите статистику автоматических историй (CTR, ER, охваты)</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="bg-purple-100 rounded-full p-2 mt-0.5">
                            <span className="text-purple-700 font-bold text-sm">2</span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Переключите на "Вручную"</p>
                            <p className="text-sm text-gray-600">Сравните показатели с ручными историями</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="bg-purple-100 rounded-full p-2 mt-0.5">
                            <span className="text-purple-700 font-bold text-sm">3</span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Сделайте выводы</p>
                            <p className="text-sm text-gray-600">
                                Если автоматические истории показывают лучший CTR и ER — продолжайте использовать автоматизацию. 
                                Если хуже — проверьте настройки шаблонов и изображения товаров.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Сценарий 2 */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-3 border-b border-orange-200">
                    <h3 className="font-bold text-orange-900">Сценарий 2: Анализ эффективности недели</h3>
                </div>
                <div className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="bg-orange-100 rounded-full p-2 mt-0.5">
                            <span className="text-orange-700 font-bold text-sm">1</span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Выберите "За неделю"</p>
                            <p className="text-sm text-gray-600">Дашборд покажет результаты последних 7 дней</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="bg-orange-100 rounded-full p-2 mt-0.5">
                            <span className="text-orange-700 font-bold text-sm">2</span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Посмотрите на графики трендов</p>
                            <p className="text-sm text-gray-600">
                                Линия показов растёт → хорошо, публикуем регулярно<br/>
                                Линия падает → возможно, снизилась частота публикаций или упало качество
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="bg-orange-100 rounded-full p-2 mt-0.5">
                            <span className="text-orange-700 font-bold text-sm">3</span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Проверьте ER и CTR</p>
                            <p className="text-sm text-gray-600">
                                Если показатели упали по сравнению с прошлой неделей — пересмотрите контент и ссылки
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Сценарий 3 */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 px-4 py-3 border-b border-cyan-200">
                    <h3 className="font-bold text-cyan-900">Сценарий 3: Подготовка отчёта для руководителя</h3>
                </div>
                <div className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="bg-cyan-100 rounded-full p-2 mt-0.5">
                            <span className="text-cyan-700 font-bold text-sm">1</span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Выберите "За месяц"</p>
                            <p className="text-sm text-gray-600">Соберите данные за последние 30 дней</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="bg-cyan-100 rounded-full p-2 mt-0.5">
                            <span className="text-cyan-700 font-bold text-sm">2</span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Запишите ключевые метрики</p>
                            <p className="text-sm text-gray-600">
                                • Сумма показов (охват)<br/>
                                • Эквивалент в рекламе (экономия бюджета)<br/>
                                • ER View (вовлечённость)<br/>
                                • Количество историй (объём контента)
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="bg-cyan-100 rounded-full p-2 mt-0.5">
                            <span className="text-cyan-700 font-bold text-sm">3</span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Сформулируйте выводы</p>
                            <p className="text-sm text-gray-600">
                                Пример: "За месяц опубликовали 45 историй, получили 18,500 просмотров, 
                                сэкономили 2,775₽ на рекламе, ER составил 3.2% (нормальный уровень)"
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Финальный блок с советами */}
        <div className="not-prose bg-green-50 border border-green-200 rounded-lg p-4 mt-8">
            <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-green-800">
                    <p className="font-semibold mb-1">Полезные советы</p>
                    <ul className="space-y-1 ml-4">
                        <li>• <strong>Проверяйте дашборд регулярно</strong> — раз в неделю для отслеживания динамики</li>
                        <li>• <strong>Сравнивайте периоды</strong> — смотрите, как меняются показатели от недели к неделе</li>
                        <li>• <strong>Обращайте внимание на скрытия</strong> — если их много, контент не нравится аудитории</li>
                        <li>• <strong>Используйте графики</strong> — они показывают тренды лучше, чем цифры</li>
                    </ul>
                </div>
            </div>
        </div>
    </>
);
