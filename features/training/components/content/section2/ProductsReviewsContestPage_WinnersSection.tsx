/**
 * Секция «Победители» страницы обучения «Конкурс отзывов».
 * Содержит описание статусов доставки и mock-таблицу победителей.
 */
import React from 'react';
import { Sandbox } from '../shared';
import { WinnersTableMock } from './ReviewsContestMocks';

/** Mock-данные победителей для демонстрации таблицы */
const mockWinners = [
    { date: '18.02.2026', winner: 'Елена Козлова', prize: 'Сет роллов "Филадельфия"', promo: 'WIN_X7Z', status: 'sent' as const },
    { date: '11.02.2026', winner: 'Дмитрий Соколов', prize: 'Пицца "Маргарита"', promo: 'WIN_A3B', status: 'error' as const }
];

export const WinnersSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Вкладка "Победители"</h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            История всех розыгрышей — кто выиграл, какой приз получил и как была выполнена доставка промокода.
        </p>

        {/* Статусы доставки */}
        <div className="not-prose my-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
            <p className="text-sm font-semibold text-amber-900 mb-2">🎁 Статусы доставки:</p>
            <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Вручено (ЛС)</span>
                    — Промокод успешно отправлен в личные сообщения
                </li>
                <li className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Вручено (Коммент)</span>
                    — ЛС было закрыто, промокод опубликован в комментарии под постом победителя
                </li>
            </ul>
        </div>

        {/* Таблица победителей */}
        <Sandbox
            title="Пример таблицы победителей"
            description="История розыгрышей с информацией о призах и статусах доставки."
        >
            <WinnersTableMock data={mockWinners} />
        </Sandbox>
    </section>
);
