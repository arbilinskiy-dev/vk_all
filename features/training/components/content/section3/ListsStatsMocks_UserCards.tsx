import React from 'react';
import { MockStatCard, MockValueWithPercent, MockProgressBar } from './ListsStatsMocks_Shared';

// =====================================================================
// Mock-карточки статистики пользователей
// =====================================================================

// 1. Качество базы
export const MockQualityCard: React.FC = () => {
    const total = 12458;
    const active = 11234;
    const banned = 542;
    const deleted = 682;

    return (
        <MockStatCard title="Качество базы">
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Всего</span>
                    <span className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Активные</span>
                        <span className="text-green-600 font-semibold">
                            <MockValueWithPercent value={active} percent={Math.round((active / total) * 100)} />
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Забанены</span>
                        <span className="text-red-600 font-semibold">
                            <MockValueWithPercent value={banned} percent={Math.round((banned / total) * 100)} />
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Удалены</span>
                        <span className="text-gray-500 font-semibold">
                            <MockValueWithPercent value={deleted} percent={Math.round((deleted / total) * 100)} />
                        </span>
                    </div>
                </div>
            </div>
        </MockStatCard>
    );
};

// 2. Доступность ЛС (для рассылки)
export const MockMailingStatusCard: React.FC = () => {
    const allowed = 8932;
    const forbidden = 3526;
    const target = 7845;
    const total = allowed + forbidden;

    return (
        <MockStatCard title="Доступность ЛС">
            <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Можно писать</span>
                    <span className="text-green-600 font-semibold">
                        <MockValueWithPercent value={allowed} percent={Math.round((allowed / total) * 100)} />
                    </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Запрещено</span>
                    <span className="text-red-600 font-semibold">
                        <MockValueWithPercent value={forbidden} percent={Math.round((forbidden / total) * 100)} />
                    </span>
                </div>
                <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                    <div className="text-xs text-green-700 mb-1">Целевая группа (Актив + ЛС)</div>
                    <div className="text-xl font-bold text-green-800">{target.toLocaleString()}</div>
                </div>
            </div>
        </MockStatCard>
    );
};

// 3. Life Time (Цикл подписки)
export const MockLifetimeCard: React.FC = () => {
    return (
        <MockStatCard title="Life Time (Цикл подписки)">
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Среднее по всем</span>
                    <span className="text-2xl font-bold text-indigo-600">142 дня</span>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">По активным</span>
                        <span className="text-green-600 font-semibold">187 дней</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">По отписавшимся</span>
                        <span className="text-red-600 font-semibold">68 дней</span>
                    </div>
                </div>
            </div>
        </MockStatCard>
    );
};

// 4. Последний контакт (для рассылки)
export const MockLastContactCard: React.FC = () => {
    const data = [
        { label: 'Сегодня', value: 1245, color: 'text-gray-700' },
        { label: '3 дня', value: 2134, color: 'text-gray-700' },
        { label: 'Неделя', value: 1567, color: 'text-gray-700' },
        { label: '>1 месяца', value: 892, color: 'text-orange-600' },
        { label: '>3 месяцев', value: 534, color: 'text-red-600' },
        { label: '>Года', value: 123, color: 'text-red-700' }
    ];

    return (
        <MockStatCard title="Последний контакт (LC)">
            <div className="space-y-2">
                {data.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{item.label}</span>
                        <span className={`font-semibold ${item.color}`}>{item.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </MockStatCard>
    );
};

// 5. Демография
export const MockDemographicsCard: React.FC = () => {
    const total = 12458;
    const male = 5234;
    const female = 6892;
    const unknown = 332;

    return (
        <MockStatCard title="Демография">
            <div className="space-y-3">
                <MockProgressBar 
                    label="Женщины" 
                    value={female} 
                    percent={Math.round((female / total) * 100)}
                    color="bg-pink-400"
                />
                <MockProgressBar 
                    label="Мужчины" 
                    value={male} 
                    percent={Math.round((male / total) * 100)}
                    color="bg-blue-400"
                />
                <MockProgressBar 
                    label="Не указан" 
                    value={unknown} 
                    percent={Math.round((unknown / total) * 100)}
                    color="bg-gray-400"
                />
            </div>
        </MockStatCard>
    );
};

// 6. Платформы
export const MockPlatformsCard: React.FC = () => {
    const data = [
        { label: 'm.vk', value: 3245, color: 'bg-orange-300' },
        { label: 'iPhone', value: 2876, color: 'bg-slate-400' },
        { label: 'Android', value: 4123, color: 'bg-emerald-400' },
        { label: 'Web', value: 1892, color: 'bg-blue-400' },
        { label: 'Неизвестно', value: 322, color: 'bg-gray-300' }
    ];

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <MockStatCard title="Платформы">
            <div className="space-y-3">
                {data.map((item, idx) => (
                    <MockProgressBar 
                        key={idx}
                        label={item.label} 
                        value={item.value} 
                        percent={Math.round((item.value / total) * 100)}
                        color={item.color}
                    />
                ))}
            </div>
        </MockStatCard>
    );
};

// 7. Последний онлайн
export const MockOnlineCard: React.FC = () => {
    const data = [
        { label: 'Сегодня', value: 2145, color: 'text-gray-700' },
        { label: '3 дня', value: 3234, color: 'text-gray-700' },
        { label: 'Неделя', value: 2567, color: 'text-gray-700' },
        { label: '>1 месяца', value: 1892, color: 'text-orange-600' },
        { label: '>3 месяцев', value: 1234, color: 'text-red-600' },
        { label: '>Года', value: 523, color: 'text-red-700' }
    ];

    return (
        <MockStatCard title="Последний онлайн">
            <div className="space-y-2">
                {data.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{item.label}</span>
                        <span className={`font-semibold ${item.color}`}>{item.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </MockStatCard>
    );
};
