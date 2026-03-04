// =====================================================================
// Секция описания структуры таблицы участников (7 колонок)
// =====================================================================
import React from 'react';

export const TableStructureSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900 !mt-10">
            📊 Структура таблицы участников
        </h2>

        <p>
            Таблица участников содержит <strong>7 колонок</strong>, каждая из которых несёт важную информацию:
        </p>

        <div className="not-prose">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden my-6">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Колонка</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Назначение</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">№</td>
                            <td className="px-4 py-3 text-gray-600">Присвоенный номер участника (1, 2, 3...). Если пусто — ещё не обработан.</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">Фото</td>
                            <td className="px-4 py-3 text-gray-600">Аватар пользователя из ВКонтакте (круглое фото 32×32px).</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">Автор</td>
                            <td className="px-4 py-3 text-gray-600">Имя и фамилия участника. Кликабельная ссылка на профиль VK.</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">Текст поста</td>
                            <td className="px-4 py-3 text-gray-600">Обрезанный текст отзыва (первые ~50 символов).</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">Статус</td>
                            <td className="px-4 py-3 text-gray-600">Цветной бейдж с текущим статусом обработки (6 вариантов).</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">Дата</td>
                            <td className="px-4 py-3 text-gray-600">Когда пользователь опубликовал пост с отзывом.</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">Действия</td>
                            <td className="px-4 py-3 text-gray-600">Иконка внешней ссылки — открыть пост ВКонтакте в новой вкладке.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </>
);
