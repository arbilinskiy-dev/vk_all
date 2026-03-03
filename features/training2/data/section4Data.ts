// Раздел 4: Управление проектами

import type { TocItem } from './types';

export const section4: TocItem = {
    title: 'Раздел 4: Управление проектами',
    path: '4-projects',
    children: [
        {
            title: '4.1. База проектов',
            path: '4-1-database',
            children: [
                { title: '4.1.1. Интерфейс управления', path: '4-1-1-interface' },
                { title: '4.1.2. Добавление проектов', path: '4-1-2-add-projects' },
                {
                    title: '4.1.3. Таблица проектов',
                    path: '4-1-3-projects-table',
                    children: [
                        { title: 'Колонки таблицы', path: '4-1-3-1-columns' },
                        { title: 'Управление видимостью колонок', path: '4-1-3-2-column-visibility' },
                        { title: 'Редактирование ячеек', path: '4-1-3-3-cell-editing' },
                    ]
                },
                { title: '4.1.4. Фильтрация и поиск', path: '4-1-4-filters' },
                {
                    title: '4.1.5. Массовые операции',
                    path: '4-1-5-bulk-operations',
                    children: [
                        { title: 'Очистка колонки', path: '4-1-5-1-clear-column' },
                        { title: 'Очистка строки', path: '4-1-5-2-clear-row' },
                    ]
                },
            ]
        },
        {
            title: '4.2. Настройки проекта',
            path: '4-2-project-settings',
            children: [
                { title: '4.2.1. Название проекта', path: '4-2-1-name' },
                { title: '4.2.2. Информация о проекте', path: '4-2-2-info' },
                { title: '4.2.3. Статус (активен/неактивен)', path: '4-2-3-status' },
                { title: '4.2.4. Команда проекта', path: '4-2-4-team' },
                { title: '4.2.5. Заметки проекта', path: '4-2-5-notes' },
                {
                    title: '4.2.6. Интеграции',
                    path: '4-2-6-integrations',
                    children: [
                        { title: 'Токен сообщества', path: '4-2-6-1-community-token' },
                        { title: 'Дополнительные токены', path: '4-2-6-2-additional-tokens' },
                        { title: 'Код Callback API', path: '4-2-6-3-callback-code' },
                    ]
                },
                {
                    title: '4.2.7. Переменные проекта (локальные)',
                    path: '4-2-7-local-variables',
                    children: [
                        { title: 'Создание переменных', path: '4-2-7-1-create' },
                        { title: 'AI-автозаполнение', path: '4-2-7-2-ai-autofill' },
                    ]
                },
                {
                    title: '4.2.8. Глобальные переменные',
                    path: '4-2-8-global-variables',
                    children: [
                        { title: 'Создание типов переменных', path: '4-2-8-1-create-types' },
                        { title: 'Заполнение значений', path: '4-2-8-2-fill-values' },
                    ]
                },
                { title: '4.2.9. Теги проекта', path: '4-2-9-tags' },
                { title: '4.2.10. AI-шаблоны инструкций', path: '4-2-10-ai-presets' },
            ]
        },
        {
            title: '4.3. Контекст проекта',
            path: '4-3-project-context',
            children: [
                { title: '4.3.1. Управление полями контекста', path: '4-3-1-context-fields' },
                { title: '4.3.2. Создание поля контекста', path: '4-3-2-create-field' },
                { title: '4.3.3. Удаление поля контекста', path: '4-3-3-delete-field' },
                { title: '4.3.4. AI-автозаполнение контекста', path: '4-3-4-ai-context-autofill' },
                { title: '4.3.5. Массовое AI-автозаполнение', path: '4-3-5-mass-ai-autofill' },
            ]
        },
        {
            title: '4.4. Глобальные переменные (управление)',
            path: '4-4-global-variables-management',
            children: [
                { title: '4.4.1. Интерфейс управления', path: '4-4-1-interface' },
                { title: '4.4.2. Создание глобальной переменной', path: '4-4-2-create' },
                { title: '4.4.3. Редактирование и удаление', path: '4-4-3-edit-delete' },
            ]
        },
        {
            title: '4.5. Администрируемые группы VK',
            path: '4-5-administered-groups',
            children: [
                { title: '4.5.1. Таблица групп', path: '4-5-1-groups-table' },
                { title: '4.5.2. Таблица владельцев', path: '4-5-2-owners-table' },
                { title: '4.5.3. Таблица администраторов', path: '4-5-3-admins-table' },
            ]
        },
        {
            title: '4.6. Архив проектов',
            path: '4-6-archive',
            children: [
                { title: '4.6.1. Архивация проекта', path: '4-6-1-archive' },
                { title: '4.6.2. Восстановление из архива', path: '4-6-2-restore' },
                { title: '4.6.3. Удаление проекта', path: '4-6-3-delete' },
            ]
        },
    ]
};
