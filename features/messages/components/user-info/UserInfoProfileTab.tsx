/**
 * Вкладка «Профиль» панели информации о пользователе.
 * Кнопка обновить, статистика сообщений, все InfoRow, футер.
 */

import React, { useMemo } from 'react';
import { MailingUserInfo } from '../../types';
import { MessageStats } from '../../hooks/chat/useMessageHistory';
import {
    PLATFORM_MAP,
    PlatformIcon,
    formatDate,
    formatRelativeTime,
    calcLifetime,
    calcAge,
    pluralAge,
    formatLastSeen,
    formatLastSeenDate,
} from './userInfoPanelUtils';

interface UserInfoProfileTabProps {
    userInfo: MailingUserInfo;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    messageStats?: MessageStats | null;
}

export const UserInfoProfileTab: React.FC<UserInfoProfileTabProps> = ({
    userInfo,
    onRefresh,
    isRefreshing,
    messageStats,
}) => {
    // Расчёт возраста
    const { dateStr: bdateStr, age } = useMemo(
        () => calcAge(userInfo?.bdate),
        [userInfo?.bdate]
    );

    // Платформа
    const platformInfo = useMemo(
        () => userInfo?.platform ? PLATFORM_MAP[userInfo.platform] || { name: `Платформа ${userInfo.platform}`, icon: '📱' } : null,
        [userInfo?.platform]
    );

    // Фоллбэк: если нет first_message_date, берём дату первого входящего сообщения
    const firstContactDate = userInfo.first_message_date || userInfo.last_incoming_message_date || null;

    return (
        <>
            {/* Информационные блоки */}
            <div className="px-5 py-3 space-y-0 divide-y divide-gray-50">

                {/* Кнопка обновить — прямо рядом с данными */}
                {onRefresh && (
                    <div className="flex justify-start pb-2 !border-0">
                        <button
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors disabled:opacity-50"
                            title="Обновить данные из VK"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {isRefreshing ? 'Обновление...' : 'Обновить'}
                        </button>
                    </div>
                )}

                {/* Блок статистики сообщений — всегда рендерится (фикс. размер) */}
                <div className="!border-0 pb-2">
                    <div className="bg-gray-100/80 rounded-lg p-3 space-y-2" style={{ minHeight: 100 }}>
                        <p className="text-[11px] text-gray-600 uppercase tracking-wide font-semibold">Сообщения</p>

                        {messageStats ? (
                            /* Горизонт: диаграмма слева + цифры справа */
                            <div className="flex items-stretch gap-3">
                                {/* Левая часть: Заспамленность — круговая диаграмма */}
                                {messageStats.totalInCache > 0 && (() => {
                                    const spamPercent = Math.round(messageStats.outgoingCount / messageStats.totalInCache * 100);
                                    const strokeColor = spamPercent >= 70 ? '#ef4444' : spamPercent >= 50 ? '#f59e0b' : spamPercent >= 30 ? '#84cc16' : '#22c55e';
                                    const textColorClass = spamPercent >= 70 ? 'text-red-500' : spamPercent >= 50 ? 'text-amber-500' : spamPercent >= 30 ? 'text-lime-600' : 'text-green-500';
                                    const radius = 52;
                                    const circumference = 2 * Math.PI * radius;
                                    const offset = circumference - (spamPercent / 100) * circumference;
                                    return (
                                        <div className="flex flex-col items-center justify-center flex-shrink-0 self-stretch" title="Заспамленность — % наших сообщений">
                                            <div className="relative" style={{ width: 120, height: 120 }}>
                                                <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
                                                    <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="7" />
                                                    <circle cx="60" cy="60" r={radius} fill="none" stroke={strokeColor} strokeWidth="7" strokeLinecap="round"
                                                        strokeDasharray={circumference} strokeDashoffset={offset}
                                                        style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.3s ease' }}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className={`text-xl font-bold ${textColorClass}`}>{spamPercent}%</span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-gray-400 mt-0.5">спам</span>
                                        </div>
                                    );
                                })()}

                                {/* Правая часть: В базе/Всего + Клиент/Мы + Удалённые */}
                                <div className="min-w-0 space-y-1.5">
                                    {/* В базе / Всего */}
                                    <div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-bold text-gray-800">{messageStats.totalInCache.toLocaleString('ru-RU')}</span>
                                            <span className="text-xs text-gray-400">/</span>
                                            <span className="text-lg font-bold text-gray-800">{messageStats.totalInDialog.toLocaleString('ru-RU')}</span>
                                            {messageStats.totalInDialog > 0 && (
                                                <span className={`text-[10px] font-medium ${messageStats.totalInCache >= messageStats.totalInDialog ? 'text-green-500' : 'text-amber-500'}`}>
                                                    {Math.round(messageStats.totalInCache / messageStats.totalInDialog * 100)}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[9px] text-gray-400">в базе</span>
                                            <span className="text-[9px] text-gray-300">/</span>
                                            <span className="text-[9px] text-gray-400">всего</span>
                                        </div>
                                    </div>
                                    {/* Клиент / Мы */}
                                    <div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-bold text-blue-600">{messageStats.incomingCount.toLocaleString('ru-RU')}</span>
                                            <span className="text-xs text-gray-400">/</span>
                                            <span className="text-lg font-bold text-indigo-600">{messageStats.outgoingCount.toLocaleString('ru-RU')}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[9px] text-blue-400">клиент</span>
                                            <span className="text-[9px] text-gray-300">/</span>
                                            <span className="text-[9px] text-indigo-400">мы</span>
                                        </div>
                                    </div>
                                    {/* Удалённые из ВК — всегда видны */}
                                    <div>
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-lg font-bold ${(messageStats.deletedFromVkCount || 0) > 0 ? 'text-red-500' : 'text-gray-400'}`}>{(messageStats.deletedFromVkCount || 0).toLocaleString('ru-RU')}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[9px] text-red-400">удалено из ВК</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Плейсхолдер пока статистика не загружена */
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <div className="loader h-3 w-3 border-2 border-gray-200 border-t-gray-400"></div>
                                Загрузка...
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Блок активности — таблица */}
                <div className="!border-0 pb-1">
                    <div className="bg-gray-100/80 rounded-lg p-3 space-y-2" style={{ minHeight: 120 }}>
                        <p className="text-[11px] text-gray-600 uppercase tracking-wide font-semibold">Активность</p>
                        <table className="w-full border-collapse table-fixed">
                            <colgroup>
                                <col style={{ width: 130 }} />
                                <col style={{ width: 24 }} />
                                <col style={{ width: 145 }} />
                                <col style={{ width: 95 }} />
                            </colgroup>
                            <tbody className="text-sm">
                                <tr>
                                    <td className="pr-2 py-0.5 text-gray-400 text-left whitespace-nowrap truncate">Первый контакт</td>
                                    <td className="px-1.5 py-0.5 text-gray-300 text-center">→</td>
                                    <td className="px-2 py-0.5 font-medium text-gray-700 text-left whitespace-nowrap truncate">{formatDate(firstContactDate)}</td>
                                    <td className="pl-1.5 py-0.5 text-xs text-gray-400 text-left whitespace-nowrap truncate">{formatRelativeTime(firstContactDate)}</td>
                                </tr>
                                <tr>
                                    <td className="pr-2 py-0.5 text-blue-400 text-left whitespace-nowrap truncate">Клиент писал</td>
                                    <td className="px-1.5 py-0.5 text-gray-300 text-center">→</td>
                                    <td className="px-2 py-0.5 font-medium text-gray-700 text-left whitespace-nowrap truncate">{formatDate(userInfo.last_incoming_message_date)}</td>
                                    <td className="pl-1.5 py-0.5 text-xs text-gray-400 text-left whitespace-nowrap truncate">{formatRelativeTime(userInfo.last_incoming_message_date)}</td>
                                </tr>
                                <tr>
                                    <td className="pr-2 py-0.5 text-indigo-400 text-left whitespace-nowrap truncate">Мы писали</td>
                                    <td className="px-1.5 py-0.5 text-gray-300 text-center">→</td>
                                    <td className="px-2 py-0.5 font-medium text-gray-700 text-left whitespace-nowrap truncate">{formatDate(userInfo.last_outgoing_message_date)}</td>
                                    <td className="pl-1.5 py-0.5 text-xs text-gray-400 text-left whitespace-nowrap truncate">{formatRelativeTime(userInfo.last_outgoing_message_date)}</td>
                                </tr>
                                <tr><td colSpan={4} className="py-1"><div className="border-t border-gray-200" /></td></tr>
                                <tr>
                                    <td className="pr-2 py-0.5 text-green-500 text-left whitespace-nowrap truncate">Подписан</td>
                                    <td className="px-1.5 py-0.5 text-gray-300 text-center">→</td>
                                    <td className="px-2 py-0.5 font-medium text-gray-700 text-left whitespace-nowrap truncate" colSpan={2}>{calcLifetime(firstContactDate)}</td>
                                </tr>
                                <tr>
                                    <td className="pr-2 py-0.5 text-gray-400 text-left whitespace-nowrap truncate">Последний онлайн</td>
                                    <td className="px-1.5 py-0.5 text-gray-300 text-center">→</td>
                                    <td className="px-2 py-0.5 font-medium text-gray-700 text-left whitespace-nowrap truncate">{formatLastSeenDate(userInfo.last_seen)}</td>
                                    <td className={`pl-1.5 py-0.5 text-xs text-left whitespace-nowrap truncate ${userInfo.last_seen && (Date.now() / 1000 - userInfo.last_seen) < 900 ? 'text-green-500' : 'text-gray-400'}`}>{formatLastSeen(userInfo.last_seen)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Блок профиля — табличный формат */}
                <div className="!border-0 pb-1">
                    <div className="bg-gray-100/80 rounded-lg p-3 space-y-2" style={{ minHeight: 90 }}>
                        <p className="text-[11px] text-gray-600 uppercase tracking-wide font-semibold">Профиль</p>
                        <table className="w-auto border-collapse">
                            <tbody className="text-sm">
                                {/* Город */}
                                <tr>
                                    <td className="pr-2 py-0.5 text-gray-400 text-left whitespace-nowrap align-middle">
                                        <div className="flex items-center gap-1.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>Город</span>
                                        </div>
                                    </td>
                                    <td className="px-1.5 py-0.5 text-gray-300 text-center align-middle">→</td>
                                    <td className="px-2 py-0.5 font-medium text-gray-700 text-left whitespace-nowrap align-middle">
                                        {userInfo.city || 'неизвестно'}
                                        {userInfo.country && userInfo.country !== userInfo.city && (
                                            <span className="text-xs text-gray-400 ml-1.5">{userInfo.country}</span>
                                        )}
                                    </td>
                                </tr>
                                {/* Возраст + ДР */}
                                <tr>
                                    <td className="pr-2 py-0.5 text-gray-400 text-left whitespace-nowrap align-middle">
                                        <div className="flex items-center gap-1.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A1.75 1.75 0 003 15.546V12a9 9 0 0118 0v3.546zM12 3v2" />
                                            </svg>
                                            <span>{age !== null ? pluralAge(age) : 'ДР'}</span>
                                        </div>
                                    </td>
                                    <td className="px-1.5 py-0.5 text-gray-300 text-center align-middle">→</td>
                                    <td className="px-2 py-0.5 font-medium text-gray-700 text-left whitespace-nowrap align-middle">{bdateStr}</td>
                                </tr>
                                {/* Платформа */}
                                <tr>
                                    <td className="pr-2 py-0.5 text-gray-400 text-left whitespace-nowrap align-middle">
                                        <div className="flex items-center gap-1.5">
                                            {platformInfo ? <PlatformIcon type={platformInfo.icon} className="h-3.5 w-3.5 text-gray-400" /> : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                            <span>Платформа</span>
                                        </div>
                                    </td>
                                    <td className="px-1.5 py-0.5 text-gray-300 text-center align-middle">→</td>
                                    <td className="px-2 py-0.5 font-medium text-gray-700 text-left whitespace-nowrap align-middle">{platformInfo ? platformInfo.name : 'неизвестно'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Мета — компактные теги */}
            <div className="px-5 pb-3 mt-auto">
                <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-[10px] text-gray-500 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        {userInfo.source || 'рассылка'}
                    </span>
                    {userInfo.conversation_status && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-[10px] text-gray-500 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            {userInfo.conversation_status}
                        </span>
                    )}
                </div>
            </div>
        </>
    );
};
