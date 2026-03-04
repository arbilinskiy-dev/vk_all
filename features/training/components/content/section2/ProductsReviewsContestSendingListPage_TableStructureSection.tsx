import React from 'react';

// =====================================================================
// Секция «Структура журнала: 6 колонок»
// =====================================================================

export const TableStructureSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Структура журнала: 6 колонок</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Таблица отправок состоит из 6 колонок, каждая несёт важную информацию:
        </p>

        <div className="not-prose my-6">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Колонка</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Ширина</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Что показывает</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        <tr>
                            <td className="px-4 py-3 font-mono text-indigo-700">Пользователь</td>
                            <td className="px-4 py-3 text-gray-500">auto</td>
                            <td className="px-4 py-3 text-gray-700">Имя победителя + ID (кликабельная ссылка на профиль VK)</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 font-mono text-indigo-700">Выданный приз (Код)</td>
                            <td className="px-4 py-3 text-gray-500">auto</td>
                            <td className="px-4 py-3 text-gray-700">Промокод (моноширинный шрифт) + описание приза мелким текстом</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 font-mono text-indigo-700">Статус отправки</td>
                            <td className="px-4 py-3 text-gray-500">w-40</td>
                            <td className="px-4 py-3 text-gray-700">Бейдж "Доставлено (ЛС)" или "Ошибка ЛС" с подписью</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 font-mono text-indigo-700">Время</td>
                            <td className="px-4 py-3 text-gray-500">w-40</td>
                            <td className="px-4 py-3 text-gray-700">Дата и время отправки (формат: 15.02.2026, 14:30)</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 font-mono text-indigo-700">Чат</td>
                            <td className="px-4 py-3 text-gray-500">w-16</td>
                            <td className="px-4 py-3 text-gray-700">Иконка диалога (открывает переписку с победителем в VK)</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 font-mono text-indigo-700">Действия</td>
                            <td className="px-4 py-3 text-gray-500">w-32</td>
                            <td className="px-4 py-3 text-gray-700">Кнопка "Повторить" (только для записей со статусом ошибки)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </>
);
