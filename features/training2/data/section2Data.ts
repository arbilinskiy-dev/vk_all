// Раздел 2: Модуль "Контент-менеджмент"

import type { TocItem } from './types';

export const section2: TocItem = {
    title: 'Раздел 2: Модуль "Контент-менеджмент"',
    path: '2-content-management',
    children: [
        // ─────────────────────────────────────────────────────────────────────
        // 2.1. Вкладка "Отложенные" (Календарь)
        // ─────────────────────────────────────────────────────────────────────
        {
            title: '2.1. Вкладка "Отложенные" (Календарь)',
            path: '2-1-schedule',
            children: [
                {
                    title: '2.1.1. Сайдбар проектов',
                    path: '2-1-1-sidebar-nav',
                    children: [
                        { title: 'Элементы списка проектов', path: '2-1-1-1-project-list-items' },
                        { title: 'Индикаторы состояния', path: '2-1-1-2-status-indicators' },
                        { title: 'Счётчики постов', path: '2-1-1-3-post-counters' },
                        { title: 'Фильтры и поиск', path: '2-1-1-4-filters-search' },
                    ]
                },
                {
                    title: '2.1.2. Шапка календаря',
                    path: '2-1-2-calendar-header',
                    children: [
                        { title: 'Навигация по датам', path: '2-1-2-1-date-navigation' },
                        { title: 'Режимы отображения (Неделя/Сегодня)', path: '2-1-2-2-view-modes' },
                        { title: 'Управление видимостью заметок и тегов', path: '2-1-2-3-visibility-controls' },
                        { title: 'Кнопка "Обновить"', path: '2-1-2-4-refresh-button' },
                        { title: 'Массовые действия', path: '2-1-2-5-bulk-actions' },
                        { title: 'Создание заметки (✏️)', path: '2-1-2-6-create-note-button' },
                    ]
                },
                {
                    title: '2.1.3. Сетка календаря',
                    path: '2-1-3-calendar-grid',
                    children: [
                        { title: 'Дневные колонки', path: '2-1-3-1-day-columns' },
                        { title: 'Взаимодействие с сеткой', path: '2-1-3-2-grid-interaction' },
                        { title: 'Drag-and-Drop', path: '2-1-3-3-drag-and-drop' },
                        { title: 'Быстрое создание заметки', path: '2-1-3-4-quick-note' },
                    ]
                },
                {
                    title: '2.1.4. Посты в календаре',
                    path: '2-1-4-posts-in-calendar',
                    children: [
                        { title: 'Три типа постов: В чём разница?', path: '2-1-4-1-post-types' },
                        { title: 'Опубликованный пост', path: '2-1-4-2-published-post' },
                        { title: 'Отложенный пост VK', path: '2-1-4-3-deferred-post' },
                        { title: 'Системный пост', path: '2-1-4-4-system-post' },
                        { title: 'Жизненный цикл системного поста', path: '2-1-4-5-system-post-lifecycle' },
                        { title: 'Карточка поста: Детальный обзор', path: '2-1-4-6-postcard-deep-dive' },
                    ]
                },
                {
                    title: '2.1.5. Заметки',
                    path: '2-1-5-notes',
                    children: [
                        { title: 'Создание заметки', path: '2-1-5-1-create-note' },
                        { title: 'Редактирование заметки', path: '2-1-5-2-edit-note' },
                        { title: 'Цветовая палитра', path: '2-1-5-3-color-palette' },
                        { title: 'Просмотр и действия', path: '2-1-5-4-view-actions' },
                    ]
                },
                {
                    title: '2.1.6. Истории (Stories)',
                    path: '2-1-6-stories',
                    children: [
                        { title: 'Отображение историй в календаре', path: '2-1-6-1-stories-display' },
                        { title: 'Просмотр историй', path: '2-1-6-2-stories-viewer' },
                    ]
                },
                {
                    title: '2.1.7. Модальное окно поста',
                    path: '2-1-7-post-modal',
                    children: [
                        { title: 'Общие механики', path: '2-1-7-1-general-mechanics' },
                        { title: 'Способ публикации', path: '2-1-7-2-publication-method' },
                        { title: 'Массовое создание (несколько дат)', path: '2-1-7-3-bulk-dates' },
                        { title: 'Мультипроектная публикация', path: '2-1-7-4-multi-project' },
                        { title: 'Работа с текстом', path: '2-1-7-5-text-editing' },
                        { title: 'AI-помощник в посте', path: '2-1-7-6-ai-assistant' },
                        { title: 'Переменные в тексте', path: '2-1-7-7-variables' },
                        { title: 'Emoji Picker', path: '2-1-7-8-emoji-picker' },
                        { title: 'Работа с медиа', path: '2-1-7-9-media-editing' },
                        { title: 'Галерея изображений VK', path: '2-1-7-10-image-gallery' },
                        { title: 'Создание альбомов', path: '2-1-7-11-create-album' },
                        { title: 'Футер и кнопка сохранения', path: '2-1-7-12-modal-footer' },
                    ]
                },
                {
                    title: '2.1.8. Операции с постами',
                    path: '2-1-8-post-operations',
                    children: [
                        { title: 'Создание поста', path: '2-1-8-1-create' },
                        { title: 'Редактирование', path: '2-1-8-2-edit' },
                        { title: 'Копирование', path: '2-1-8-3-copy' },
                        { title: 'Удаление', path: '2-1-8-4-delete' },
                        { title: 'Перемещение (Drag-and-Drop)', path: '2-1-8-5-move' },
                        { title: 'Массовый выбор и удаление', path: '2-1-8-6-bulk-selection' },
                        { title: 'Публикация сейчас', path: '2-1-8-7-publish-now' },
                    ]
                },
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 2.2. Вкладка "Предложенные"
        // ─────────────────────────────────────────────────────────────────────
        {
            title: '2.2. Вкладка "Предложенные"',
            path: '2-2-suggested',
            children: [
                { title: '2.2.1. Обзор интерфейса', path: '2-2-1-overview' },
                { title: '2.2.2. Лента изображений', path: '2-2-2-image-ribbon' },
                { title: '2.2.3. Карточка предложенного поста', path: '2-2-3-suggested-post-card' },
                { title: '2.2.4. AI-редактор предложки', path: '2-2-4-ai-editor' },
                { title: '2.2.5. Принятие и отклонение', path: '2-2-5-accept-reject' },
                { title: '2.2.6. Планирование предложенного поста', path: '2-2-6-schedule-suggested' },
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 2.3. Вкладка "Товары"
        // ─────────────────────────────────────────────────────────────────────
        {
            title: '2.3. Вкладка "Товары"',
            path: '2-3-products',
            children: [
                { title: '2.3.1. Обзор интерфейса', path: '2-3-1-overview' },
                {
                    title: '2.3.2. Таблица товаров',
                    path: '2-3-2-products-table',
                    children: [
                        { title: 'Колонки таблицы', path: '2-3-2-1-columns' },
                        { title: 'Управление видимостью колонок', path: '2-3-2-2-column-visibility' },
                        { title: 'Сортировка и поиск', path: '2-3-2-3-sort-search' },
                    ]
                },
                { title: '2.3.3. Фильтры по альбомам', path: '2-3-3-album-filters' },
                { title: '2.3.4. Фильтры по категориям', path: '2-3-4-category-filters' },
                {
                    title: '2.3.5. Создание товаров',
                    path: '2-3-5-create-products',
                    children: [
                        { title: 'Создание одного товара', path: '2-3-5-1-create-single' },
                        { title: 'Создание нескольких товаров', path: '2-3-5-2-create-multiple' },
                        { title: 'Вставка из буфера обмена', path: '2-3-5-3-paste-clipboard' },
                    ]
                },
                {
                    title: '2.3.6. Импорт и экспорт',
                    path: '2-3-6-import-export',
                    children: [
                        { title: 'Импорт из файла (CSV/XLSX)', path: '2-3-6-1-import-file' },
                        { title: 'Маппинг колонок при импорте', path: '2-3-6-2-column-mapping' },
                        { title: 'Обновление товаров из файла', path: '2-3-6-3-update-from-file' },
                        { title: 'Экспорт в CSV', path: '2-3-6-4-export-csv' },
                        { title: 'Экспорт в XLSX', path: '2-3-6-5-export-xlsx' },
                    ]
                },
                {
                    title: '2.3.7. Массовое редактирование',
                    path: '2-3-7-bulk-edit',
                    children: [
                        { title: 'Массовое редактирование цен', path: '2-3-7-1-bulk-price' },
                        { title: 'Массовое редактирование старых цен', path: '2-3-7-2-bulk-old-price' },
                        { title: 'Массовое редактирование названий', path: '2-3-7-3-bulk-title' },
                        { title: 'Массовое редактирование описаний', path: '2-3-7-4-bulk-description' },
                        { title: 'Массовое редактирование альбомов', path: '2-3-7-5-bulk-album' },
                        { title: 'Массовое редактирование категорий', path: '2-3-7-6-bulk-category' },
                    ]
                },
                { title: '2.3.8. AI-предложения категорий', path: '2-3-8-ai-category' },
                { title: '2.3.9. Редактор описаний', path: '2-3-9-description-editor' },
                { title: '2.3.10. Просмотр изменений (DiffViewer)', path: '2-3-10-diff-viewer' },
                { title: '2.3.11. Результаты сохранения', path: '2-3-11-save-results' },
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 2.4. Раздел "Автоматизации"
        // ─────────────────────────────────────────────────────────────────────
        {
            title: '2.4. Автоматизации',
            path: '2-4-automations',
            children: [
                {
                    title: '2.4.1. Посты в истории',
                    path: '2-4-1-stories-automation',
                    children: [
                        { title: 'Обзор функционала', path: '2-4-1-1-overview' },
                        { title: 'Настройки автоматизации', path: '2-4-1-2-settings' },
                        { title: 'Статистика', path: '2-4-1-3-stats' },
                        { title: 'Дашборд', path: '2-4-1-4-dashboard' },
                    ]
                },
                {
                    title: '2.4.2. Конкурс отзывов',
                    path: '2-4-2-reviews-contest',
                    children: [
                        { title: 'Обзор функционала', path: '2-4-2-1-overview' },
                        { title: 'Настройки конкурса', path: '2-4-2-2-settings' },
                        { title: 'Участники', path: '2-4-2-3-participants' },
                        { title: 'Победители', path: '2-4-2-4-winners' },
                        { title: 'Промокоды', path: '2-4-2-5-promocodes' },
                        { title: 'Список рассылки', path: '2-4-2-6-sending-list' },
                        { title: 'Чёрный список', path: '2-4-2-7-blacklist' },
                        { title: 'Посты конкурса', path: '2-4-2-8-posts' },
                        { title: 'Логи', path: '2-4-2-9-logs' },
                    ]
                },
                {
                    title: '2.4.3. Дроп промокодов',
                    path: '2-4-3-promo-drop',
                    children: [
                        { title: 'Обзор функционала', path: '2-4-3-1-overview' },
                        { title: 'Настройка дропа', path: '2-4-3-2-settings' },
                    ]
                },
                {
                    title: '2.4.4. Универсальные конкурсы',
                    path: '2-4-4-general-contests',
                    children: [
                        { title: 'Обзор функционала', path: '2-4-4-1-overview' },
                        { title: 'Список конкурсов', path: '2-4-4-2-contests-list' },
                        { title: 'Создание конкурса', path: '2-4-4-3-create' },
                        { title: 'Редактор конкурса', path: '2-4-4-4-editor' },
                        { title: 'Условия участия', path: '2-4-4-5-conditions' },
                        { title: 'Настройки', path: '2-4-4-6-settings' },
                        { title: 'Участники', path: '2-4-4-7-participants' },
                        { title: 'Победители', path: '2-4-4-8-winners' },
                        { title: 'Промокоды', path: '2-4-4-9-promocodes' },
                        { title: 'Список рассылки', path: '2-4-4-10-sending-list' },
                        { title: 'Чёрный список', path: '2-4-4-11-blacklist' },
                        { title: 'Превью конкурса', path: '2-4-4-12-preview' },
                    ]
                },
                {
                    title: '2.4.5. AI посты',
                    path: '2-4-5-ai-posts',
                    children: [
                        { title: 'Обзор функционала', path: '2-4-5-1-overview' },
                        { title: 'Список AI постов', path: '2-4-5-2-list' },
                        { title: 'Создание AI поста', path: '2-4-5-3-create' },
                        { title: 'Редактор AI поста', path: '2-4-5-4-editor' },
                    ]
                },
                {
                    title: '2.4.6. Поздравления с ДР',
                    path: '2-4-6-birthday',
                    children: [
                        { title: 'Обзор функционала', path: '2-4-6-1-overview' },
                        { title: 'Настройка поздравлений', path: '2-4-6-2-settings' },
                    ]
                },
                {
                    title: '2.4.7. Конкурс "Актив"',
                    path: '2-4-7-activity-contest',
                    children: [
                        { title: 'Обзор функционала', path: '2-4-7-1-overview' },
                        { title: 'Настройка конкурса', path: '2-4-7-2-settings' },
                    ]
                },
            ]
        },
    ]
};
