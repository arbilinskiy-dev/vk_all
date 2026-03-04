import React from 'react';
import { Sandbox } from '../shared';
import { MockDeliveryLogs } from './ProductsReviewsContestLogsPage_Mocks';

// =====================================================================
// Секция «Журнал отправки призов» — таблица, статусы, кнопки + песочница
// =====================================================================

export const DeliverySection: React.FC = () => (
    <>
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                Журнал отправки призов
            </h2>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Журнал отправки — это отдельная таблица, где записывается каждая попытка отправить промокод победителю. Здесь можно увидеть: кто получил приз, у кого возникла ошибка, и повторить отправку одной кнопкой.
            </p>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
                Структура таблицы (6 колонок)
            </h3>
            <div className="not-prose my-6 overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Колонка</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Что показывает</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-gray-300 px-4 py-2"><strong>Пользователь</strong></td>
                            <td className="border border-gray-300 px-4 py-2">ФИО победителя + ссылка на его профиль ВКонтакте</td>
                        </tr>
                        <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2"><strong>Выданный приз (Код)</strong></td>
                            <td className="border border-gray-300 px-4 py-2">Промокод (например, PROMO500) + описание (Скидка 500₽)</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-4 py-2"><strong>Статус отправки</strong></td>
                            <td className="border border-gray-300 px-4 py-2">Зелёный бэдж "Доставлено (ЛС)" или красный "Ошибка ЛС"</td>
                        </tr>
                        <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2"><strong>Время</strong></td>
                            <td className="border border-gray-300 px-4 py-2">Дата и время попытки отправки</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-4 py-2"><strong>Чат</strong></td>
                            <td className="border border-gray-300 px-4 py-2">Иконка сообщений — ссылка на диалог с пользователем ВКонтакте</td>
                        </tr>
                        <tr className="bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2"><strong>Действия</strong></td>
                            <td className="border border-gray-300 px-4 py-2">Кнопка "Повторить" (появляется только при ошибке)</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
                Статусы отправки
            </h3>
            <div className="not-prose grid md:grid-cols-2 gap-6 my-6">
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-3">
                        Доставлено (ЛС)
                    </span>
                    <p className="text-sm text-green-900">
                        Промокод успешно отправлен в личные сообщения пользователю. Победитель получил приз.
                    </p>
                </div>

                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex flex-col gap-1 mb-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 w-fit">
                            Ошибка ЛС
                        </span>
                        <span className="text-xs text-gray-600">Отправлен комментарий</span>
                    </div>
                    <p className="text-sm text-red-900">
                        Не удалось отправить ЛС (закрытые сообщения), но система автоматически опубликовала промокод в комментарии под постом победителя.
                    </p>
                </div>
            </div>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
                Управляющие кнопки
            </h3>
            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li>
                    <strong>Повторить всем (N)</strong> — появляется, если есть ошибки. Автоматически повторяет отправку всем пользователям со статусом «Ошибка ЛС». Кнопка синяя (indigo).
                </li>
                <li>
                    <strong>Очистить журнал</strong> — удаляет все записи из таблицы (доступно только администраторам). Это не влияет на базу промокодов! Кнопка красная с красной обводкой.
                </li>
                <li>
                    <strong>Повторить</strong> (в каждой строке с ошибкой) — повторная попытка отправки сообщения конкретному пользователю. Кнопка с синей обводкой на синем фоне.
                </li>
            </ul>
        </section>

        {/* Песочница: Журнал отправки */}
        <div className="not-prose">
            <Sandbox
                title="📋 Интерактивная демонстрация: Журнал отправки призов"
                description="Так выглядит таблица журнала отправки в реальном приложении. Здесь видно все попытки доставки промокодов победителям."
                instructions={[
                    'В шапке таблицы — <strong>статистика</strong>: сколько успешно отправлено (зелёный) и сколько ошибок (красный)',
                    'Для записей с ошибкой доступна кнопка <strong>"Повторить"</strong> — система попробует отправить ЛС ещё раз',
                    'Иконка сообщений в колонке "Чат" открывает диалог с пользователем ВКонтакте (в приложении сообществ)',
                    'При наведении на строку она подсвечивается серым — так удобнее читать длинные таблицы'
                ]}
            >
                <MockDeliveryLogs />
            </Sandbox>
        </div>
    </>
);
