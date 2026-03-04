import React from 'react';
import { MockMemberRow } from './ListsMocks_Members_BasicRow';

// =====================================================================
// MOCK КОМПОНЕНТ: ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ (базовая — раздел 3.2.1)
// =====================================================================

export const MockMembersTable: React.FC = () => {
    const mockUsers = [
        {
            photo_url: 'https://picsum.photos/seed/user1/100/100',
            first_name: 'Анна',
            last_name: 'Смирнова',
            vk_user_id: 123456789,
            domain: 'annasmirn',
            has_mobile: true,
            sex: 1,
            bdate: '15.3.1995',
            city: 'Москва',
            last_seen: Math.floor(Date.now() / 1000) - 3600,
            platform: 4,
            added_at: new Date().toISOString(),
            source: 'callback'
        },
        {
            photo_url: undefined,
            first_name: 'Дмитрий',
            last_name: 'Петров',
            vk_user_id: 987654321,
            domain: 'dmitrypetrov',
            has_mobile: false,
            sex: 2,
            bdate: '22.8.1988',
            city: 'Санкт-Петербург',
            last_seen: Math.floor(Date.now() / 1000) - 86400,
            platform: 2,
            is_closed: true,
            added_at: new Date(Date.now() - 86400000).toISOString(),
            source: 'conversation'
        },
        {
            photo_url: 'https://picsum.photos/seed/user3/100/100',
            first_name: 'Елена',
            last_name: 'Кузнецова',
            vk_user_id: 555666777,
            has_mobile: true,
            sex: 1,
            city: 'Екатеринбург',
            last_seen: Math.floor(Date.now() / 1000) - 300,
            platform: 1,
            added_at: new Date(Date.now() - 172800000).toISOString(),
            source: 'posts_sync'
        }
    ];

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Аватар
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Пользователь
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Пол
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ДР
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Город
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Онлайн / Платформа
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Статус
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Дата события
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Источник
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {mockUsers.map((user) => (
                            <MockMemberRow key={user.vk_user_id} user={user} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
