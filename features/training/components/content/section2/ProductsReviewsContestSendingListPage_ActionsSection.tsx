import React from 'react';

// =====================================================================
// Секция «Иконка чата» + «Повторная отправка промокодов»
// =====================================================================

export const ActionsSection: React.FC = () => (
    <>
        {/* Иконка чата */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Иконка чата (диалог с победителем)</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            В колонке "Чат" есть иконка диалога (три точки). При клике она открывает переписку ВКонтакте с победителем.
        </p>

        <div className="not-prose my-6 flex items-start gap-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <button className="text-gray-400 hover:text-indigo-600 inline-flex items-center justify-center p-1.5 rounded-full hover:bg-indigo-50 transition-colors border border-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </button>
            <div className="flex-1">
                <p className="text-sm text-indigo-900 font-semibold mb-1">Зачем нужна эта иконка?</p>
                <p className="text-xs text-indigo-800">
                    Если победитель пишет вам "Не получил промокод" или задаёт вопросы, не нужно искать его в сообщениях вручную. 
                    Просто кликните на иконку чата — откроется диалог с этим пользователем в новой вкладке.
                </p>
                <p className="text-xs text-indigo-700 mt-2">
                    <strong>Цвет:</strong> Серый по умолчанию, при наведении становится indigo-600 с фоном indigo-50.
                </p>
            </div>
        </div>

        <hr className="!my-10" />

        {/* Кнопки повторной отправки */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Повторная отправка промокодов</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Если у записи статус "Ошибка ЛС", доступны два варианта повторной отправки:
        </p>

        <div className="not-prose my-6 space-y-4">
            {/* Одиночная кнопка «Повторить» */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <button className="text-xs font-medium text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors flex-shrink-0">
                        Повторить
                    </button>
                    <div>
                        <p className="font-semibold text-gray-900">Кнопка "Повторить" (одиночная)</p>
                        <p className="text-sm text-gray-700 mt-1">
                            Находится в последней колонке таблицы, только у записей со статусом ошибки. 
                            При нажатии система попытается снова отправить промокод в личные сообщения этому конкретному победителю.
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            <strong>Когда использовать:</strong> Если победитель написал вам, что открыл ЛС и готов принять сообщение.
                        </p>
                    </div>
                </div>
            </div>

            {/* Массовая кнопка «Повторить всем» */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <button className="px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 flex-shrink-0">
                        Повторить всем (4)
                    </button>
                    <div>
                        <p className="font-semibold text-gray-900">Кнопка "Повторить всем (N)"</p>
                        <p className="text-sm text-gray-700 mt-1">
                            Находится в шапке таблицы, появляется только если есть хотя бы одна запись с ошибкой. 
                            В скобках показано количество ошибок. При нажатии система попытается повторно отправить в ЛС ВСЕМ пользователям со статусом ошибки.
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            <strong>Когда использовать:</strong> Если вы знаете, что была временная проблема с API ВКонтакте, или хотите попробовать отправить всем разом.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Предупреждение о дубликатах */}
        <div className="not-prose bg-yellow-50 border-l-4 border-yellow-400 p-4 my-6">
            <p className="text-sm text-yellow-900">
                <strong>⚠️ Важно:</strong> Повторная отправка НЕ создаёт дубликаты промокодов. 
                Система просто пытается отправить тот же самый промокод снова, но уже в ЛС вместо комментария.
            </p>
        </div>
    </>
);
