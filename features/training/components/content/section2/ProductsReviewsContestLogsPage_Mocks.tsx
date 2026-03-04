import React, { useState } from 'react';
import type { LogLevel, SystemLogEntry, DeliveryLogEntry } from './ProductsReviewsContestLogsPage_Types';

// =====================================================================
// Mock-компоненты для демонстрации логов
// =====================================================================

// Компонент системных логов (стиль терминала из LogsTab.tsx)
export const MockSystemLogs: React.FC = () => {
    const [logs] = useState<SystemLogEntry[]>([
        { time: '14:30:05', level: 'INFO', message: 'Scanner started. Keyword: "#отзыв"' },
        { time: '14:30:12', level: 'SUCCESS', message: 'Found new post id:12345 from User id:998877' },
        { time: '14:30:13', level: 'INFO', message: 'Comment posted. Number: 1' },
        { time: '14:35:00', level: 'SUCCESS', message: 'Found new post id:12346 from User id:554433' },
        { time: '14:35:02', level: 'ERROR', message: 'Failed to post comment: VK API error (rate limit)' },
        { time: '14:35:05', level: 'WARNING', message: 'User id:112233 is in blacklist, skipping...' },
    ]);

    const getLevelColor = (level: LogLevel): string => {
        switch (level) {
            case 'INFO': return 'text-blue-400';
            case 'SUCCESS': return 'text-green-400';
            case 'ERROR': return 'text-red-400';
            case 'WARNING': return 'text-amber-400';
        }
    };

    return (
        <div className="bg-black/90 rounded-lg shadow border border-gray-700 overflow-hidden">
            <div className="p-2 border-b border-gray-700 bg-black flex justify-between items-center">
                <h4 className="font-semibold text-gray-400 text-sm">System Logs</h4>
                <button className="text-gray-500 hover:text-white text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors">
                    Clear
                </button>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar space-y-1 h-64 text-gray-300 font-mono text-xs">
                {logs.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                        <span className="text-gray-500">[{log.time}]</span>
                        <span className={getLevelColor(log.level)}>{log.level}:</span>
                        <span>{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Компонент журнала отправки призов (из SendingListTab.tsx)
export const MockDeliveryLogs: React.FC = () => {
    const [logs] = useState<DeliveryLogEntry[]>([
        {
            id: '1',
            userName: 'Анна Петрова',
            userVkId: 123456789,
            promoCode: 'PROMO500',
            prizeDescription: 'Скидка 500₽ на следующую покупку',
            status: 'sent',
            createdAt: '2026-02-18T14:30:00'
        },
        {
            id: '2',
            userName: 'Иван Сидоров',
            userVkId: 987654321,
            promoCode: 'GIFT100',
            prizeDescription: 'Подарок при заказе от 1000₽',
            status: 'error',
            createdAt: '2026-02-18T14:32:00'
        },
        {
            id: '3',
            userName: 'Мария Иванова',
            userVkId: 555444333,
            promoCode: 'WINNER2024',
            prizeDescription: 'Бесплатная доставка',
            status: 'sent',
            createdAt: '2026-02-18T14:35:00'
        },
    ]);

    const [isRetrying, setIsRetrying] = useState<string | null>(null);

    const handleRetry = (logId: string) => {
        setIsRetrying(logId);
        setTimeout(() => {
            setIsRetrying(null);
            alert('Сообщение успешно отправлено повторно!');
        }, 1000);
    };

    const stats = {
        sent: logs.filter(l => l.status === 'sent').length,
        error: logs.filter(l => l.status === 'error').length
    };

    return (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
                <h4 className="font-semibold text-gray-700">Журнал отправки призов</h4>
                <div className="flex items-center gap-4">
                    <div className="flex gap-4 text-sm">
                        <span className="text-green-600">Успешно: <strong>{stats.sent}</strong></span>
                        <span className="text-red-500">Ошибки: <strong>{stats.error}</strong></span>
                    </div>
                    {stats.error > 0 && (
                        <button className="px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                            Повторить всем ({stats.error})
                        </button>
                    )}
                    <button className="px-3 py-1.5 text-sm font-medium rounded-md border border-red-300 text-red-600 bg-white hover:bg-red-50">
                        Очистить журнал
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
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
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <div className="font-medium text-gray-900">{log.userName}</div>
                                            <a href="#" className="text-xs text-indigo-500 hover:underline">
                                                ID: {log.userVkId}
                                            </a>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="font-mono text-gray-700 font-medium">{log.promoCode}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-xs">{log.prizeDescription}</div>
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
                                    {new Date(log.createdAt).toLocaleString('ru-RU')}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <a 
                                        href="#" 
                                        className="text-gray-400 hover:text-indigo-600 inline-flex items-center justify-center p-1.5 rounded-full hover:bg-indigo-50 transition-colors"
                                        title="Открыть диалог с пользователем"
                                    >
                                        {/* Иконка сообщений из SendingListTab.tsx строка 192-193 */}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </a>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {log.status === 'error' && (
                                        <button
                                            onClick={() => handleRetry(log.id)}
                                            disabled={isRetrying === log.id}
                                            className="text-xs font-medium text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors disabled:opacity-50"
                                        >
                                            {isRetrying === log.id ? '...' : 'Повторить'}
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
