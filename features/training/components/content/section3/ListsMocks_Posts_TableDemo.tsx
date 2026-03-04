import React, { useState } from 'react';
import type { MockPost } from './ListsMocks_Posts_Types';
import { mockPosts } from './ListsMocks_Posts_Types';

// =====================================================================
// MOCK КОМПОНЕНТЫ: ТАБЛИЦА ПОСТОВ С ДАННЫМИ (раздел 3.2.4)
// PostRow, PostsTableDemo, PostsTableStatesDemo
// Выделено из ListsMocks_Posts.tsx
// =====================================================================

// Компонент: Строка поста с счётчиками
export const PostRow: React.FC<{ post: MockPost; onClick?: () => void }> = ({ post, onClick }) => {
    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
            {/* Медиа */}
            <td className="px-4 py-3">
                {post.image_url ? (
                    <div 
                        className="w-10 h-10 rounded overflow-hidden border border-gray-200 shadow-sm cursor-pointer"
                        onClick={onClick}
                    >
                        <img 
                            src={post.image_url} 
                            alt="" 
                            className="w-full h-full object-cover hover:scale-110 transition-transform" 
                        />
                    </div>
                ) : (
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-300 border border-gray-200">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </td>

            {/* Текст */}
            <td className="px-4 py-3 max-w-[250px]">
                <div className="text-gray-800 text-sm truncate" title={post.text}>
                    {post.text || <span className="text-gray-400 italic">Текст отсутствует</span>}
                </div>
            </td>

            {/* Лайки */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <span className={`font-medium text-sm ${post.user_likes ? 'text-red-500' : 'text-gray-700'}`}>
                        {post.likes_count.toLocaleString('ru-RU')}
                    </span>
                </div>
            </td>

            {/* Комментарии */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 text-sm">
                        {post.comments_count.toLocaleString('ru-RU')}
                    </span>
                </div>
            </td>

            {/* Репосты */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                    <span className="text-gray-700 text-sm">
                        {post.reposts_count.toLocaleString('ru-RU')}
                    </span>
                </div>
            </td>

            {/* Просмотры */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-500 text-sm">
                        {post.views_count.toLocaleString('ru-RU')}
                    </span>
                </div>
            </td>

            {/* Дата публикации */}
            <td className="px-4 py-3">
                <span className="text-xs text-gray-600">{formatDate(post.date)}</span>
            </td>

            {/* Ссылка на VK */}
            <td className="px-4 py-3">
                <a 
                    href={post.vk_link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center justify-center w-8 h-8 border border-gray-300 text-gray-400 rounded-md hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                    title="Открыть пост в VK"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            </td>
        </tr>
    );
};

// Компонент: Таблица постов с данными и превью изображений
export const PostsTableDemo: React.FC = () => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    return (
        <>
            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200 custom-scrollbar max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm relative">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 bg-gray-50">
                                Медиа
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                                Текст
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 bg-gray-50">
                                Лайки
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 bg-gray-50">
                                Коммент.
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 bg-gray-50">
                                Репосты
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 bg-gray-50">
                                Просмотры
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36 bg-gray-50">
                                Публ.
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 bg-gray-50">
                                Ссылка
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {mockPosts.map(post => (
                            <PostRow 
                                key={post.id} 
                                post={post} 
                                onClick={() => post.image_url && setPreviewImage(post.image_url)}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Модальное окно превью изображения */}
            {previewImage && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100]" 
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-4/5 p-4" onClick={e => e.stopPropagation()}>
                        <img 
                            src={previewImage} 
                            alt="Preview" 
                            className="max-w-full max-h-[85vh] object-contain rounded-lg"
                        />
                        <button 
                            onClick={() => setPreviewImage(null)} 
                            className="absolute -top-2 -right-2 bg-gray-800 bg-opacity-75 text-white rounded-full p-2 hover:bg-black transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

// Компонент: Состояния таблицы постов (загрузка / пусто / данные)
export const PostsTableStatesDemo: React.FC = () => {
    const [state, setState] = useState<'loading' | 'empty' | 'data'>('loading');

    return (
        <div className="space-y-4">
            {/* Панель переключения */}
            <div className="flex gap-2 justify-center">
                <button
                    onClick={() => setState('loading')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        state === 'loading'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Загрузка
                </button>
                <button
                    onClick={() => setState('empty')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        state === 'empty'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Пустой список
                </button>
                <button
                    onClick={() => setState('data')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        state === 'data'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    С данными
                </button>
            </div>

            {/* Отображение состояния */}
            <div className="bg-white rounded-lg shadow border border-gray-200 min-h-[200px] flex items-center justify-center">
                {state === 'loading' && (
                    <div className="p-8 text-center text-gray-500">
                        <div className="inline-block h-8 w-8 border-4 border-gray-300 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                        <p>Загрузка постов...</p>
                    </div>
                )}

                {state === 'empty' && (
                    <div className="p-12 text-center text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="font-medium">Список пуст</p>
                        <p className="text-sm mt-1">Посты появятся после синхронизации</p>
                    </div>
                )}

                {state === 'data' && (
                    <div className="w-full p-4">
                        <PostsTableDemo />
                    </div>
                )}
            </div>
        </div>
    );
};
