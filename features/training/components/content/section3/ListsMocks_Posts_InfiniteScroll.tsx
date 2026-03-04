import React, { useState } from 'react';
import type { MockPost } from './ListsMocks_Posts_Types';
import { mockPosts } from './ListsMocks_Posts_Types';

// =====================================================================
// MOCK КОМПОНЕНТ: ДЕМОНСТРАЦИЯ БЕСКОНЕЧНОЙ ПРОКРУТКИ (раздел 3.2.4)
// Выделено из ListsMocks_Posts.tsx
// =====================================================================

// Компонент: Демонстрация Infinite Scroll
export const PostsInfiniteScrollDemo: React.FC = () => {
    const [items, setItems] = useState<MockPost[]>(mockPosts.slice(0, 2));
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);

    const loadMore = () => {
        if (isLoading || items.length >= mockPosts.length) return;
        
        setIsLoading(true);
        
        setTimeout(() => {
            const newItems = mockPosts.slice(items.length, items.length + 2);
            setItems([...items, ...newItems]);
            setPage(page + 1);
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-sm text-indigo-800">
                    <strong>Как работает:</strong> Прокрутите таблицу вниз до конца. Когда индикатор загрузки появится — 
                    автоматически загрузятся следующие 2 поста. Так работает "бесконечная прокрутка".
                </p>
            </div>

            <div className="bg-gray-100 p-2 rounded text-sm text-gray-700">
                Загружено: <strong>{items.length}</strong> из {mockPosts.length} постов | Страница: <strong>{page}</strong>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200 custom-scrollbar max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm relative">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 bg-gray-50">Медиа</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Текст</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 bg-gray-50">Лайки</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 bg-gray-50">Просмотры</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {items.map(post => (
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
                                <td className="px-4 py-3">
                                    <div className="text-sm text-gray-800 line-clamp-2">{post.text}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`text-sm font-medium ${post.user_likes ? 'text-red-500' : 'text-gray-700'}`}>
                                        {post.likes_count}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-sm text-gray-500">{post.views_count.toLocaleString('ru-RU')}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Индикатор загрузки / Триггер */}
                {items.length < mockPosts.length && (
                    <div 
                        className="h-16 w-full flex justify-center items-center py-4 border-t border-gray-100"
                        onMouseEnter={loadMore}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-gray-500">
                                <div className="inline-block h-6 w-6 border-4 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
                                <span className="text-sm">Загрузка...</span>
                            </div>
                        ) : (
                            <button
                                onClick={loadMore}
                                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                Загрузить ещё
                            </button>
                        )}
                    </div>
                )}

                {items.length >= mockPosts.length && (
                    <div className="py-4 text-center text-sm text-gray-400 border-t border-gray-100">
                        Все посты загружены
                    </div>
                )}
            </div>
        </div>
    );
};
