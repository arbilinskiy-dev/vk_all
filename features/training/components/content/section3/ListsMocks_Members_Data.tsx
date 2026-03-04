// =====================================================================
// Моковые данные участников для демонстрации (раздел 3.2.3)
// =====================================================================
import type { MockMember } from './ListsMocks_Members_Types';

// Реальные моковые данные участников
export const mockMembers: MockMember[] = [
    {
        id: '1',
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
        id: '2',
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
        id: '3',
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
    },
    {
        id: '4',
        photo_url: 'https://picsum.photos/seed/user4/100/100',
        first_name: 'Игорь',
        last_name: 'Соколов',
        vk_user_id: 111222333,
        has_mobile: false,
        sex: 2,
        bdate: '10.12.2000',
        city: 'Новосибирск',
        last_seen: Math.floor(Date.now() / 1000) - 604800,
        platform: 7,
        added_at: new Date(Date.now() - 259200000).toISOString(),
        source: 'manual',
        deactivated: 'banned'
    },
    {
        id: '5',
        photo_url: undefined,
        first_name: 'Мария',
        last_name: 'Иванова',
        vk_user_id: 444555666,
        has_mobile: true,
        sex: 1,
        bdate: '5.7.1992',
        city: 'Казань',
        platform: 4,
        added_at: new Date(Date.now() - 345600000).toISOString(),
        source: 'callback',
        deactivated: 'deleted'
    }
];
