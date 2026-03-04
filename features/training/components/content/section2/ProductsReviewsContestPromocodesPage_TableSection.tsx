import React from 'react';
import { Sandbox } from '../shared';
import { ActionIconsDemo } from './ProductsReviewsContestPromocodesPage_ActionIconsDemo';
import { StatusesDemo } from './ProductsReviewsContestPromocodesPage_StatusesDemo';

// =====================================================================
// Секция: Таблица промокодов + Песочницы иконок и статусов
// =====================================================================
export const TableSection: React.FC = () => (
    <>
        {/* Таблица промокодов */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Таблица промокодов: 7 колонок</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Таблица показывает все загруженные промокоды и их текущее состояние:
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
                            <td className="px-4 py-3 font-mono text-indigo-700">Чекбокс</td>
                            <td className="px-4 py-3 text-gray-500">w-10</td>
                            <td className="px-4 py-3 text-gray-700">Выбор для массового удаления (только свободные)</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 font-mono text-indigo-700">Код</td>
                            <td className="px-4 py-3 text-gray-500">w-40</td>
                            <td className="px-4 py-3 text-gray-700">Сам промокод (моноширинный шрифт)</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 font-mono text-indigo-700">Описание</td>
                            <td className="px-4 py-3 text-gray-500">-</td>
                            <td className="px-4 py-3 text-gray-700">Описание приза (редактируемое поле)</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 font-mono text-indigo-700">Статус</td>
                            <td className="px-4 py-3 text-gray-500">w-28</td>
                            <td className="px-4 py-3 text-gray-700">Бейдж "Свободен" (зелёный) или "Выдан" (серый)</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 font-mono text-indigo-700">Кому выдан</td>
                            <td className="px-4 py-3 text-gray-500">w-48</td>
                            <td className="px-4 py-3 text-gray-700">Имя победителя + ID + дата выдачи (если выдан)</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 font-mono text-indigo-700">Диалог</td>
                            <td className="px-4 py-3 text-gray-500">w-24</td>
                            <td className="px-4 py-3 text-gray-700">Иконка чата (открывает переписку с победителем)</td>
                        </tr>
                        <tr>
                            <td className="px-4 py-3 font-mono text-indigo-700">Удалить</td>
                            <td className="px-4 py-3 text-gray-500">w-10</td>
                            <td className="px-4 py-3 text-gray-700">Иконка корзины (только для свободных)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <hr className="!my-10" />

        {/* Песочница: Иконки действий */}
        <Sandbox
            title="🎨 Интерактивные иконки действий"
            description="Наведите курсор на каждую иконку, чтобы увидеть её назначение. Все SVG-пути взяты из реального кода."
            instructions={[
                '<strong>Карандаш</strong> (edit) — появляется при наведении на описание свободного промокода',
                '<strong>Галочка</strong> (save) и <strong>Крестик</strong> (cancel) — для редактирования описания',
                '<strong>Чат</strong> (chat) — открывает диалог ВК с победителем (только для выданных)',
                '<strong>Корзина</strong> (delete) — удаление промокода (только для свободных)'
            ]}
        >
            <ActionIconsDemo />
        </Sandbox>

        <hr className="!my-10" />

        {/* Песочница: Статусы промокодов */}
        <Sandbox
            title="🏷️ Статусы промокодов"
            description="Переключайте между статусами, чтобы увидеть разницу в отображении и доступных действиях."
            instructions={[
                'Статус "Свободен" (зелёный) — промокод в запасе, можно редактировать и удалять',
                'Статус "Выдан" (серый) — промокод использован победителем, только просмотр информации',
                'У выданных промокодов видно: кому выдан, когда выдан, ссылка на диалог'
            ]}
        >
            <StatusesDemo />
        </Sandbox>

        <hr className="!my-10" />
    </>
);
