import React from 'react';

// =====================================================================
// Секция «Советы по использованию» + «Очистка журнала» + FAQ
// =====================================================================

export const TipsAndFAQ: React.FC = () => (
    <>
        {/* Советы по использованию */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Когда использовать этот журнал</h2>

        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-bold text-purple-900 mb-2">🔍 Проверка доставки</h3>
                <p className="text-sm text-purple-800">
                    Если победитель пишет "Не получил промокод", откройте журнал и найдите его по имени. 
                    Вы сразу увидите: отправлялось ли сообщение, какой был статус, когда это произошло.
                </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-bold text-purple-900 mb-2">🔄 Повторная отправка</h3>
                <p className="text-sm text-purple-800">
                    Если у нескольких победителей статус "Ошибка ЛС", можете попробовать массовую повторную отправку. 
                    Возможно, они уже открыли личные сообщения и смогут получить промокод удобным способом.
                </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-bold text-purple-900 mb-2">💬 Быстрая связь</h3>
                <p className="text-sm text-purple-800">
                    Используйте иконку чата для мгновенного перехода в диалог с победителем. 
                    Не нужно искать его в сообщениях — один клик и вы в переписке.
                </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-bold text-purple-900 mb-2">📊 Статистика конкурса</h3>
                <p className="text-sm text-purple-800">
                    Счётчики показывают общую картину: сколько промокодов доставлено успешно, у скольких были проблемы. 
                    Это помогает оценить качество работы конкурса.
                </p>
            </div>
        </div>

        <hr className="!my-10" />

        {/* Очистка журнала (админ-функция) */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Очистка журнала (только для администраторов)</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            В шапке таблицы есть кнопка "Очистить журнал" — она видна только пользователям с ролью <code>admin</code>.
        </p>

        <div className="not-prose bg-red-50 border border-red-200 rounded-lg p-4 my-6">
            <div className="flex items-start gap-3">
                <button className="px-3 py-1.5 text-sm font-medium rounded-md border border-red-300 text-red-600 bg-white hover:bg-red-50 flex-shrink-0">
                    Очистить журнал
                </button>
                <div>
                    <p className="text-sm text-red-900 font-semibold mb-1">Функция для очистки истории отправок</p>
                    <p className="text-xs text-red-800 mb-2">
                        При нажатии удаляются ВСЕ записи из журнала отправок. Это полезно, если нужно "обнулить" историю перед новым циклом конкурса.
                    </p>
                    <p className="text-xs text-red-700">
                        <strong>⚠️ Важно:</strong> Очистка журнала НЕ влияет на базу промокодов. 
                        Выданные промокоды остаются помечены как "Выдан" во вкладке "Промокоды". Удаляется только история сообщений.
                    </p>
                </div>
            </div>
        </div>

        <hr className="!my-10" />

        {/* Частые вопросы */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Частые вопросы</h2>

        <div className="not-prose space-y-4 my-6">
            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">Что делать, если победитель пишет "Не получил промокод"?</summary>
                <p className="text-sm text-gray-700 mt-2">
                    1. Откройте журнал отправки и найдите его по имени.<br/>
                    2. Проверьте статус: если "Доставлено (ЛС)" — скажите победителю проверить личные сообщения от вашего сообщества.<br/>
                    3. Если "Ошибка ЛС" — скажите победителю посмотреть комментарии под его постом-отзывом, там есть промокод.<br/>
                    4. Если победитель говорит, что открыл ЛС — нажмите кнопку "Повторить" для повторной отправки.
                </p>
            </details>

            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">Почему так много записей со статусом "Ошибка ЛС"?</summary>
                <p className="text-sm text-gray-700 mt-2">
                    Это нормально! Многие пользователи ВКонтакте запрещают личные сообщения от сообществ в настройках приватности. 
                    Но промокоды всё равно доставлены — они отправлены комментариями под постами победителей. 
                    Высокий процент ошибок ЛС не означает проблему с системой.
                </p>
            </details>

            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">Можно ли удалить отдельную запись из журнала?</summary>
                <p className="text-sm text-gray-700 mt-2">
                    Нет, удаление отдельных записей не предусмотрено. Доступна только полная очистка журнала (кнопка "Очистить журнал" для администраторов). 
                    Журнал — это архив для контроля, изменять его вручную не имеет смысла.
                </p>
            </details>

            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">Что происходит при повторной отправке?</summary>
                <p className="text-sm text-gray-700 mt-2">
                    Система пытается снова отправить промокод в личные сообщения победителю. 
                    Если ЛС всё ещё закрыто — статус останется "Ошибка ЛС" (промокод уже есть в комментарии). 
                    Если ЛС открыто — статус изменится на "Доставлено (ЛС)" и победитель получит уведомление в диалогах.
                </p>
            </details>

            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer">Зачем нужна кнопка "Повторить всем", если промокоды уже в комментариях?</summary>
                <p className="text-sm text-gray-700 mt-2">
                    Промокод в комментарии менее удобен для пользователя: комментарий может потеряться, его сложнее найти. 
                    Личное сообщение — это более надёжный и приватный способ доставки. 
                    Кнопка "Повторить всем" полезна, если вы хотите улучшить пользовательский опыт и попробовать доставить промокоды в ЛС после того, как победители открыли настройки приватности.
                </p>
            </details>
        </div>
    </>
);
