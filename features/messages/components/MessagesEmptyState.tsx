import React from 'react';
import { MessagesChannel } from '../types';

interface MessagesEmptyStateProps {
    /** Текущий канал */
    channel: MessagesChannel;
    /** Есть ли выбранный проект */
    hasProject: boolean;
}

/**
 * Заглушка для рабочей области модуля сообщений:
 * - Когда нет выбранного проекта
 * - Когда нет выбранного диалога
 */
export const MessagesEmptyState: React.FC<MessagesEmptyStateProps> = ({ channel, hasProject }) => {
    const channelName = channel === 'vk' ? 'ВКонтакте' : 'Telegram';

    return (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-white opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            {/* Иконка */}
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
                {channel === 'vk' ? (
                    // Иконка ВК (только логотип, без фоновой фигуры)
                    <svg className="h-10 w-10 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.547 7h-3.29a.743.743 0 0 0-.655.392s-1.312 2.416-1.734 3.23C14.734 12.813 14 12.126 14 11.11V7.603A1.104 1.104 0 0 0 12.896 6.5h-2.474a1.982 1.982 0 0 0-1.75.813s1.255-.204 1.255 1.49c0 .42.022 1.626.04 2.64a.73.73 0 0 1-1.272.503 21.54 21.54 0 0 1-2.498-4.543.693.693 0 0 0-.63-.403h-2.99a.508.508 0 0 0-.48.685C3.005 10.175 6.918 18 11.38 18h1.878a.742.742 0 0 0 .742-.742v-1.135a.73.73 0 0 1 1.23-.53l2.247 2.112a1.09 1.09 0 0 0 .746.295h2.953c1.424 0 1.424-.988.647-1.753-.546-.538-2.518-2.617-2.518-2.617a1.02 1.02 0 0 1-.078-1.323c.637-.84 1.68-2.212 2.122-2.8.603-.804 1.697-2.507.197-2.507z"/>
                    </svg>
                ) : (
                    // Иконка Telegram (только самолётик, без круга)
                    <svg className="h-10 w-10 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"/>
                    </svg>
                )}
            </div>

            {!hasProject ? (
                <>
                    <h2 className="text-xl font-bold text-gray-700">Сообщения {channelName}</h2>
                    <p className="mt-2 text-gray-500 max-w-md">
                        Выберите проект из списка слева, чтобы увидеть диалоги с пользователями от лица сообщества.
                    </p>
                </>
            ) : (
                <>
                    <h2 className="text-xl font-bold text-gray-700">Выберите диалог</h2>
                    <p className="mt-2 text-gray-500 max-w-md">
                        Выберите пользователя из списка диалогов слева, чтобы начать переписку от лица сообщества.
                    </p>
                </>
            )}

            {/* Информационная плашка */}
            <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100 max-w-md">
                <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <div className="text-left">
                        <p className="text-sm font-medium text-gray-700">
                            Работа с сообщениями
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Здесь вы сможете вести переписку с пользователями от лица сообщества. 
                            Все сообщения синхронизируются с {channelName} в реальном времени.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
