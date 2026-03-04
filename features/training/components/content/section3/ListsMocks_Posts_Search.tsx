import React, { useState } from 'react';
import { mockPosts } from './ListsMocks_Posts_Types';

// =====================================================================
// MOCK КОМПОНЕНТ: ИНТЕРАКТИВНЫЙ ПОИСК ПОСТОВ (раздел 3.2.4)
// Выделено из ListsMocks_Posts.tsx
// =====================================================================

// Компонент: Интерактивный поиск
export const PostsSearchDemo: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const filteredPosts = mockPosts.filter(post => {
        const searchLower = searchQuery.toLowerCase();
        return !searchQuery || post.text.toLowerCase().includes(searchLower);
    });

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 2000);
    };

    return (
        <div className="space-y-4">
            {/* Панель поиска */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                    <div className="relative flex-grow">
                        <input 
                            type="text" 
                            placeholder="Поиск по тексту..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center justify-center h-9 px-3 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
                        title="Обновить список постов"
                    >
                        {isRefreshing ? (
                            <div className="h-4 w-4 border-2 border-gray-400 border-t-indigo-500 rounded-full animate-spin"></div>
                        ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Счётчик результатов */}
                <div className="mt-3 text-sm text-gray-600">
                    Найдено постов: <strong>{filteredPosts.length}</strong> из {mockPosts.length}
                </div>
            </div>

            {/* Таблица с отфильтрованными данными */}
            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200 custom-scrollbar max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm relative">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 bg-gray-50">Медиа</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Текст</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 bg-gray-50">Лайки</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 bg-gray-50">Коммент.</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 bg-gray-50">Ссылка</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredPosts.length > 0 ? (
                            filteredPosts.map(post => (
                                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        {post.image_url ? (
                                            <div className="w-10 h-10 rounded overflow-hidden border border-gray-200">
                                                <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded bg-gray-100"></div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 max-w-[300px]">
                                        <div className="text-gray-800 text-sm truncate">{post.text}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-sm font-medium ${post.user_likes ? 'text-red-500' : 'text-gray-700'}`}>
                                            {post.likes_count}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-gray-700">{post.comments_count}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <a 
                                            href={post.vk_link} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="inline-flex items-center justify-center w-8 h-8 border border-gray-300 text-gray-400 rounded-md hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                                    Постов с таким текстом не найдено
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
