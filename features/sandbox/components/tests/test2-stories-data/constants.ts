/**
 * Константы теста "Получение данных историй".
 * Описания методов VK API и маппинг типов токенов.
 */

import type { StoryMethod } from './useStoriesDataTest';

// ─── Описание методов ───────────────────────────────────

export const METHOD_INFO: Record<StoryMethod, { label: string; description: string; requiresStoryId: boolean }> = {
    'stories.get': {
        label: 'stories.get',
        description: 'Получение списка активных историй сообщества',
        requiresStoryId: false,
    },
    'stories.getStats': {
        label: 'stories.getStats',
        description: 'Статистика конкретной истории (просмотры, ответы, репосты, лайки)',
        requiresStoryId: true,
    },
    'stories.getViewers': {
        label: 'stories.getViewers',
        description: 'Список зрителей конкретной истории с реакциями',
        requiresStoryId: true,
    },
    'viewers_details': {
        label: 'Зрители (детали)',
        description: 'Цепочка: stories.getViewers → users.get — детальные данные зрителей (пол, возраст, город, страна)',
        requiresStoryId: true,
    },
};

// ─── Маппинг типов токенов ──────────────────────────────

export const TOKEN_TYPE_LABELS: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
    user: { label: 'User (админ)', color: 'text-blue-800', bg: 'bg-blue-100', emoji: '👤' },
    user_non_admin: { label: 'User (не админ)', color: 'text-cyan-800', bg: 'bg-cyan-100', emoji: '👥' },
    community: { label: 'Community Token', color: 'text-purple-800', bg: 'bg-purple-100', emoji: '🏠' },
    service: { label: 'Service Token', color: 'text-amber-800', bg: 'bg-amber-100', emoji: '🔑' },
};
