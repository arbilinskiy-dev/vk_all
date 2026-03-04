import React from 'react';

// =====================================================================
// Секция «Введение» + «Было/Стало» — страница логов конкурса отзывов
// =====================================================================

export const IntroSection: React.FC = () => (
    <>
        {/* Введение */}
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                Что такое логи в автоматизации конкурсов
            </h2>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Логи — это история всех событий, которые происходят в системе конкурсов. В приложении есть два типа логов:
            </p>
            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li><strong>Системные логи</strong> — показывают работу автоматизации в реальном времени (поиск постов, комментарии, ошибки VK API)</li>
                <li><strong>Журнал отправки призов</strong> — фиксирует каждую попытку отправить промокод победителю (успешно или с ошибкой)</li>
            </ul>
            <p className="!text-base !leading-relaxed !text-gray-700">
                Это как журнал действий: раньше приходилось помнить всё в голове («кому отправил, кому нет»), теперь система записывает каждое действие с временем и статусом.
            </p>
        </section>

        <hr className="!my-10" />

        {/* Было/Стало */}
        <section>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
                Было/Стало: От хаоса к контролю
            </h2>
            <div className="not-prose grid md:grid-cols-2 gap-6 my-6">
                {/* БЫЛО */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-red-800 mb-4">❌ Было (без логов)</h3>
                    <ul className="space-y-3 text-sm text-red-900">
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>Не понятно, почему конкурс не находит новые посты — приходится вручную проверять ВКонтакте</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>При ошибках отправки не понятно, кто из победителей не получил приз</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>Нет истории — не можем понять, когда и почему возникла проблема</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>Приходится писать вручную: кому отправлено, кому нужно повторить</span>
                        </li>
                    </ul>
                </div>

                {/* СТАЛО */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-green-800 mb-4">✅ Стало (с логами)</h3>
                    <ul className="space-y-3 text-sm text-green-900">
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>Видно в реальном времени: сколько постов найдено, сколько прокомментировано</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>Все ошибки записываются с описанием — легко понять причину</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>Журнал отправки показывает: кому доставлено, у кого ошибка, с кнопкой «Повторить»</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>История сохраняется — можно разобраться в проблеме через день или неделю</span>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    </>
);
