/**
 * Секция «Введение» страницы обучения «Конкурс отзывов».
 * Содержит описание функции, сравнение «до/после» и flow-диаграмму работы.
 */
import React from 'react';

export const IntroSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Что это за функция?</h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            <strong>Конкурс отзывов</strong> — это полностью автоматизированный розыгрыш призов за отзывы клиентов в VK. 
            Система сама находит посты с ключевым словом (например, <code>#отзыв</code>), регистрирует участников, 
            подводит итоги и вручает промокоды победителям.
        </p>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Зачем это нужно?</h3>
        <div className="not-prose bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 p-6 rounded-r-lg my-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="text-base font-bold text-indigo-900 mb-3">❌ Раньше (вручную)</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li>🔍 Ежедневный поиск отзывов по хештегу</li>
                        <li>💬 Ручная регистрация каждого участника</li>
                        <li>🎲 Случайный выбор победителя</li>
                        <li>✉️ Отправка промокода в ЛС вручную</li>
                        <li>📝 Публикация итогов на стене</li>
                        <li>⏱️ <strong>Время:</strong> ~2 часа в неделю</li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-base font-bold text-green-900 mb-3">✅ Теперь (автоматически)</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li>🤖 Система сама собирает посты с <code>#отзыв</code></li>
                        <li>💬 Автоматическая регистрация с номером участника</li>
                        <li>🎉 Подведение итогов в заданный день/количество</li>
                        <li>✉️ Автоматическая отправка промокода победителям</li>
                        <li>📢 Автоматический пост с результатами</li>
                        <li>⏱️ <strong>Время:</strong> 10 минут на загрузку промокодов</li>
                    </ul>
                </div>
            </div>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Как это работает?</h3>
        <div className="not-prose my-6">
            <div className="flex items-center gap-4 overflow-x-auto pb-4">
                {[
                    { num: 1, icon: '🔍', title: 'Сбор постов', desc: 'Система ищет посты с ключевым словом' },
                    { num: 2, icon: '💬', title: 'Регистрация', desc: 'Под каждым постом оставляется комментарий с номером' },
                    { num: 3, icon: '🎉', title: 'Подведение итогов', desc: 'В заданный день/количество выбирается победитель' },
                    { num: 4, icon: '🎁', title: 'Вручение приза', desc: 'Промокод отправляется в ЛС победителю' },
                    { num: 5, icon: '📢', title: 'Публикация', desc: 'Пост с итогами размещается на стене' }
                ].map((step, idx) => (
                    <div key={idx} className="flex-shrink-0 w-48 bg-white border-2 border-indigo-200 rounded-lg p-4 text-center">
                        <div className="text-4xl mb-2">{step.icon}</div>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">{step.num}</span>
                            <p className="font-bold text-sm text-gray-900">{step.title}</p>
                        </div>
                        <p className="text-xs text-gray-600">{step.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);
