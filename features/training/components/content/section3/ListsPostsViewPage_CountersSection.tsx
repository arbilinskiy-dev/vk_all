/**
 * Раздел 4 страницы «Просмотр постов»
 * Счётчики активности — лайки, комментарии, репосты, просмотры.
 */
import React from 'react';

export const CountersSection: React.FC = () => (
    <>
        {/* ============================================ */}
        {/* РАЗДЕЛ 4: СЧЁТЧИКИ АКТИВНОСТИ */}
        {/* ============================================ */}
        <h2>4. Счётчики активности</h2>
        <p>
            В таблице <strong>4 типа счётчиков</strong>: лайки, комментарии, репосты и просмотры. Каждый 
            счётчик имеет свою иконку и цвет.
        </p>

        <div className="grid grid-cols-2 gap-4 my-6">
            {/* Лайки */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold text-gray-700">Лайки</span>
                </div>
                <p className="text-sm text-gray-600 mb-0">
                    <strong className="text-red-500">Красный цвет</strong> если текущий пользователь лайкнул пост 
                    (<code className="bg-gray-100 px-2 py-1 rounded text-xs">user_likes = 1</code>), 
                    иначе серый.
                </p>
            </div>

            {/* Комментарии */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold text-gray-700">Комментарии</span>
                </div>
                <p className="text-sm text-gray-600 mb-0">
                    Иконка чата. Цвет всегда <strong className="text-gray-700">серый</strong>.
                </p>
            </div>

            {/* Репосты */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                    <span className="font-bold text-gray-700">Репосты</span>
                </div>
                <p className="text-sm text-gray-600 mb-0">
                    Иконка связанных кругов. Цвет всегда <strong className="text-gray-700">серый</strong>.
                </p>
            </div>

            {/* Просмотры */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold text-gray-700">Просмотры</span>
                </div>
                <p className="text-sm text-gray-600 mb-0">
                    Иконка глаза. Цвет <strong className="text-gray-500">светло-серый</strong> 
                    (просмотры — вторичная метрика).
                </p>
            </div>
        </div>
    </>
);
