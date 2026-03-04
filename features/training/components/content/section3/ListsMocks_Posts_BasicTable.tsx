import React from 'react';
import type { MockPostRowProps } from './ListsMocks_Posts_Types';

// =====================================================================
// MOCK КОМПОНЕНТЫ: БАЗОВАЯ ТАБЛИЦА ПОСТОВ (раздел 3.2.1)
// Выделено из ListsMocks_Posts.tsx
// =====================================================================

// Компонент: Строка таблицы поста (базовая)
export const MockPostRow: React.FC<MockPostRowProps> = ({ post }) => {
    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            {/* Превью */}
            <td className="px-4 py-3">
                <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                    {post.image_url ? (
                        <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    )}
                </div>
            </td>

            {/* Текст */}
            <td className="px-4 py-3 max-w-xs">
                <p className="text-sm text-gray-700 line-clamp-2">
                    {post.text || <span className="italic text-gray-400">Текст отсутствует</span>}
                </p>
            </td>

            {/* Лайки */}
            <td className="px-4 py-3 text-center">
                <span className={`text-sm font-medium ${post.user_likes ? 'text-red-600' : 'text-gray-600'}`}>
                    {post.likes_count.toLocaleString()}
                </span>
            </td>

            {/* Комментарии */}
            <td className="px-4 py-3 text-center">
                <span className="text-sm text-gray-600">{post.comments_count.toLocaleString()}</span>
            </td>

            {/* Репосты */}
            <td className="px-4 py-3 text-center">
                <span className="text-sm text-gray-600">{post.reposts_count.toLocaleString()}</span>
            </td>

            {/* Просмотры */}
            <td className="px-4 py-3 text-center">
                <span className="text-sm text-gray-500">{post.views_count.toLocaleString()}</span>
            </td>

            {/* Дата публикации */}
            <td className="px-4 py-3 text-sm text-gray-700">
                {formatDate(post.date)}
            </td>

            {/* Дата сбора */}
            <td className="px-4 py-3 text-sm text-gray-500">
                {new Date(post.last_updated).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </td>

            {/* Ссылка */}
            <td className="px-4 py-3 text-center">
                <a 
                    href={post.vk_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-8 h-8 border border-gray-300 rounded hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            </td>
        </tr>
    );
};

// Компонент: Базовая таблица постов (раздел 3.2.1)
export const MockPostsTable: React.FC = () => {
    const mockPosts = [
        {
            vk_id: 12345,
            image_url: 'https://picsum.photos/seed/post1/400/400',
            text: 'Друзья! Рады сообщить вам об открытии нового филиала нашей компании. Приглашаем всех на открытие!',
            likes_count: 245,
            comments_count: 18,
            reposts_count: 12,
            views_count: 3420,
            user_likes: 1,
            date: Math.floor(Date.now() / 1000) - 86400,
            last_updated: new Date().toISOString(),
            vk_link: 'https://vk.com/wall-123456_12345'
        },
        {
            vk_id: 12346,
            text: 'Скидки до 50% на все товары! Торопитесь, предложение ограничено!',
            likes_count: 89,
            comments_count: 5,
            reposts_count: 3,
            views_count: 1240,
            user_likes: 0,
            date: Math.floor(Date.now() / 1000) - 172800,
            last_updated: new Date().toISOString(),
            vk_link: 'https://vk.com/wall-123456_12346'
        },
        {
            vk_id: 12347,
            image_url: 'https://picsum.photos/seed/post3/400/400',
            text: '',
            likes_count: 156,
            comments_count: 12,
            reposts_count: 8,
            views_count: 2180,
            user_likes: 0,
            date: Math.floor(Date.now() / 1000) - 259200,
            last_updated: new Date().toISOString(),
            vk_link: 'https://vk.com/wall-123456_12347'
        }
    ];

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Медиа</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Текст</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                <span className="flex items-center justify-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Публ.</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Собрано</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ссылка</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {mockPosts.map((post) => (
                            <MockPostRow key={post.vk_id} post={post} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
