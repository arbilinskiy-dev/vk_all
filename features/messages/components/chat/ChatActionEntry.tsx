/**
 * ChatActionEntry — отображение действия менеджера в хронологии чата.
 * Мелкий текст по центру, между сообщениями.
 */

import React from 'react';
import type { ChatActionData, ChatActionType } from '../../types';

interface ChatActionEntryProps {
    action: ChatActionData;
}

/** Текст и иконка для каждого типа действия */
const ACTION_CONFIG: Record<ChatActionType, { icon: string; getText: (name: string, meta?: ChatActionData['metadata']) => string }> = {
    chat_enter: {
        icon: '→',
        getText: (name) => `${name} зашёл в чат`,
    },
    chat_leave: {
        icon: '←',
        getText: (name) => `${name} вышел из чата`,
    },
    mark_important: {
        icon: '⭐',
        getText: (name) => `${name} отметил чат важным`,
    },
    unmark_important: {
        icon: '☆',
        getText: (name) => `${name} снял отметку «Важное»`,
    },
    mark_unread: {
        icon: '◉',
        getText: (name) => `${name} отметил чат непрочитанным`,
    },
    label_assign: {
        icon: '🏷',
        getText: (name, meta) => {
            const labelName = meta?.label_name || 'метку';
            return `${name} прикрепил метку «${labelName}»`;
        },
    },
    label_unassign: {
        icon: '🏷',
        getText: (name, meta) => {
            const labelName = meta?.label_name || 'метку';
            return `${name} открепил метку «${labelName}»`;
        },
    },
    forward_to_chat: {
        icon: '↗',
        getText: (name, meta) => {
            const count = (meta?.messages_count as number) || 0;
            const msgWord = count === 1 ? 'сообщение' : count < 5 ? 'сообщения' : 'сообщений';
            return count
                ? `${name} переслал ${count} ${msgWord} в групповой чат`
                : `${name} переслал сообщения в групповой чат`;
        },
    },
    message_send: {
        icon: '✉',
        getText: (name) => `${name} отправил сообщение`,
    },
};

export const ChatActionEntry: React.FC<ChatActionEntryProps> = ({ action }) => {
    const config = ACTION_CONFIG[action.action_type] || {
        icon: '•',
        getText: (name: string) => `${name} — ${action.action_type}`,
    };

    const text = config.getText(action.manager_name, action.metadata);
    const time = action.timestamp
        ? new Date(action.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        : '';

    // Цвет бейджа метки
    const labelColor = action.metadata?.label_color as string | undefined;

    return (
        <div className="flex items-center justify-center gap-1.5 py-1 select-none">
            <span className="text-[11px] text-gray-400 leading-none">{config.icon}</span>
            <span className="text-[11px] text-gray-400 leading-tight">
                {text}
            </span>
            {/* Цветной индикатор метки */}
            {labelColor && (action.action_type === 'label_assign' || action.action_type === 'label_unassign') && (
                <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: labelColor }}
                />
            )}
            {time && (
                <span className="text-[10px] text-gray-300 leading-none ml-0.5">{time}</span>
            )}
        </div>
    );
};
