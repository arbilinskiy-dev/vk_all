// Раздел 3: Модуль "Списки"
import type { TocItem } from './tocData_types';

export const tocSection3: TocItem = {
    title: 'Раздел 3: Модуль "Списки"',
    path: '3-lists',
    children: [
        {
            title: '3.1. Общий обзор',
            path: '3-1-lists-overview',
            children: [
                { title: '3.1.1. Интерфейс модуля', path: '3-1-1-interface' },
                { title: '3.1.2. Навигация по спискам', path: '3-1-2-navigation' },
                { title: '3.1.3. Фильтры', path: '3-1-3-filters' },
            ]
        },
        {
            title: '3.2. Системные списки',
            path: '3-2-system-lists',
            children: [
                { title: '3.2.1. Типы системных списков', path: '3-2-1-types' },
                { title: '3.2.2. Карточка списка', path: '3-2-2-list-card' },
                { title: '3.2.3. Просмотр участников', path: '3-2-3-members' },
                { title: '3.2.4. Просмотр постов', path: '3-2-4-posts' },
                { title: '3.2.5. Просмотр взаимодействий', path: '3-2-5-interactions' },
                { title: '3.2.6. Синхронизация взаимодействий', path: '3-2-6-sync' },
            ]
        },
        {
            title: '3.3. Статистика списков',
            path: '3-3-statistics',
            children: [
                { title: '3.3.1. Статистика пользователей', path: '3-3-1-user-stats' },
                { title: '3.3.2. Статистика постов', path: '3-3-2-posts-stats' },
                { title: '3.3.3. Графики и диаграммы', path: '3-3-3-charts' },
            ]
        },
        {
            title: '3.4. Пользовательские списки',
            path: '3-4-user-lists',
            children: [
                { title: '3.4.1. Создание списка', path: '3-4-1-create' },
                { title: '3.4.2. Управление списком', path: '3-4-2-manage' },
            ]
        },
        {
            title: '3.5. Списки автоматизаций',
            path: '3-5-automation-lists',
            children: [
                { title: '3.5.1. Связь со списками конкурсов', path: '3-5-1-contest-lists' },
            ]
        },
    ]
};
