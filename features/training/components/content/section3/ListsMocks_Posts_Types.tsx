// =====================================================================
// ТИПЫ И МОКОВЫЕ ДАННЫЕ ДЛЯ КОМПОНЕНТОВ ПОСТОВ
// Выделено из ListsMocks_Posts.tsx
// =====================================================================

// Интерфейс пропсов для базовой строки поста (раздел 3.2.1)
export interface MockPostRowProps {
    post: {
        vk_id: number;
        image_url?: string;
        text: string;
        likes_count: number;
        comments_count: number;
        reposts_count: number;
        views_count: number;
        user_likes: number;
        date: number;
        last_updated: string;
        vk_link: string;
    };
}

// Типы данных поста (из реального кода SystemListPost)
export interface MockPost {
    id: string;
    vk_id: number;
    date: number;                    // Unix timestamp публикации
    text: string;
    image_url?: string;              // Превью изображения
    likes_count: number;
    comments_count: number;
    reposts_count: number;
    views_count: number;
    user_likes: number;              // 1 если текущий пользователь лайкнул
    last_updated: string;            // ISO дата последнего обновления данных
    vk_link: string;                 // Прямая ссылка на пост в VK
}

// Реальные моковые данные постов
export const mockPosts: MockPost[] = [
    {
        id: '1',
        vk_id: 12345,
        image_url: 'https://picsum.photos/seed/post1/400/400',
        text: 'Друзья! Рады сообщить вам об открытии нового филиала нашей компании. Приглашаем всех на открытие!',
        likes_count: 245,
        comments_count: 18,
        reposts_count: 12,
        views_count: 3420,
        user_likes: 1,
        date: 1708828800,
        last_updated: '2024-02-15T14:23:00.000Z',
        vk_link: 'https://vk.com/wall-123456_12345'
    },
    {
        id: '2',
        vk_id: 12346,
        text: 'Скидки до 50% на все товары! Торопитесь, предложение ограничено!',
        likes_count: 89,
        comments_count: 5,
        reposts_count: 3,
        views_count: 1240,
        user_likes: 0,
        date: 1708742400,
        last_updated: '2024-02-14T10:15:00.000Z',
        vk_link: 'https://vk.com/wall-123456_12346'
    },
    {
        id: '3',
        vk_id: 12347,
        image_url: 'https://picsum.photos/seed/post3/400/400',
        text: 'Новая коллекция уже в продаже! Заходите на наш сайт и выбирайте то, что вам по душе.',
        likes_count: 156,
        comments_count: 12,
        reposts_count: 8,
        views_count: 2180,
        user_likes: 1,
        date: 1708656000,
        last_updated: '2024-02-13T18:45:00.000Z',
        vk_link: 'https://vk.com/wall-123456_12347'
    },
    {
        id: '4',
        vk_id: 12348,
        image_url: 'https://picsum.photos/seed/post4/400/400',
        text: 'Конкурс репостов! Выиграйте сертификат на 5000 рублей. Условия в комментариях.',
        likes_count: 512,
        comments_count: 143,
        reposts_count: 89,
        views_count: 8340,
        user_likes: 0,
        date: 1708569600,
        last_updated: '2024-02-12T22:30:00.000Z',
        vk_link: 'https://vk.com/wall-123456_12348'
    },
    {
        id: '5',
        vk_id: 12349,
        text: 'Поздравляем всех с наступающими праздниками! Желаем вам счастья, здоровья и успехов!',
        likes_count: 78,
        comments_count: 4,
        reposts_count: 2,
        views_count: 950,
        user_likes: 0,
        date: 1708483200,
        last_updated: '2024-02-11T15:20:00.000Z',
        vk_link: 'https://vk.com/wall-123456_12349'
    }
];
