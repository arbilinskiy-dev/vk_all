// =====================================================================
// ТИПЫ ДАННЫХ для карточек списков
// =====================================================================

import React from 'react';

/** Тип списка */
export type ListType = 'subscribers' | 'mailing' | 'history_join' | 'history_leave' | 
    'likes' | 'comments' | 'reposts' | 'reviews_winners' | 'reviews_participants' | 
    'reviews_posts' | 'posts' | 'authors';

/** Группа списков */
export type ListGroup = 'subscribers' | 'activities' | 'automations' | 'other';

/** Данные карточки списка */
export interface ListCardData {
    type: ListType;
    group: ListGroup;
    title: string;
    count: number;
    vkCount?: number; // Для двойного счётчика (например, "1000 из 5400")
    lastUpdated?: string;
    icon: React.ReactNode;
    bgColor: string;
}
