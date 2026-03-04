// Разделы 7–10: Авторизация, Модальные окна, Доп.модули, FAQ
import type { TocItem } from './tocData_types';

/** Раздел 7: Авторизация и безопасность */
export const tocSection7: TocItem = {
    title: 'Раздел 7: Авторизация и безопасность',
    path: '7-auth',
    children: [
        { title: '7.1. Страница входа', path: '7-1-login' },
        { title: '7.2. Роли пользователей', path: '7-2-roles' },
        { title: '7.3. VK Auth Integration', path: '7-3-vk-auth' },
        { title: '7.4. Выход из системы', path: '7-4-logout' },
    ]
};

/** Раздел 8: Модальные окна и диалоги */
export const tocSection8: TocItem = {
    title: 'Раздел 8: Модальные окна и диалоги',
    path: '8-modals',
    children: [
        {
            title: '8.1. Окна для постов',
            path: '8-1-post-modals',
            children: [
                { title: '8.1.1. Подтверждение публикации', path: '8-1-1-publish-confirm' },
                { title: '8.1.2. Успешная публикация', path: '8-1-2-publish-success' },
                { title: '8.1.3. Подтверждение удаления', path: '8-1-3-delete-confirm' },
                { title: '8.1.4. Подтверждение загрузки', path: '8-1-4-upload-confirm' },
                { title: '8.1.5. Подтверждение перемещения', path: '8-1-5-move-confirm' },
                { title: '8.1.6. Массовое удаление', path: '8-1-6-bulk-delete' },
            ]
        },
        {
            title: '8.2. Окна для заметок',
            path: '8-2-note-modals',
            children: [
                { title: '8.2.1. Создание/редактирование заметки', path: '8-2-1-note-edit' },
                { title: '8.2.2. Просмотр заметки', path: '8-2-2-note-preview' },
            ]
        },
        {
            title: '8.3. Превью-окна',
            path: '8-3-preview-modals',
            children: [
                { title: '8.3.1. Превью AI-ленты', path: '8-3-1-ai-feed-preview' },
                { title: '8.3.2. Превью победителей конкурса', path: '8-3-2-winner-preview' },
                { title: '8.3.3. Превью универсального конкурса', path: '8-3-3-general-contest-preview' },
            ]
        },
    ]
};

/** Раздел 9: Дополнительные модули */
export const tocSection9: TocItem = {
    title: 'Раздел 9: Дополнительные модули',
    path: '9-additional-modules',
    children: [
        {
            title: '9.1. Работа с сообщениями',
            path: '9-1-messages',
            children: [
                { title: '9.1.1. Обзор модуля сообщений', path: '9-1-1-overview' },
                {
                    title: '9.1.2. Первоначальная настройка',
                    path: '9-1-2-onboarding',
                    children: [
                        { title: 'Добавление токена сообщества', path: '9-1-2-1-token' },
                        { title: 'Настройка Callback API', path: '9-1-2-2-callback' },
                        { title: 'Запуск сбора подписчиков рассылки', path: '9-1-2-3-collection' },
                    ]
                },
                {
                    title: '9.1.3. Список диалогов',
                    path: '9-1-3-conversations',
                    children: [
                        { title: 'Навигация по сайдбару', path: '9-1-3-1-sidebar' },
                        { title: 'Управление непрочитанными', path: '9-1-3-2-unread' },
                        { title: 'Важные диалоги', path: '9-1-3-3-important' },
                        { title: 'Индикаторы реального времени', path: '9-1-3-4-realtime' },
                    ]
                },
                {
                    title: '9.1.4. Чат-интерфейс',
                    path: '9-1-4-chat',
                    children: [
                        { title: 'Шапка чата', path: '9-1-4-1-header' },
                        { title: 'Лента сообщений', path: '9-1-4-2-messages' },
                        { title: 'Поиск и фильтры в чате', path: '9-1-4-3-search' },
                        { title: 'Поле ввода сообщений', path: '9-1-4-4-input' },
                        { title: 'Прикрепление вложений', path: '9-1-4-5-attachments-send' },
                        { title: 'Переменные в сообщениях', path: '9-1-4-6-variables' },
                        { title: 'Кнопки бота (клавиатура VK)', path: '9-1-4-7-keyboard' },
                    ]
                },
                {
                    title: '9.1.5. Панель информации о пользователе',
                    path: '9-1-5-user-info',
                    children: [
                        { title: 'Вкладка «Профиль»', path: '9-1-5-1-profile' },
                        { title: 'Статистика переписки', path: '9-1-5-2-stats' },
                        { title: 'Вкладка «Посты»', path: '9-1-5-3-posts' },
                        { title: 'Вкладка «Вложения»', path: '9-1-5-4-attachments-browse' },
                    ]
                },
                {
                    title: '9.1.6. Шаблоны ответов',
                    path: '9-1-6-templates',
                    children: [
                        { title: 'Список шаблонов', path: '9-1-6-1-list' },
                        { title: 'Создание и редактирование', path: '9-1-6-2-create-edit' },
                        { title: 'Применение шаблона', path: '9-1-6-3-apply' },
                    ]
                },
                {
                    title: '9.1.7. Промокоды',
                    path: '9-1-7-promocodes',
                    children: [
                        { title: 'Управление списками промокодов', path: '9-1-7-1-lists' },
                        { title: 'Работа с промокодами', path: '9-1-7-2-codes' },
                        { title: 'Автовыдача и использование', path: '9-1-7-3-usage' },
                    ]
                },
                {
                    title: '9.1.8. Статистика сообщений',
                    path: '9-1-8-stats',
                    children: [
                        { title: 'Вкладка «Входящие»', path: '9-1-8-1-incoming' },
                        { title: 'Вкладка «Исходящие»', path: '9-1-8-2-outgoing' },
                        { title: 'Вкладка «Подписки»', path: '9-1-8-3-subscriptions' },
                        { title: 'Фильтры периода', path: '9-1-8-4-period' },
                        { title: 'Быстрый просмотр переписки', path: '9-1-8-5-chat-preview' },
                    ]
                },
            ]
        },
        { title: '9.2. Статистика (планируется)', path: '9-2-statistics' },
    ]
};

/** Раздел 10: FAQ и решение проблем */
export const tocSection10: TocItem = {
    title: 'Раздел 10: FAQ и решение проблем',
    path: '10-faq',
    children: [
        { title: '10.1. Частые вопросы по постам', path: '10-1-posts-faq' },
        { title: '10.2. Частые вопросы по доступу', path: '10-2-access-faq' },
        { title: '10.3. Частые вопросы по автоматизациям', path: '10-3-automations-faq' },
        { title: '10.4. Частые вопросы по товарам', path: '10-4-products-faq' },
        { title: '10.5. Решение типичных проблем', path: '10-5-troubleshooting' },
        { title: '10.6. Частые вопросы по сообщениям', path: '10-6-messages-faq' },
    ]
};
