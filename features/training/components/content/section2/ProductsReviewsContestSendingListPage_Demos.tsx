import React, { useState } from 'react';

// =====================================================================
// Демо-компоненты для интерактивных песочниц страницы журнала отправки
// =====================================================================

/**
 * Демо: Статусы доставки — переключение между «Доставлено» и «Ошибка»
 */
export const DeliveryStatusesDemo: React.FC = () => {
    const [selectedStatus, setSelectedStatus] = useState<'sent' | 'error'>('sent');

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">Выберите статус:</p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setSelectedStatus('sent')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            selectedStatus === 'sent'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                    >
                        Доставлено
                    </button>
                    <button
                        onClick={() => setSelectedStatus('error')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            selectedStatus === 'error'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                    >
                        Ошибка
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Отображение в таблице:</p>
                {selectedStatus === 'sent' ? (
                    <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Доставлено (ЛС)
                        </span>
                        <div className="mt-3 text-sm text-gray-700">
                            <p className="font-semibold text-green-700">✓ Сообщение доставлено через личные сообщения</p>
                            <p className="text-xs text-gray-500 mt-1">Система успешно отправила промокод в личные сообщения ВКонтакте. Победитель получил уведомление.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit">
                            Ошибка ЛС
                        </span>
                        <span className="text-[10px] text-gray-500">Отправлен комментарий</span>
                        <div className="mt-3 text-sm text-gray-700">
                            <p className="font-semibold text-red-700">⚠️ Личные сообщения закрыты</p>
                            <p className="text-xs text-gray-500 mt-1">Система не смогла отправить в ЛС (пользователь закрыл личные сообщения от сообществ). 
                            Но промокод НЕ потерян — он автоматически отправлен комментарием под постом победителя.</p>
                            <p className="text-xs text-indigo-600 mt-2"><strong>Доступно действие:</strong> Кнопка "Повторить" — попытка отправить снова в ЛС.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Демо: Счётчики и кнопка массовой повторной отправки
 */
export const CountersAndActionsDemo: React.FC = () => {
    const [sentCount, setSentCount] = useState(23);
    const [errorCount, setErrorCount] = useState(4);
    const [isRetrying, setIsRetrying] = useState(false);

    const handleRetryAll = () => {
        setIsRetrying(true);
        setTimeout(() => {
            // Имитация успешной повторной отправки
            setSentCount(prev => prev + errorCount);
            setErrorCount(0);
            setIsRetrying(false);
        }, 2000);
    };

    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Журнал отправки призов</h3>
                <div className="flex items-center gap-4">
                    <div className="flex gap-4 text-sm mr-4">
                        <span className="text-green-600">Успешно: <strong>{sentCount}</strong></span>
                        <span className="text-red-500">Ошибки: <strong>{errorCount}</strong></span>
                    </div>
                    {errorCount > 0 && (
                        <button
                            onClick={handleRetryAll}
                            disabled={isRetrying}
                            className="px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2"
                        >
                            {isRetrying && <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            Повторить всем ({errorCount})
                        </button>
                    )}
                </div>
            </div>
            <div className="p-4 text-sm text-gray-600">
                <p className="mb-2">
                    <strong>Счётчик "Успешно"</strong> (зелёный) — сколько промокодов доставлено через ЛС.
                </p>
                <p className="mb-2">
                    <strong>Счётчик "Ошибки"</strong> (красный) — сколько не удалось отправить в ЛС (но отправлены комментарием).
                </p>
                <p>
                    <strong>Кнопка "Повторить всем"</strong> — появляется только если есть ошибки. Нажмите, чтобы попробовать отправить повторно всем пользователям со статусом ошибки.
                </p>
            </div>
        </div>
    );
};

/**
 * Демо: Таблица отправок с mock-данными
 */
export const SendingTableDemo: React.FC = () => {
    // Мок-данные для демо-таблицы
    const mockLogs = [
        {
            id: '1',
            userName: 'Иван Петров',
            userId: 123456789,
            promoCode: 'PROMO500',
            prizeDesc: 'Скидка 500₽ на заказ',
            status: 'sent' as const,
            time: '15.02.2026, 14:30'
        },
        {
            id: '2',
            userName: 'Мария Сидорова',
            userId: 987654321,
            promoCode: 'SALE30OFF',
            prizeDesc: 'Скидка 30% на всё меню',
            status: 'error' as const,
            time: '15.02.2026, 14:35'
        },
        {
            id: '3',
            userName: 'Алексей Смирнов',
            userId: 555666777,
            promoCode: 'FREESHIP',
            prizeDesc: 'Бесплатная доставка',
            status: 'sent' as const,
            time: '15.02.2026, 14:40'
        }
    ];

    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                        <tr>
                            <th className="px-4 py-3">Пользователь</th>
                            <th className="px-4 py-3">Выданный приз (Код)</th>
                            <th className="px-4 py-3 w-40">Статус отправки</th>
                            <th className="px-4 py-3 w-40">Время</th>
                            <th className="px-4 py-3 w-16 text-center">Чат</th>
                            <th className="px-4 py-3 w-32"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {mockLogs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <div className="font-medium text-gray-900">{log.userName}</div>
                                            <span className="text-xs text-indigo-500">ID: {log.userId}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="font-mono text-gray-700 font-medium">{log.promoCode}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-xs">{log.prizeDesc}</div>
                                </td>
                                <td className="px-4 py-3">
                                    {log.status === 'sent' ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Доставлено (ЛС)
                                        </span>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit">
                                                Ошибка ЛС
                                            </span>
                                            <span className="text-[10px] text-gray-500">Отправлен комментарий</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {log.time}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button 
                                        className="text-gray-400 hover:text-indigo-600 inline-flex items-center justify-center p-1.5 rounded-full hover:bg-indigo-50 transition-colors"
                                        title="Открыть диалог с пользователем"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {log.status === 'error' && (
                                        <button
                                            className="text-xs font-medium text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                                        >
                                            Повторить
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
