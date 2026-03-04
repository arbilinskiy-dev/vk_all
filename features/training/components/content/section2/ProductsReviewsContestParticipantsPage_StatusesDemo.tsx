// =====================================================================
// Демонстрация всех статусов участников конкурса
// =====================================================================
import React from 'react';
import { StatusBadge } from './ReviewsContestMocks';

export const StatusesDemo: React.FC = () => {
    const statuses = [
        { status: 'new' as const, label: 'Новый', description: 'Только что найден, ещё не обработан' },
        { status: 'processing' as const, label: 'В работе', description: 'В очереди на присвоение номера' },
        { status: 'commented' as const, label: 'Принят', description: 'Получил номер, участвует в розыгрыше' },
        { status: 'error' as const, label: 'Ошибка', description: 'Не удалось прокомментировать пост' },
        { status: 'winner' as const, label: 'Победитель', description: 'Выбран победителем розыгрыша' },
        { status: 'used' as const, label: 'Использован', description: 'Уже был победителем ранее' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statuses.map((item) => (
                <div key={item.status} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-gray-500">{item.description}</p>
                </div>
            ))}
        </div>
    );
};
