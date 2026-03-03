import React, { useState, useRef, useEffect } from 'react';
import { Conversation } from '../../types';
import { ManagerFocusInfo } from '../../hooks/chat/useTypingState';

interface ConversationItemProps {
    conversation: Conversation;
    isActive: boolean;
    onClick: () => void;
    /** Индекс элемента для stagger-анимации появления */
    animationIndex?: number;
    /** Пользователь печатает сообщение */
    isTyping?: boolean;
    /** Менеджеры, которые сейчас в этом диалоге */
    focusedManagers?: ManagerFocusInfo[];
    /** Пропустить анимацию появления (элемент уже был показан в сайдбаре ранее) */
    skipAnimation?: boolean;
}

/**
 * Элемент списка диалогов в ConversationsSidebar.
 * Показывает аватар, имя, последнее сообщение, время и badge непрочитанных.
 */
export const ConversationItem: React.FC<ConversationItemProps> = ({
    conversation,
    isActive,
    onClick,
    animationIndex = 0,
    isTyping = false,
    focusedManagers = [],
    skipAnimation = false,
}) => {
    const { user, lastMessage, unreadCount } = conversation;
    const initials = `${user.firstName[0]}${user.lastName[0]}`;
    const [avatarLoaded, setAvatarLoaded] = useState(false);
    /** Флаг: анимация появления уже отыграла — не мигаем при каждом перерендере.
     *  skipAnimation=true (элемент уже был показан) → инициализируем как true, чтобы
     *  при ре-маунте компонент не мигал opacity-0. */
    const hasAnimatedRef = useRef(skipAnimation);
    const [hasAnimated, setHasAnimated] = useState(skipAnimation);

    // Через 400мс после маунта помечаем как «уже показан» (анимация fade-in-up ~350мс)
    useEffect(() => {
        if (hasAnimatedRef.current) {
            setHasAnimated(true);
            return;
        }
        const timer = setTimeout(() => {
            hasAnimatedRef.current = true;
            setHasAnimated(true);
        }, animationIndex * 30 + 400);
        return () => clearTimeout(timer);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Форматирование времени последнего сообщения
    const formatTime = (timestamp?: string) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        if (isToday) {
            return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        }
        
        // Вчера
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'вчера';
        }
        
        // Дата без года если текущий год
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
        }
        
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' });
    };

    // Превью текста последнего сообщения с префиксом «Вы:» / имя юзера
    const getPreviewText = () => {
        if (!lastMessage) return 'Нет сообщений';
        
        // Определяем автора
        const prefix = lastMessage.direction === 'outgoing' 
            ? 'Вы: ' 
            : `${user.firstName}: `;
        
        // Текст сообщения (если пуст — показываем тип вложения)
        const text = lastMessage.text || (lastMessage.attachments?.length ? 'Вложение' : '...');
        return `${prefix}${text}`;
    };

    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-3 py-3 flex items-start gap-3 transition-colors border-b border-gray-50 ${
                hasAnimated ? '' : 'opacity-0 animate-fade-in-up'
            } ${
                isActive
                    ? 'bg-indigo-50'
                    : 'hover:bg-gray-50'
            }`}
            style={hasAnimated ? undefined : { animationDelay: `${animationIndex * 30}ms`, animationFillMode: 'forwards' }}
        >
            {/* Аватар со skeleton + fade-in */}
            <div className="relative flex-shrink-0">
                {user.avatarUrl ? (
                    <div className="w-11 h-11 rounded-full relative">
                        {/* Skeleton пока фото грузится */}
                        {!avatarLoaded && (
                            <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full" />
                        )}
                        <img
                            src={user.avatarUrl}
                            alt={`${user.firstName} ${user.lastName}`}
                            className={`w-11 h-11 rounded-full object-cover transition-opacity duration-300 ${avatarLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setAvatarLoaded(true)}
                        />
                    </div>
                ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                        {initials}
                    </div>
                )}
                {/* Индикатор онлайн */}
                {user.onlineStatus === 'online' && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                )}
            </div>

            {/* Контент */}
            <div className="flex-1 min-w-0">
                {/* Верхняя строка: имя + время */}
                <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate ${
                        unreadCount > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                    }`}>
                        {/* Звёздочка «Важное» рядом с именем */}
                        {conversation.isImportant && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-amber-500 inline-block mr-0.5 -mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        )}
                        {user.firstName} {user.lastName}
                    </span>
                    <span className={`text-[11px] flex-shrink-0 ${
                        unreadCount > 0 ? 'text-indigo-600 font-medium' : 'text-gray-400'
                    }`}>
                        {formatTime(lastMessage?.timestamp)}
                    </span>
                </div>

                {/* Нижняя строка: typing-индикатор / менеджер / превью сообщения + badge */}
                <div className="flex items-start justify-between gap-2 mt-0.5">
                    {isTyping ? (
                        /* Индикатор "печатает..." */
                        <p className="text-xs text-indigo-500 italic flex items-center gap-1">
                            <span className="inline-flex gap-0.5">
                                <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                            печатает...
                        </p>
                    ) : focusedManagers.length > 0 ? (
                        /* Индикатор "менеджер отвечает" */
                        <p className="text-xs text-emerald-600 italic truncate">
                            {focusedManagers.length === 1
                                ? `${focusedManagers[0].managerName} отвечает`
                                : `${focusedManagers.map(m => m.managerName).join(', ')} отвечают`
                            }
                        </p>
                    ) : (
                        /* Обычное превью последнего сообщения */
                        <p className={`text-xs line-clamp-2 break-all ${
                            unreadCount > 0 ? 'text-gray-700' : 'text-gray-400'
                        }`}>
                            {lastMessage && (
                                <>
                                    {/* Индикатор бот-сообщения */}
                                    {lastMessage.isBotMessage && (
                                        <span className="inline-flex items-center gap-0.5 mr-1 px-1 py-0 rounded bg-yellow-400 text-yellow-900 text-[10px] font-semibold align-middle" title="Сообщение через бота">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.591.659H9.061a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V17a2 2 0 01-2 2H7a2 2 0 01-2-2v-2.5" />
                                            </svg>
                                            {lastMessage.direction === 'outgoing' ? 'бот' : 'кнопка'}
                                        </span>
                                    )}
                                    <span className={`font-medium ${lastMessage.direction === 'outgoing' ? 'text-indigo-500' : 'text-gray-500'}`}>
                                        {lastMessage.direction === 'outgoing' ? 'Вы: ' : `${user.firstName}: `}
                                    </span>
                                </>
                            )}
                            {lastMessage 
                                ? (lastMessage.text || (lastMessage.attachments?.length ? 'Вложение' : '...'))
                                : 'Нет сообщений'
                            }
                        </p>
                    )}
                    {unreadCount > 0 && (
                        <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-indigo-600 text-white text-[11px] font-semibold rounded-full flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};
