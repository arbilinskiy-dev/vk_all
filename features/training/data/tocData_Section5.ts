// Раздел 5: Продвинутые инструменты
import type { TocItem } from './tocData_types';

export const tocSection5: TocItem = {
    title: 'Раздел 5: Продвинутые инструменты',
    path: '5-advanced-tools',
    children: [
        {
            title: '5.1. Система переменных',
            path: '5-1-variables',
            children: [
                { title: '5.1.1. Локальные переменные проекта', path: '5-1-1-local' },
                { title: '5.1.2. Глобальные переменные', path: '5-1-2-global' },
                { title: '5.1.3. Использование в постах', path: '5-1-3-usage' },
                { title: '5.1.4. Автозаполнение AI', path: '5-1-4-ai-autofill' },
            ]
        },
        {
            title: '5.2. Система тегов',
            path: '5-2-tags',
            children: [
                { title: '5.2.1. Создание и редактирование тегов', path: '5-2-1-create-edit' },
                { title: '5.2.2. Автоприсвоение по ключевым словам', path: '5-2-2-auto-assign' },
                { title: '5.2.3. Обновление тегов', path: '5-2-3-update' },
            ]
        },
        {
            title: '5.3. AI-помощник',
            path: '5-3-ai-assistant',
            children: [
                { title: '5.3.1. Генерация текста', path: '5-3-1-text-generation' },
                { title: '5.3.2. История чата', path: '5-3-2-chat-history' },
                { title: '5.3.3. Системный промпт', path: '5-3-3-system-prompt' },
                { title: '5.3.4. Контекст (переменные)', path: '5-3-4-context' },
                { title: '5.3.5. Шаблоны AI-инструкций', path: '5-3-5-ai-presets' },
            ]
        },
        {
            title: '5.4. Галерея изображений',
            path: '5-4-image-gallery',
            children: [
                { title: '5.4.1. Просмотр альбомов VK', path: '5-4-1-albums' },
                { title: '5.4.2. Создание альбомов', path: '5-4-2-create-album' },
                { title: '5.4.3. Загрузка изображений', path: '5-4-3-upload' },
                { title: '5.4.4. Выбор фото для поста', path: '5-4-4-select' },
            ]
        },
        {
            title: '5.5. Emoji Picker',
            path: '5-5-emoji',
            children: [
                { title: '5.5.1. Поиск эмодзи', path: '5-5-1-search' },
                { title: '5.5.2. Категории', path: '5-5-2-categories' },
                { title: '5.5.3. Вставка в текст', path: '5-5-3-insert' },
            ]
        },
    ]
};
