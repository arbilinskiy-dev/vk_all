/**
 * Секция «Лист отправок» страницы обучения «Конкурс отзывов».
 * Содержит описание функций журнала, повторной отправки и mock-пример записей.
 */
import React from 'react';

export const DispatchLogSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Вкладка "Лист отправок"</h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            История попыток отправки промокодов победителям. Здесь можно увидеть, 
            кому удалось доставить приз, а у кого возникли проблемы.
        </p>

        {/* Функции журнала */}
        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Функции журнала</h3>
        <div className="not-prose my-6">
            <div className="flex flex-wrap gap-3 mb-4">
                <button className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2">
                    Повторить всем ошибкам
                </button>
                <button className="px-4 py-2 text-sm font-medium rounded-md border border-red-300 text-red-600 bg-white hover:bg-red-50 flex items-center gap-2">
                    Очистить журнал
                </button>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
                <li><strong>Повторить всем ошибкам:</strong> Отправить промокоды всем, у кого не удалось с первого раза</li>
                <li><strong>Очистить журнал:</strong> Удалить всю историю отправок (необратимо, только для администраторов)</li>
                <li><strong>Повторить (для одного):</strong> Попробовать отправить промокод конкретному пользователю еще раз</li>
            </ul>
        </div>

        {/* Когда нужна повторная отправка */}
        <div className="not-prose my-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-sm font-semibold text-blue-900 mb-2">💡 Когда нужна повторная отправка?</p>
            <ul className="space-y-1 text-sm text-gray-700">
                <li>• У пользователя были закрыты ЛС, но теперь он их открыл</li>
                <li>• Произошла временная ошибка VK API</li>
                <li>• Промокод был отправлен, но пользователь его не получил</li>
            </ul>
        </div>

        {/* Пример журнала */}
        <div className="not-prose my-6">
            <div className="bg-white rounded-lg border-2 border-gray-300 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Успешно: 15
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            Ошибки: 2
                        </span>
                    </div>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 rounded p-3 border border-gray-200">
                    <p className="font-semibold mb-2">Пример записей журнала:</p>
                    <div className="space-y-2 font-mono">
                        <div className="flex justify-between">
                            <span>18.02.2026 14:40 | Мария Смирнова | WIN_X7Z</span>
                            <span className="text-green-600 font-semibold">Отправлено (ЛС)</span>
                        </div>
                        <div className="flex justify-between">
                            <span>11.02.2026 18:15 | Дмитрий Соколов | WIN_A3B</span>
                            <span className="text-red-600 font-semibold">Ошибка (ЛС закрыто)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);
