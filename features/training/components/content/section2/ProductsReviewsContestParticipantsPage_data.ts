// =====================================================================
// Mock данные участников конкурса отзывов (из реального ParticipantsTab.tsx)
// =====================================================================

export const MOCK_PARTICIPANTS = [
    {
        id: 1,
        photo: 'https://i.pravatar.cc/150?img=1',
        author: 'Иван Иванов',
        text: 'Отличные роллы, спасибо! #отзыв',
        status: 'commented' as const,
        date: '10.08.2023 14:30'
    },
    {
        id: 2,
        photo: 'https://i.pravatar.cc/150?img=2',
        author: 'Мария Петрова',
        text: 'Все вкусно, но доставка долгая. #отзыв',
        status: 'commented' as const,
        date: '10.08.2023 15:00'
    },
    {
        id: 3,
        photo: 'https://i.pravatar.cc/150?img=3',
        author: 'Алексей Сидоров',
        text: 'Пицца супер! #отзыв',
        status: 'processing' as const,
        date: '10.08.2023 15:45'
    },
    {
        id: 4,
        photo: 'https://i.pravatar.cc/150?img=4',
        author: 'Елена Смирнова',
        text: 'Не положили салфетки :( #отзыв',
        status: 'error' as const,
        date: '10.08.2023 16:20'
    },
    {
        id: 5,
        photo: 'https://i.pravatar.cc/150?img=5',
        author: 'Дмитрий Козлов',
        text: 'Быстро и вкусно! #отзыв',
        status: 'winner' as const,
        date: '10.08.2023 17:00'
    },
    {
        id: 6,
        photo: 'https://i.pravatar.cc/150?img=6',
        author: 'Анна Волкова',
        text: 'Первый раз заказываю, всё понравилось #отзыв',
        status: 'new' as const,
        date: '10.08.2023 17:30'
    }
];
