/**
 * ChatMessage — хаб-контейнер.
 * Компонент одного сообщения в чате.
 * Входящие — слева, исходящие — справа.
 * Рендерит текст + все вложения (фото, видео, стикеры, документы, ссылки, опросы и т.д.)
 */
import React, { useMemo } from 'react';
import { ChatMessageData, MessageAttachment, ChatDisplayFilters } from '../../types';
import { renderChatMessageText } from './chatMessageUtils';
import { PhotoGrid } from '../attachments/PhotoGrid';
import { AttachmentRenderer } from './ChatMessageAttachments';
import { KeyboardButtons } from './ChatMessageKeyboard';

interface ChatMessageProps {
    message: ChatMessageData;
    /** Поисковый запрос для подсветки совпадений в тексте */
    searchQuery?: string;
    /** Фильтры отображения (скрытие вложений/кнопок) */
    displayFilters?: ChatDisplayFilters;
    /** Колбэк выбора сообщения для ответа */
    onReply?: (message: ChatMessageData) => void;
    /** Сообщение выбрано для ответа */
    isSelected?: boolean;
    /** Колбэк навигации к диалогу с пользователем в нашей системе */
    onNavigateToDialog?: (vkUserId: number) => void;
}

/**
 * Извлекает VK user_id из inline-кнопки «Диалог с клиентом» (ссылка vk.com/gim{groupId}?sel={userId})
 */
function extractDialogUserId(keyboard?: { buttons: { action: { type: string; link?: string } }[][] }): number | null {
    if (!keyboard?.buttons) return null;
    for (const row of keyboard.buttons) {
        for (const btn of row) {
            if (btn.action.type === 'open_link' && btn.action.link) {
                const match = btn.action.link.match(/\/gim\d+\?sel=(\d+)/);
                if (match) return Number(match[1]);
            }
        }
    }
    return null;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, searchQuery, displayFilters, onReply, isSelected = false, onNavigateToDialog }) => {
    const isOutgoing = message.direction === 'outgoing';
    const shouldHideAttachments = displayFilters?.hideAttachments ?? false;
    const shouldHideKeyboard = displayFilters?.hideKeyboard ?? false;
    const hasAttachments = !shouldHideAttachments && message.attachments && message.attachments.length > 0;
    const hasText = message.text.trim().length > 0;

    // Разделяем вложения: фото отдельно, остальные отдельно
    const { photoAttachments, otherAttachments } = useMemo(() => {
        if (shouldHideAttachments || !message.attachments || message.attachments.length === 0) {
            return { photoAttachments: [], otherAttachments: [] };
        }
        const photos: MessageAttachment[] = [];
        const others: MessageAttachment[] = [];
        for (const att of message.attachments) {
            if (att.type === 'photo') {
                photos.push(att);
            } else {
                others.push(att);
            }
        }
        return { photoAttachments: photos, otherAttachments: others };
    }, [message.attachments, shouldHideAttachments]);

    // Стикер рендерится без бабла
    const isSticker = !shouldHideAttachments && hasAttachments && message.attachments!.length === 1 && message.attachments![0].type === 'sticker';
    // Граффити/подарок — тоже без бабла
    const isNoBubble = isSticker
        || (!shouldHideAttachments && hasAttachments && message.attachments!.length === 1 && ['graffiti', 'gift'].includes(message.attachments![0].type));

    // Форматируем время
    const time = new Date(message.timestamp).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
    });

    // Время + индикатор прочтения (кружок: серый = отправлено, зелёный = прочитано)
    const TimeAndStatus = () => (
        <div className={`flex items-center justify-end gap-1.5 mt-1 ${
            isOutgoing && !isNoBubble ? 'text-indigo-200' : 'text-gray-400'
        }`}>
            {/* Кнопка «Ответить» / «Выбрано ✓» — всегда видна */}
            {onReply && (
                <button
                    onClick={() => onReply(message)}
                    className={`mr-auto flex items-center gap-0.5 text-[11px] rounded px-1 py-0.5 transition-colors ${
                        isSelected
                            ? (isOutgoing && !isNoBubble
                                ? 'text-emerald-300 bg-emerald-500/20'
                                : 'text-emerald-600 bg-emerald-100')
                            : (isOutgoing && !isNoBubble
                                ? 'text-indigo-300 hover:text-white hover:bg-indigo-500/30'
                                : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-200/60')
                    }`}
                    title={isSelected ? 'Снять выбор' : 'Выбрать для ответа'}
                >
                    {isSelected ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Выбрано
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Ответить
                        </>
                    )}
                </button>
            )}
            {/* Имя менеджера, отправившего сообщение через нашу систему */}
            {isOutgoing && message.sentByName && (
                <span className={`text-[11px] mr-auto ${
                    isNoBubble ? 'text-gray-400' : 'text-indigo-300'
                }`} title={`Отправил: ${message.sentByName}`}>
                    {message.sentByName}
                </span>
            )}
            <span className="text-[11px]">{time}</span>
            {isOutgoing && (
                <span
                    className={`inline-block w-2.5 h-2.5 rounded-full border-2 transition-colors duration-300 ${
                        message.isRead
                            ? 'bg-emerald-400 border-emerald-300'
                            : 'bg-transparent border-indigo-300/60'
                    }`}
                    title={message.isRead ? 'Прочитано' : 'Отправлено'}
                />
            )}
        </div>
    );

    // Рендер без бабла (стикер, граффити, подарок)
    if (isNoBubble) {
        return (
            <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-3 rounded-lg transition-colors ${isSelected ? 'bg-emerald-50' : ''}`}>
                <div className="max-w-[70%]">
                    {message.attachments!.map((att, i) => (
                        <AttachmentRenderer key={i} att={att} isOutgoing={isOutgoing} />
                    ))}
                    <TimeAndStatus />
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-3 rounded-lg transition-colors ${isSelected ? 'bg-emerald-50' : ''}`}>
            <div className="max-w-[70%]">
                <div
                    className={`rounded-2xl px-4 py-2.5 ${
                        isOutgoing
                            ? 'bg-indigo-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}
                >
                {/* Имя отправителя (для групповых чатов — показывает кто написал) */}
                {!isOutgoing && message.senderName && (
                    <p className="text-[11px] font-semibold text-indigo-600 mb-1">
                        {message.senderName}
                    </p>
                )}
                {/* Цитата сообщения, на которое ответ */}
                {message.replyMessage && (
                    <div className={`mb-2 pl-2.5 border-l-2 rounded-sm ${
                        isOutgoing
                            ? 'border-indigo-300 bg-indigo-500/30'
                            : 'border-indigo-400 bg-gray-200/60'
                    }`}>
                        <p className={`text-[11px] font-medium ${
                            isOutgoing ? 'text-indigo-200' : 'text-indigo-600'
                        }`}>
                            {message.replyMessage.direction === 'incoming' ? 'Клиент' : 'Вы'}
                        </p>
                        <p className={`text-[12px] line-clamp-2 ${
                            isOutgoing ? 'text-indigo-100' : 'text-gray-600'
                        }`}>
                            {message.replyMessage.text || 'Вложение'}
                        </p>
                    </div>
                )}
                {/* Пересланные сообщения */}
                {message.forwardedMessages && message.forwardedMessages.length > 0 && (
                    <div className={`mb-2 pl-2.5 border-l-2 rounded-sm ${
                        isOutgoing
                            ? 'border-amber-300 bg-amber-500/20'
                            : 'border-amber-400 bg-amber-50'
                    }`}>
                        <p className={`text-[11px] font-medium mb-1 ${
                            isOutgoing ? 'text-amber-200' : 'text-amber-600'
                        }`}>
                            Пересланные сообщения ({message.forwardedMessages.length})
                        </p>
                        {message.forwardedMessages.slice(0, 3).map((fwd, i) => (
                            <div key={fwd.id || i} className="mb-1 last:mb-0">
                                <p className={`text-[11px] font-medium ${
                                    isOutgoing ? 'text-indigo-200' : 'text-indigo-500'
                                }`}>
                                    {fwd.senderName || (fwd.direction === 'incoming' ? 'Клиент' : 'Вы')}
                                </p>
                                <p className={`text-[12px] line-clamp-2 ${
                                    isOutgoing ? 'text-indigo-100' : 'text-gray-600'
                                }`}>
                                    {fwd.text || 'Вложение'}
                                </p>
                            </div>
                        ))}
                        {message.forwardedMessages.length > 3 && (
                            <p className={`text-[10px] italic ${
                                isOutgoing ? 'text-indigo-300' : 'text-gray-400'
                            }`}>
                                и ещё {message.forwardedMessages.length - 3}...
                            </p>
                        )}
                    </div>
                )}
                {(message.isBotMessage || message.keyboard) && (
                    <div className={`flex items-center gap-1 mb-1.5 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-400 text-yellow-900 text-[10px] font-semibold shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.591.659H9.061a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V17a2 2 0 01-2 2H7a2 2 0 01-2-2v-2.5" />
                            </svg>
                            {!isOutgoing && message.isBotMessage ? 'Кнопка' : 'Бот / Рассылка'}
                        </span>
                    </div>
                )}
                {/* Индикатор удалённого из ВК сообщения */}
                {message.isDeletedFromVk && (
                    <div className={`flex items-center gap-1 mb-1.5 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-600 text-[10px] font-semibold shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Удалено из ВК
                        </span>
                    </div>
                )}
                {/* Текст сообщения */}
                {hasText && (
                    <p className="text-sm whitespace-pre-wrap break-words">
                        {renderChatMessageText(message.text, searchQuery, isOutgoing)}
                    </p>
                )}

                {/* Вложения: фото — сеткой через PhotoGrid, остальные — линейно */}
                {hasAttachments && (
                    <div className={`space-y-2 ${hasText ? 'mt-2' : ''}`}>
                        {/* Фотографии — сетка 2x2 с навигацией */}
                        {photoAttachments.length > 0 && (
                            <PhotoGrid photos={photoAttachments} isOutgoing={isOutgoing} />
                        )}
                        {/* Остальные вложения */}
                        {otherAttachments.map((att, i) => (
                            <AttachmentRenderer key={i} att={att} isOutgoing={isOutgoing} />
                        ))}
                    </div>
                )}

                {/* Клавиатура бота (кнопки, прикреплённые к сообщению) */}
                {!shouldHideKeyboard && message.keyboard && (
                    <KeyboardButtons keyboard={message.keyboard} isOutgoing={isOutgoing} />
                )}

                {/* Кнопка «Открыть в системе» — быстрый переход в диалог с клиентом */}
                {!shouldHideKeyboard && onNavigateToDialog && (() => {
                    const userId = extractDialogUserId(message.keyboard);
                    if (!userId) return null;
                    return (
                        <button
                            onClick={() => onNavigateToDialog(userId)}
                            className="mt-1.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium border transition-all duration-150 bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer flex items-center justify-center gap-1.5"
                            title="Открыть диалог с клиентом в нашей системе"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            Открыть диалог в системе
                        </button>
                    );
                })()}

                {/* Компактные индикаторы скрытых элементов */}
                {(shouldHideAttachments && message.attachments && message.attachments.length > 0) || (shouldHideKeyboard && message.keyboard) ? (
                    <div className={`flex items-center gap-2 mt-1.5 ${
                        isOutgoing ? 'text-indigo-300' : 'text-gray-400'
                    }`}>
                        {shouldHideAttachments && message.attachments && message.attachments.length > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] italic">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                {message.attachments.length} влож.
                            </span>
                        )}
                        {shouldHideKeyboard && message.keyboard && (
                            <span className="flex items-center gap-0.5 text-[10px] italic">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                                кнопки
                            </span>
                        )}
                    </div>
                ) : null}

                {/* Время и статус прочтения */}
                <TimeAndStatus />
                </div>
            </div>
        </div>
    );
};
