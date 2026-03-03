// Раздел 8: Модальные окна и диалоги

import type { TocItem } from './types';

export const section8: TocItem = {
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
