/**
 * ForwardToChatModal — модальное окно выбора группового чата для пересылки сообщений.
 * Показывает список групповых чатов сообщества, позволяет добавить комментарий и отправить.
 */
import React, { useState, useMemo } from 'react';
import { Conversation, ChatMessageData } from '../../types';

interface ForwardToChatModalProps {
    /** Список всех диалогов (групповые чаты фильтруются внутри) */
    conversations: Conversation[];
    /** Сообщения, которые пересылаем (для превью) */
    selectedMessages: ChatMessageData[];
    /** Имя пользователя, из диалога с которым пересылаем */
    userName?: string;
    /** peer_id текущего диалога (источник пересылки) */
    sourcePeerId: number;
    /** Идёт отправка */
    isSending?: boolean;
    /** Колбэк отправки: targetPeerId, comment */
    onSend: (targetPeerId: number, comment: string) => void;
    /** Закрыть модал */
    onClose: () => void;
}

export const ForwardToChatModal: React.FC<ForwardToChatModalProps> = ({
    conversations,
    selectedMessages,
    userName,
    sourcePeerId,
    isSending,
    onSend,
    onClose,
}) => {
    const [selectedChatPeerId, setSelectedChatPeerId] = useState<number | null>(null);
    const [comment, setComment] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Фильтруем только групповые чаты (исключаем текущий диалог)
    const groupChats = useMemo(() => {
        return conversations.filter(
            c => c.isGroupChat && c.peerId && c.peerId !== sourcePeerId
        );
    }, [conversations, sourcePeerId]);

    // Поиск по названию чата
    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return groupChats;
        const q = searchQuery.toLowerCase();
        return groupChats.filter(c =>
            c.user.firstName.toLowerCase().includes(q)
        );
    }, [groupChats, searchQuery]);

    const handleSend = () => {
        if (!selectedChatPeerId) return;
        onSend(selectedChatPeerId, comment.trim());
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Оверлей */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            {/* Контент модала */}
            <div className="relative bg-white rounded-xl shadow-2xl w-[440px] max-h-[80vh] flex flex-col overflow-hidden">
                {/* Заголовок */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">Переслать в чат</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {selectedMessages.length === 1
                                ? '1 сообщение'
                                : `${selectedMessages.length} сообщений`}
                            {userName && ` от ${userName}`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Превью пересылаемых сообщений */}
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="max-h-20 overflow-y-auto flex flex-col gap-1">
                        {selectedMessages.slice(0, 3).map(msg => (
                            <div key={msg.id} className="flex items-center gap-2">
                                <div className="flex-shrink-0 w-0.5 h-4 bg-indigo-400 rounded-full" />
                                <p className="text-xs text-gray-600 truncate">
                                    <span className="font-medium text-indigo-500 mr-1">
                                        {msg.direction === 'incoming' ? (userName || 'Клиент') : 'Вы'}:
                                    </span>
                                    {msg.text || 'Вложение'}
                                </p>
                            </div>
                        ))}
                        {selectedMessages.length > 3 && (
                            <p className="text-[11px] text-gray-400">
                                и ещё {selectedMessages.length - 3}...
                            </p>
                        )}
                    </div>
                </div>

                {/* Поиск чатов */}
                {groupChats.length > 5 && (
                    <div className="px-5 pt-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Поиск чата..."
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                )}

                {/* Список чатов */}
                <div className="flex-1 overflow-y-auto px-3 py-2 min-h-[120px] max-h-[240px]">
                    {filteredChats.length === 0 ? (
                        <div className="flex items-center justify-center h-full py-8">
                            <p className="text-sm text-gray-400">
                                {groupChats.length === 0
                                    ? 'Нет доступных групповых чатов'
                                    : 'Чаты не найдены'}
                            </p>
                        </div>
                    ) : (
                        filteredChats.map(chat => (
                            <button
                                key={chat.id}
                                onClick={() => setSelectedChatPeerId(chat.peerId!)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                                    selectedChatPeerId === chat.peerId
                                        ? 'bg-indigo-50 ring-1 ring-indigo-200'
                                        : 'hover:bg-gray-50'
                                }`}
                            >
                                {/* Аватар чата */}
                                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                    {chat.user.avatarUrl ? (
                                        <img
                                            src={chat.user.avatarUrl}
                                            alt=""
                                            className="w-9 h-9 rounded-full object-cover"
                                        />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </div>
                                {/* Название + участники */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                        {chat.user.firstName}
                                    </p>
                                    {chat.membersCount && (
                                        <p className="text-[11px] text-gray-400">
                                            {chat.membersCount} участников
                                        </p>
                                    )}
                                </div>
                                {/* Галочка выбора */}
                                {selectedChatPeerId === chat.peerId && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        ))
                    )}
                </div>

                {/* Комментарий */}
                <div className="px-5 py-3 border-t border-gray-100">
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Комментарий (необязательно)..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        rows={2}
                    />
                </div>

                {/* Кнопки */}
                <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={isSending}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={!selectedChatPeerId || isSending}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSending ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Отправка...
                            </>
                        ) : (
                            <>
                                {/* Иконка пересылки */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                Переслать
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
