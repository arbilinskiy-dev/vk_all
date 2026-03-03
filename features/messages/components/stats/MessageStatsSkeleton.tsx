/**
 * Скелетон загрузки для страницы статистики сообщений.
 */
import React from 'react';

export const MessageStatsSkeleton: React.FC = () => (
    <div className="h-full overflow-y-auto custom-scrollbar bg-gray-50">
        <div className="max-w-7xl px-6 py-6 space-y-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-7 w-56 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-72 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                    <div className="h-9 w-36 bg-gray-200 rounded-md animate-pulse" />
                    <div className="h-9 w-28 bg-gray-200 rounded-md animate-pulse" />
                </div>
            </div>
            {/* Карточки */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                        <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                ))}
            </div>
            {/* График */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="h-52 bg-gray-200 rounded animate-pulse" />
            </div>
            {/* Таблица */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
                </div>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-4 border-b border-gray-100">
                        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                        <div className="flex-1 space-y-1">
                            <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);
