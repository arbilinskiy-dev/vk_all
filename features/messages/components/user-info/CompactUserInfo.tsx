/**
 * CompactUserInfo — минималистичная карточка пользователя.
 * Отображается в свёрнутом режиме правой панели.
 * Показывает: аватар, имя, ссылку VK, метрики, данные профиля, вкладки для быстрого перехода.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ConversationUser, MailingUserInfo } from '../../types';
import { MessageStats } from '../../hooks/chat/messageHistoryTypes';
import { formatDate as sharedFormatDate, formatRelativeTime } from './userInfoPanelUtils';

/** Тип вкладки — совпадает с InfoTab в UserInfoPanel */
export type InfoTab = 'profile' | 'posts' | 'attachments' | 'templates' | 'promocodes';

interface CompactUserInfoProps {
    /** Базовые данные из диалога (аватар, имя) */
    user: ConversationUser;
    /** Расширенные данные из рассылки */
    userInfo: MailingUserInfo | null;
    /** Идёт загрузка */
    isLoading: boolean;
    /** Статистика сообщений */
    messageStats: MessageStats | null;
    /** Помечен как важный */
    isImportant?: boolean;
    /** Количество постов пользователя (для бейджа вкладки) */
    userPostsTotalCount?: number;
    /** Клик по вкладке — раскрыть панель на нужной вкладке */
    onExpandToTab?: (tab: InfoTab) => void;
}

export const CompactUserInfo: React.FC<CompactUserInfoProps> = ({
    user,
    userInfo,
    isLoading,
    messageStats,
    isImportant,
    userPostsTotalCount = 0,
    onExpandToTab,
}) => {
    /** Ссылка на VK-профиль */
    const vkLink = userInfo?.domain
        ? `https://vk.com/${userInfo.domain}`
        : `https://vk.com/id${user.id}`;

    /** Форматирование даты (компактный вид: день + короткий месяц) — используем shared-утилиту для фоллбэка 'неизвестно' */
    const formatDateCompact = (iso?: string | null) => {
        if (!iso) return 'неизвестно';
        try {
            return new Date(iso).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
            });
        } catch {
            return 'неизвестно';
        }
    };

    // Состояние загрузки аватара (skeleton + fade-in)
    const [avatarLoaded, setAvatarLoaded] = useState(false);
    const prevAvatarUrlRef = useRef(user.avatarUrl);
    useEffect(() => {
        if (prevAvatarUrlRef.current !== user.avatarUrl) {
            setAvatarLoaded(false);
            prevAvatarUrlRef.current = user.avatarUrl;
        }
    }, [user.avatarUrl]);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    /** Массив вкладок для рендера */
    const tabs: { key: InfoTab; label: string; icon: React.ReactNode }[] = [
        {
            key: 'profile',
            label: 'Профиль',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
        },
        {
            key: 'posts',
            label: userPostsTotalCount > 0 ? `Посты - ${userPostsTotalCount}` : 'Посты',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
            ),
        },
        {
            key: 'attachments',
            label: 'Вложения',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
            ),
        },
        {
            key: 'templates',
            label: 'Шаблоны',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
        },
        {
            key: 'promocodes',
            label: 'Промокоды',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {/* Аватар + имя + VK ссылка */}
            <div className="flex items-center gap-3">
                {/* Аватар */}
                <div className="relative flex-shrink-0">
                    {user.avatarUrl ? (
                        <>
                            {/* Скелетон аватара до загрузки */}
                            {!avatarLoaded && (
                                <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full" />
                            )}
                            <img
                                src={user.avatarUrl}
                                alt={`${user.firstName} ${user.lastName}`}
                                className={`w-11 h-11 rounded-full object-cover transition-opacity duration-300 ${avatarLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setAvatarLoaded(true)}
                            />
                        </>
                    ) : (
                        <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-sm">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                    )}
                    {/* Индикатор онлайн */}
                    {user.onlineStatus === 'online' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                </div>

                {/* Имя + ссылка */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
                            {user.firstName} {user.lastName}
                        </span>
                        {isImportant && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <a
                            href={vkLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-500 hover:text-indigo-700 truncate"
                        >
                            {userInfo?.domain ? `vk.com/${userInfo.domain}` : `id${user.id}`}
                        </a>
                        {/* Статус переписки — компактный индикатор */}
                        {userInfo?.can_write_private_message !== undefined && (
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                userInfo.can_write_private_message ? 'text-green-600' : 'text-red-500'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    userInfo.can_write_private_message ? 'bg-green-500' : 'bg-red-400'
                                }`} />
                                {userInfo.can_write_private_message ? 'Можно писать' : 'Нельзя'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Компактная статистика — 2 колонки */}
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-center" style={{ minHeight: 56 }}>
                    <div className="text-[11px] text-gray-400 leading-tight">Входящие</div>
                    <div className="text-base font-semibold text-gray-800">
                        {messageStats?.incomingCount ?? 'неизвестно'}
                    </div>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-center" style={{ minHeight: 56 }}>
                    <div className="text-[11px] text-gray-400 leading-tight">Исходящие</div>
                    <div className="text-base font-semibold text-gray-800">
                        {messageStats?.outgoingCount ?? 'неизвестно'}
                    </div>
                </div>
            </div>

            {/* Данные профиля */}
            <div className="space-y-1.5 text-xs" style={{ minHeight: 80 }}>
                {/* Город */}
                {userInfo?.city && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{userInfo.city}</span>
                    </div>
                )}
                {/* Дата первого сообщения */}
                {userInfo?.first_message_date && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Первый контакт: {formatDateCompact(userInfo.first_message_date)}</span>
                        {formatRelativeTime(userInfo.first_message_date) && (
                            <span className="text-gray-400 ml-auto flex-shrink-0 text-[11px]">{formatRelativeTime(userInfo.first_message_date)}</span>
                        )}
                    </div>
                )}
                {/* Клиент писал */}
                {userInfo?.last_incoming_message_date && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span className="text-indigo-600 font-medium">Клиент писал</span>
                        <span className="ml-auto text-gray-500 flex-shrink-0">{formatDateCompact(userInfo.last_incoming_message_date)}</span>
                        {formatRelativeTime(userInfo.last_incoming_message_date) && (
                            <span className="text-gray-400 flex-shrink-0 text-[11px]">{formatRelativeTime(userInfo.last_incoming_message_date)}</span>
                        )}
                    </div>
                )}
                {/* Мы писали */}
                {userInfo?.last_outgoing_message_date && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <span className="text-green-600 font-medium">Мы писали</span>
                        <span className="ml-auto text-gray-500 flex-shrink-0">{formatDateCompact(userInfo.last_outgoing_message_date)}</span>
                        {formatRelativeTime(userInfo.last_outgoing_message_date) && (
                            <span className="text-gray-400 flex-shrink-0 text-[11px]">{formatRelativeTime(userInfo.last_outgoing_message_date)}</span>
                        )}
                    </div>
                )}
                {/* Источник */}
                {userInfo?.source && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate">{userInfo.source}</span>
                    </div>
                )}
                {/* Последний онлайн */}
                {user.lastSeen && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Онлайн: {formatDateCompact(user.lastSeen)}</span>
                        {formatRelativeTime(user.lastSeen) && (
                            <span className="text-gray-400 ml-auto flex-shrink-0 text-[11px]">{formatRelativeTime(user.lastSeen)}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Разделитель */}
            <div className="border-t border-gray-100" />

            {/* Вкладки — клик раскрывает полную панель на нужной вкладке */}
            <div className="space-y-0.5">
                {tabs.map(({ key, label, icon }) => (
                    <button
                        key={key}
                        onClick={() => onExpandToTab?.(key)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors group"
                    >
                        <span className="text-gray-400 group-hover:text-indigo-500 transition-colors">
                            {icon}
                        </span>
                        <span className="truncate">{label}</span>
                        {/* Стрелка → при наведении */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-auto text-gray-300 group-hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                ))}
            </div>
        </div>
    );
};
