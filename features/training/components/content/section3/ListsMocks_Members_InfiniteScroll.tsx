import React, { useState } from 'react';
import { mockMembers } from './ListsMocks_Members_Data';
import type { MockMember } from './ListsMocks_Members_Types';

// =====================================================================
// MOCK КОМПОНЕНТ: ДЕМОНСТРАЦИЯ INFINITE SCROLL (раздел 3.2.3)
// =====================================================================

export const InfiniteScrollDemo: React.FC = () => {
    const [items, setItems] = useState<MockMember[]>(mockMembers.slice(0, 3));
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);

    const loadMore = () => {
        if (isLoading || items.length >= mockMembers.length) return;
        
        setIsLoading(true);
        
        // Имитация загрузки с сервера
        setTimeout(() => {
            const newItems = mockMembers.slice(items.length, items.length + 2);
            setItems([...items, ...newItems]);
            setPage(page + 1);
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-sm text-indigo-800">
                    <strong>Как работает:</strong> Прокрутите таблицу вниз до конца. Когда индикатор загрузки появится на экране — 
                    автоматически загрузятся следующие 2 участника. Так работает "бесконечная прокрутка" — не нужно нажимать кнопки.
                </p>
            </div>

            <div className="bg-gray-100 p-2 rounded text-sm text-gray-700">
                Загружено: <strong>{items.length}</strong> из {mockMembers.length} участников | Страница: <strong>{page}</strong>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200 custom-scrollbar max-h-[350px] overflow-y-auto">
                <table className="w-full text-sm relative">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 bg-gray-50"></th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Пользователь</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Город</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Статус</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {items.map(member => (
                            <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    {member.photo_url ? (
                                        <img src={member.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="text-sm font-medium text-gray-900">{member.first_name} {member.last_name}</div>
                                    <div className="text-xs text-gray-500">{member.vk_user_id}</div>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-700">{member.city || '—'}</td>
                                <td className="px-4 py-3">
                                    {member.deactivated ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            {member.deactivated === 'banned' ? 'Заблокир.' : 'Удален'}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Активен
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Индикатор загрузки / Триггер для IntersectionObserver */}
                {items.length < mockMembers.length && (
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

                {items.length >= mockMembers.length && (
                    <div className="py-4 text-center text-sm text-gray-400 border-t border-gray-100">
                        Все участники загружены
                    </div>
                )}
            </div>
        </div>
    );
};
