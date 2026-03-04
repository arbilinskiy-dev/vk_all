import React from 'react';
import { Sandbox } from '../../shared';
import { StatusBadge } from '../ReviewsContestMocks';

// =====================================================================
// Sandbox-примеры: таблица участников + история победителей
// =====================================================================

// ─── Данные для таблицы участников ──────────────────────────────────

interface ParticipantRow {
    initials: string;
    bgColor: string;
    textColor: string;
    name: string;
    review: string;
    date: string;
    status: string;
}

const PARTICIPANTS: ParticipantRow[] = [
    { initials: 'АИ', bgColor: 'bg-blue-100',   textColor: 'text-blue-700',   name: 'Анна Иванова',     review: 'Отличный товар! Очень довольна покупкой, рекомендую всем', date: '15 фев 2026', status: 'commented' },
    { initials: 'ДС', bgColor: 'bg-green-100',  textColor: 'text-green-700',  name: 'Дмитрий Смирнов',  review: 'Качество на высоте, доставка быстрая',                     date: '16 фев 2026', status: 'winner' },
    { initials: 'ЕП', bgColor: 'bg-purple-100', textColor: 'text-purple-700', name: 'Елена Петрова',     review: 'Спасибо за товар! Все как на фото',                        date: '17 фев 2026', status: 'processing' },
    { initials: 'МК', bgColor: 'bg-red-100',    textColor: 'text-red-700',    name: 'Максим Козлов',     review: 'Не понравилось качество',                                  date: '18 фев 2026', status: 'new' },
];

// ─── Данные для таблицы победителей ─────────────────────────────────

interface WinnerRow {
    date: string;
    initials: string;
    name: string;
    review: string;
    awarded: boolean;
}

const WINNERS: WinnerRow[] = [
    { date: '10 фев 2026', initials: 'ОС', name: 'Ольга Соколова',    review: 'Замечательный товар, превзошёл все ожидания!', awarded: true },
    { date: '5 фев 2026',  initials: 'ИН', name: 'Игорь Новиков',     review: 'Очень доволен покупкой, рекомендую',           awarded: false },
    { date: '1 фев 2026',  initials: 'СМ', name: 'Светлана Морозова', review: 'Отличное качество за свою цену',               awarded: true },
];

// ─── Таблица участников (Sandbox) ───────────────────────────────────

export const ParticipantsTableSandbox: React.FC = () => (
    <Sandbox
        title="🎮 Пример таблицы участников"
        description="Так выглядит список всех участников конкурса на вкладке 'Посты'. Каждый участник имеет статус, который меняется в процессе обработки."
        instructions={[
            'Обратите внимание на цветовые индикаторы статусов',
            'Статус "В работе" имеет пульсирующую анимацию',
            'Статус "Победитель" выделен жирным шрифтом'
        ]}
    >
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Текст отзыва</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {PARTICIPANTS.map((p) => (
                        <tr key={p.initials}>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full ${p.bgColor} flex items-center justify-center text-xs font-bold ${p.textColor}`}>
                                        {p.initials}
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{p.name}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{p.review}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{p.date}</td>
                            <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={p.status} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Sandbox>
);

// ─── Таблица победителей (Sandbox) ──────────────────────────────────

export const WinnersTableSandbox: React.FC = () => (
    <Sandbox
        title="🏆 Пример истории победителей"
        description="На вкладке 'Победители' хранится вся история розыгрышей. Каждая запись содержит информацию о победителе, его отзыве и статусе выдачи приза."
        instructions={[
            'Янтарная цветовая схема подчёркивает важность раздела',
            'Ссылки на отзывы и посты открываются во ВКонтакте',
            'Можно отслеживать статус выдачи призов'
        ]}
    >
        <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-amber-200">
                <thead className="bg-amber-100">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-amber-900 uppercase">Дата розыгрыша</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-amber-900 uppercase">Победитель</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-amber-900 uppercase">Текст отзыва</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-amber-900 uppercase">Статус выдачи</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-amber-100">
                    {WINNERS.map((w) => (
                        <tr key={w.initials}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{w.date}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                                        {w.initials}
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{w.name}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{w.review}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                                {w.awarded ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                        ✓ Выдан
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                        ⏳ Ожидается
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Sandbox>
);
