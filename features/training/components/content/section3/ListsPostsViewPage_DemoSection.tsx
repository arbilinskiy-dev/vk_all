/**
 * Разделы 5-7 страницы «Просмотр постов»
 * 5. Полная таблица с данными (демо)
 * 6. Состояния таблицы (загрузка, пусто, данные)
 * 7. Поиск по тексту
 */
import React from 'react';
import { Sandbox } from '../shared';
import {
    PostsTableDemo,
    PostsTableStatesDemo,
    PostsSearchDemo,
} from './ListsMocks';

export const DemoSection: React.FC = () => (
    <>
        {/* ============================================ */}
        {/* РАЗДЕЛ 5: ПОЛНАЯ ТАБЛИЦА С ДАННЫМИ */}
        {/* ============================================ */}
        <h2>5. Полная таблица с данными</h2>
        <p>
            Вот как выглядит таблица с реальными постами. Попробуйте:
        </p>
        <ul>
            <li>Навести мышку на строку — она подсветится</li>
            <li>Кликнуть на превью изображения — откроется увеличенная версия</li>
            <li>Кликнуть на кнопку со стрелкой — откроется пост в ВК</li>
        </ul>

        <Sandbox>
            <PostsTableDemo />
        </Sandbox>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-6">
            <p className="text-sm text-green-800 mb-0">
                <strong>💡 Обратите внимание:</strong> Посты с лайком текущего пользователя (красные цифры) 
                выделяются, чтобы SMM-щик видел, какие посты он уже оценил.
            </p>
        </div>

        {/* ============================================ */}
        {/* РАЗДЕЛ 6: СОСТОЯНИЯ ТАБЛИЦЫ */}
        {/* ============================================ */}
        <h2>6. Состояния таблицы</h2>
        <p>
            Таблица может находиться в <strong>3 состояниях</strong>: загрузка данных, пустой список 
            (нет постов) и отображение данных. Переключайте состояния кнопками ниже:
        </p>

        <Sandbox>
            <PostsTableStatesDemo />
        </Sandbox>

        <table className="min-w-full border border-gray-300 text-sm mt-6">
            <thead className="bg-gray-100">
                <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">Состояние</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Когда появляется</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Что видит пользователь</th>
                </tr>
            </thead>
            <tbody>
                <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">Загрузка</td>
                    <td className="border border-gray-300 px-4 py-2">При первом открытии списка или обновлении</td>
                    <td className="border border-gray-300 px-4 py-2">Крутящийся индикатор + текст "Загрузка постов..."</td>
                </tr>
                <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">Пустой список</td>
                    <td className="border border-gray-300 px-4 py-2">Если в списке ещё нет ни одного поста</td>
                    <td className="border border-gray-300 px-4 py-2">Серая иконка документа + текст "Список пуст"</td>
                </tr>
                <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">С данными</td>
                    <td className="border border-gray-300 px-4 py-2">Когда данные успешно загружены</td>
                    <td className="border border-gray-300 px-4 py-2">Таблица с постами, всеми колонками и счётчиками</td>
                </tr>
            </tbody>
        </table>

        {/* ============================================ */}
        {/* РАЗДЕЛ 7: ПОИСК ПО ТЕКСТУ */}
        {/* ============================================ */}
        <h2>7. Поиск по тексту</h2>
        <p>
            В верхней панели есть поле поиска. Оно ищет <strong>мгновенно по мере набора текста</strong> 
            (не нужно нажимать Enter). Поиск идёт по тексту поста, регистр не важен.
        </p>

        <Sandbox>
            <PostsSearchDemo />
        </Sandbox>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
            <p className="text-sm text-blue-800 mb-2"><strong>Как работает поиск:</strong></p>
            <ul className="text-sm text-blue-800 mb-0 space-y-1">
                <li>Начинаете вводить текст → таблица сразу фильтруется</li>
                <li>Счётчик результатов обновляется: "Найдено постов: 2 из 5"</li>
                <li>Если ничего не найдено → показывается сообщение "Постов с таким текстом не найдено"</li>
                <li>Поиск <strong>не чувствителен к регистру</strong> ("скидки" = "СКИДКИ")</li>
            </ul>
        </div>
    </>
);
