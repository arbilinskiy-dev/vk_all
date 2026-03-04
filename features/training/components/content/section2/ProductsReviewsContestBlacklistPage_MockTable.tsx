/**
 * Mock-компонент таблицы чёрного списка конкурса отзывов.
 * Извлечён из ProductsReviewsContestBlacklistPage для декомпозиции.
 */
import React, { useState } from 'react';

// =====================================================================
// Тип записи чёрного списка
// =====================================================================

export interface MockBlacklistEntry {
    id: string;
    user_name: string;
    user_vk_id: number;
    user_screen_name: string;
    until_date: string | null;
    created_at: string;
}

// =====================================================================
// MOCK-КОМПОНЕНТ: Таблица черного списка
// =====================================================================

export const MockBlacklistTable: React.FC<{ entries: MockBlacklistEntry[] }> = ({ entries }) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const formatDate = (dateStr: string | null): React.ReactNode => {
        if (!dateStr) return <span className="text-gray-400">Навсегда</span>;
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const isDateExpired = (dateStr: string | null): boolean => {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date();
    };

    const handleDeleteClick = (id: string) => {
        setDeletingId(id);
        setTimeout(() => setDeletingId(null), 2000);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Шапка */}
            <div className="p-4 border-b flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Черный список</h3>
                    <p className="text-sm text-gray-500">Участники, которые будут исключены из розыгрыша.</p>
                </div>
                <button className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors text-sm font-medium flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Добавить в ЧС
                </button>
            </div>

            {/* Таблица */}
            {entries.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-400 p-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <p className="text-sm font-medium">Черный список пуст.</p>
                </div>
            ) : (
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left">Пользователь</th>
                                <th className="px-6 py-3 text-left">Срок блокировки</th>
                                <th className="px-6 py-3 text-left">Дата добавления</th>
                                <th className="w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600">
                            {entries.map((item) => {
                                const expired = isDateExpired(item.until_date);
                                return (
                                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${expired ? 'bg-gray-50 opacity-60' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-800">{item.user_name || `ID ${item.user_vk_id}`}</span>
                                                {item.user_screen_name && (
                                                    <a 
                                                        href={`https://vk.com/${item.user_screen_name}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-indigo-500 hover:underline"
                                                    >
                                                        vk.com/{item.user_screen_name}
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-medium ${expired ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                    {formatDate(item.until_date)}
                                                </span>
                                                {expired && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 rounded">Истек</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {new Date(item.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => handleDeleteClick(item.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                                                title="Удалить из черного списка"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {deletingId && (
                <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg text-sm">
                    ✓ Пользователь удален из черного списка
                </div>
            )}
        </div>
    );
};
