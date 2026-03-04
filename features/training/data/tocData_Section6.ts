// Раздел 6: Администрирование
import type { TocItem } from './tocData_types';

export const tocSection6: TocItem = {
    title: 'Раздел 6: Администрирование',
    path: '6-administration',
    children: [
        {
            title: '6.1. Управление пользователями системы',
            path: '6-1-users',
            children: [
                { title: '6.1.1. Создание пользователей', path: '6-1-1-create' },
                { title: '6.1.2. Редактирование пользователей', path: '6-1-2-edit' },
                { title: '6.1.3. Удаление пользователей', path: '6-1-3-delete' },
                { title: '6.1.4. Роли (admin/user)', path: '6-1-4-roles' },
            ]
        },
        {
            title: '6.2. VK-пользователи',
            path: '6-2-vk-users',
            children: [
                { title: '6.2.1. Таблица VK-пользователей', path: '6-2-1-table' },
                { title: '6.2.2. Управление доступом', path: '6-2-2-access' },
            ]
        },
        {
            title: '6.3. Системные аккаунты',
            path: '6-3-system-accounts',
            children: [
                { title: '6.3.1. Таблица аккаунтов', path: '6-3-1-table' },
                { title: '6.3.2. Панель статистики', path: '6-3-2-stats-panel' },
                { title: '6.3.3. График использования токенов', path: '6-3-3-usage-chart' },
                { title: '6.3.4. Добавление системных аккаунтов', path: '6-3-4-add-accounts' },
                { title: '6.3.5. Авторизация аккаунта', path: '6-3-5-authorize' },
            ]
        },
        {
            title: '6.4. AI-токены',
            path: '6-4-ai-tokens',
            children: [
                { title: '6.4.1. Таблица токенов', path: '6-4-1-table' },
                { title: '6.4.2. Панель статистики', path: '6-4-2-stats-panel' },
                { title: '6.4.3. Логи использования токенов', path: '6-4-3-token-logs' },
            ]
        },
        {
            title: '6.5. Активные задачи',
            path: '6-5-active-tasks',
            children: [
                { title: '6.5.1. Список задач', path: '6-5-1-list' },
                { title: '6.5.2. Детали задачи', path: '6-5-2-details' },
                { title: '6.5.3. Управление задачами', path: '6-5-3-manage' },
            ]
        },
        {
            title: '6.6. Глобальные настройки',
            path: '6-6-settings',
            children: [
                {
                    title: '6.6.1. Логи приложения',
                    path: '6-6-1-logs',
                    children: [
                        { title: 'Логи Callback API', path: '6-6-1-1-callback-logs' },
                        { title: 'VK Логи', path: '6-6-1-2-vk-logs' },
                        { title: 'AI Логи', path: '6-6-1-3-ai-logs' },
                    ]
                },
                { title: '6.6.2. Фоновые задачи', path: '6-6-2-background-tasks' },
                { title: '6.6.3. Настройки AI токенов', path: '6-6-3-ai-tokens-settings' },
                { title: '6.6.4. Системные страницы', path: '6-6-4-system-pages' },
            ]
        },
    ]
};
