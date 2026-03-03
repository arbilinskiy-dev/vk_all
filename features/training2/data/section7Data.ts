// Раздел 7: Авторизация и безопасность

import type { TocItem } from './types';

export const section7: TocItem = {
    title: 'Раздел 7: Авторизация и безопасность',
    path: '7-auth',
    children: [
        { title: '7.1. Страница входа', path: '7-1-login' },
        { title: '7.2. Роли пользователей', path: '7-2-roles' },
        { title: '7.3. VK Auth Integration', path: '7-3-vk-auth' },
        { title: '7.4. Выход из системы', path: '7-4-logout' },
    ]
};
