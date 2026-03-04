// =====================================================================
// Секция описания 5 кнопок управления конкурсом (таблица назначений)
// =====================================================================
import React from 'react';

export const ActionButtonsTableSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900 !mt-10">
            🎮 Кнопки действий (5 кнопок)
        </h2>

        <p>
            Над таблицей расположены <strong>5 кнопок управления конкурсом</strong>. Каждая имеет своё назначение и цвет:
        </p>

        <div className="not-prose">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden my-6">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700 w-40">Кнопка</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Назначение</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700 w-32">Цвет</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">🔄 Обновить</td>
                            <td className="px-4 py-3 text-gray-600">Перезагрузить список участников. Иконка вращается при загрузке.</td>
                            <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Серый</span></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">🗑️ Очистить</td>
                            <td className="px-4 py-3 text-gray-600">Удалить всех участников из базы (только для админов, для тестирования).</td>
                            <td className="px-4 py-3"><span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Красный</span></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">💬 Прокомментировать</td>
                            <td className="px-4 py-3 text-gray-600">Присвоить номера новым участникам и написать комментарии под их постами.</td>
                            <td className="px-4 py-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Зелёный</span></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">⭐ Подвести итоги</td>
                            <td className="px-4 py-3 text-gray-600">Выбрать случайного победителя из принятых участников (исключая ЧС).</td>
                            <td className="px-4 py-3"><span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">Янтарный</span></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">🔍 Собрать посты</td>
                            <td className="px-4 py-3 text-gray-600">Найти новые посты с ключевым словом в предложке сообщества.</td>
                            <td className="px-4 py-3"><span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Индиго</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </>
);
