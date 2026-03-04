/**
 * Разделы 11-12 страницы «Просмотр постов»
 * 11. Бесконечная прокрутка (infinite scroll)
 * 12. Ссылка на VK
 */
import React from 'react';
import { Sandbox } from '../shared';
import { PostsInfiniteScrollDemo } from './ListsMocks';

export const ScrollAndLinksSection: React.FC = () => (
    <>
        {/* ============================================ */}
        {/* РАЗДЕЛ 11: БЕСКОНЕЧНАЯ ПРОКРУТКА */}
        {/* ============================================ */}
        <h2>11. Бесконечная прокрутка</h2>
        <p>
            Таблица загружает посты <strong>порциями по 50 записей</strong>. Когда пользователь прокручивает 
            таблицу до конца, автоматически подгружается следующая порция. Это называется 
            <strong>"бесконечная прокрутка" (infinite scroll)</strong>.
        </p>

        <Sandbox>
            <PostsInfiniteScrollDemo />
        </Sandbox>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
            <p className="text-sm text-blue-800 mb-2"><strong>Как работает механика:</strong></p>
            <ol className="text-sm text-blue-800 mb-0 space-y-1 list-decimal list-inside">
                <li>Таблица загружает первые 50 постов</li>
                <li>В конце таблицы появляется <strong>невидимый триггер</strong> (IntersectionObserver)</li>
                <li>Когда триггер попадает в область видимости — запускается загрузка следующих 50 постов</li>
                <li>Во время загрузки показывается индикатор "Загрузка..."</li>
                <li>Новые посты добавляются в конец таблицы</li>
                <li>Процесс повторяется, пока не закончатся все посты</li>
            </ol>
        </div>

        {/* ============================================ */}
        {/* РАЗДЕЛ 12: ССЫЛКА НА VK */}
        {/* ============================================ */}
        <h2>12. Ссылка на VK</h2>
        <p>
            В последней колонке таблицы есть кнопка со стрелкой — <strong>прямая ссылка на пост ВКонтакте</strong>. 
            При клике пост открывается в новой вкладке браузера.
        </p>

        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-4 my-6">
            <a 
                href="https://vk.com/wall-123456_12345" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center w-8 h-8 border border-gray-300 text-gray-400 rounded-md hover:bg-gray-100 hover:text-indigo-600 transition-colors"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </a>
            <div>
                <div className="text-sm font-medium text-gray-700">Кнопка "Открыть в VK"</div>
                <div className="text-xs text-gray-500">При наведении становится синей</div>
            </div>
        </div>
    </>
);
