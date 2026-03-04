import React from 'react';
import { StatusBadge } from '../ReviewsContestMocks';

// =====================================================================
// Секция «Статусы участников» — список всех состояний обработки отзыва
// =====================================================================

/** Описание одного статуса участника */
interface StatusItem {
    status: string;
    label: string;
    description: string;
}

/** Все возможные статусы */
const PARTICIPANT_STATUSES: StatusItem[] = [
    { status: 'new',        label: 'Новый',       description: 'Отзыв найден системой, но ещё не обработан' },
    { status: 'processing', label: 'В работе',    description: 'Система проверяет участника (черный список, дубликаты)' },
    { status: 'commented',  label: 'Принят',      description: 'Участник прошёл проверку, комментарий отправлен, может участвовать в розыгрыше' },
    { status: 'error',      label: 'Ошибка',      description: 'Произошла ошибка при обработке (например, не удалось отправить комментарий)' },
    { status: 'winner',     label: 'Победитель',  description: 'Участник выбран победителем в результате розыгрыша' },
    { status: 'used',       label: 'Использован', description: 'Запись была обработана в прошлых розыгрышах' },
];

export const ParticipantStatusesSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Статусы участников
        </h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Каждый участник конкурса проходит через определённые статусы, которые отражают этап обработки его отзыва:
        </p>

        <div className="not-prose mt-6 space-y-3">
            {PARTICIPANT_STATUSES.map((item) => (
                <div key={item.status} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <StatusBadge status={item.status} />
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                </div>
            ))}
        </div>
    </section>
);
