/**
 * Разделы 1-3 страницы «Просмотр постов»
 * 1. Анатомия таблицы — 4 ключевых зоны
 * 2. Колонки таблицы — описание 9 колонок
 * 3. Структура данных — интерфейс SystemListPost
 */
import React from 'react';
import { Sandbox } from '../shared';
import { PostsTableAnatomy } from './ListsMocks';

export const StructureSection: React.FC = () => (
    <>
        {/* ============================================ */}
        {/* РАЗДЕЛ 1: АНАТОМИЯ ТАБЛИЦЫ */}
        {/* ============================================ */}
        <h2>1. Анатомия таблицы постов</h2>
        <p>
            Таблица состоит из <strong>4 ключевых зон</strong>: панель поиска, заголовки колонок, строки с данными 
            и индикатор загрузки. Каждая зона выполняет свою функцию.
        </p>

        <Sandbox>
            <PostsTableAnatomy />
        </Sandbox>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
            <p className="text-sm text-blue-800 mb-2"><strong>Объяснение зон:</strong></p>
            <ul className="text-sm text-blue-800 mb-0 space-y-1">
                <li><strong className="text-blue-600">Зона 1:</strong> Поиск по тексту + кнопка обновления списка</li>
                <li><strong className="text-green-600">Зона 2:</strong> Заголовки колонок таблицы (липкие при прокрутке)</li>
                <li><strong className="text-purple-600">Зона 3:</strong> Строки с данными постов (прокручиваются)</li>
                <li><strong className="text-indigo-600">Зона 4:</strong> Индикатор автоматической загрузки следующих постов</li>
            </ul>
        </div>

        {/* ============================================ */}
        {/* РАЗДЕЛ 2: СТРУКТУРА КОЛОНОК */}
        {/* ============================================ */}
        <h2>2. Колонки таблицы</h2>
        <p>
            В таблице <strong>9 колонок</strong>, каждая с фиксированной шириной. Заголовки "прилипают" к верху 
            при прокрутке, чтобы всегда видеть, что в каком столбце.
        </p>

        <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
                <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">№</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Название</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Ширина</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Что показывает</th>
                </tr>
            </thead>
            <tbody>
                <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">1</td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">Медиа</td>
                    <td className="border border-gray-300 px-4 py-2"><code className="bg-gray-100 px-2 py-1 rounded text-xs">60px</code></td>
                    <td className="border border-gray-300 px-4 py-2">Превью изображения поста (40×40px)</td>
                </tr>
                <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">2</td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">Текст</td>
                    <td className="border border-gray-300 px-4 py-2"><code className="bg-gray-100 px-2 py-1 rounded text-xs">250px</code></td>
                    <td className="border border-gray-300 px-4 py-2">Текст поста (обрезается, если длинный)</td>
                </tr>
                <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">3</td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">Лайки</td>
                    <td className="border border-gray-300 px-4 py-2"><code className="bg-gray-100 px-2 py-1 rounded text-xs">80px</code></td>
                    <td className="border border-gray-300 px-4 py-2">Иконка сердца + количество лайков</td>
                </tr>
                <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">4</td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">Комментарии</td>
                    <td className="border border-gray-300 px-4 py-2"><code className="bg-gray-100 px-2 py-1 rounded text-xs">80px</code></td>
                    <td className="border border-gray-300 px-4 py-2">Иконка чата + количество комментариев</td>
                </tr>
                <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">5</td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">Репосты</td>
                    <td className="border border-gray-300 px-4 py-2"><code className="bg-gray-100 px-2 py-1 rounded text-xs">80px</code></td>
                    <td className="border border-gray-300 px-4 py-2">Иконка стрелок + количество репостов</td>
                </tr>
                <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">6</td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">Просмотры</td>
                    <td className="border border-gray-300 px-4 py-2"><code className="bg-gray-100 px-2 py-1 rounded text-xs">80px</code></td>
                    <td className="border border-gray-300 px-4 py-2">Иконка глаза + количество просмотров</td>
                </tr>
                <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">7</td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">Публ.</td>
                    <td className="border border-gray-300 px-4 py-2"><code className="bg-gray-100 px-2 py-1 rounded text-xs">140px</code></td>
                    <td className="border border-gray-300 px-4 py-2">Дата и время публикации поста</td>
                </tr>
                <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">8</td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">Собрано</td>
                    <td className="border border-gray-300 px-4 py-2"><code className="bg-gray-100 px-2 py-1 rounded text-xs">140px</code></td>
                    <td className="border border-gray-300 px-4 py-2">Когда последний раз обновлялась статистика</td>
                </tr>
                <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">9</td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">Ссылка</td>
                    <td className="border border-gray-300 px-4 py-2"><code className="bg-gray-100 px-2 py-1 rounded text-xs">60px</code></td>
                    <td className="border border-gray-300 px-4 py-2">Кнопка для открытия поста в ВК</td>
                </tr>
            </tbody>
        </table>

        {/* ============================================ */}
        {/* РАЗДЕЛ 3: СТРУКТУРА ДАННЫХ */}
        {/* ============================================ */}
        <h2>3. Структура данных поста</h2>
        <p>
            Каждый пост в таблице — это объект с <strong>11 полями</strong>. Данные приходят из ВКонтакте и 
            хранятся в базе данных.
        </p>

        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono">
            <pre className="mb-0">{`interface SystemListPost {
    id: string;                   // Уникальный ID записи в БД
    vk_id: number;                // ID поста в ВК (wall-123456_789)
    date: number;                 // Unix timestamp публикации
    text: string;                 // Текст поста
    image_url?: string;           // Ссылка на превью (опционально)
    likes_count: number;          // Количество лайков
    comments_count: number;       // Количество комментариев
    reposts_count: number;        // Количество репостов
    views_count: number;          // Количество просмотров
    user_likes: number;           // 1 если пользователь лайкнул, 0 если нет
    last_updated: string;         // ISO дата обновления статистики
    vk_link: string;              // Прямая ссылка на пост
}`}</pre>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-6">
            <p className="text-sm text-amber-800 mb-2">
                <strong>🔍 Важный нюанс:</strong> Поле <code className="bg-amber-100 px-2 py-1 rounded text-xs">user_likes</code> 
                показывает, лайкнул ли <strong>текущий пользователь системы</strong> этот пост (не клиент, а администратор). 
                Если <code className="bg-amber-100 px-2 py-1 rounded text-xs">user_likes = 1</code>, счётчик лайков 
                подсвечивается <span className="text-red-500 font-bold">красным</span>.
            </p>
        </div>
    </>
);
