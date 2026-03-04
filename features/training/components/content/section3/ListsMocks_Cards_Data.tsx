// =====================================================================
// РЕАЛЬНЫЕ ДАННЫЕ СПИСКОВ ИЗ ПРОЕКТА (mock)
// =====================================================================

import React from 'react';
import {
    UsersIcon, MessageIcon, UserPlusIcon, UserMinusIcon,
    HeartIcon, ShareIcon, StarIcon, NewspaperIcon,
    PencilIcon
} from './ListsMocks_Icons';
import type { ListCardData } from './ListsMocks_Cards_Types';

/** Возвращает массив mock-данных карточек списков */
export const getListCardData = (): ListCardData[] => [
    // Группа: Подписчики
    {
        type: 'subscribers',
        group: 'subscribers',
        title: 'Подписчики',
        count: 12458,
        lastUpdated: '15 фев, 14:23',
        icon: <UsersIcon className="w-6 h-6 text-white" />,
        bgColor: 'bg-indigo-500'
    },
    {
        type: 'mailing',
        group: 'subscribers',
        title: 'В рассылке',
        count: 8932,
        lastUpdated: '15 фев, 10:15',
        icon: <MessageIcon className="w-6 h-6 text-white" />,
        bgColor: 'bg-cyan-600'
    },
    {
        type: 'history_join',
        group: 'subscribers',
        title: 'Вступившие',
        count: 342,
        lastUpdated: '14 фев, 18:45',
        icon: <UserPlusIcon className="w-6 h-6 text-white" />,
        bgColor: 'bg-teal-500'
    },
    {
        type: 'history_leave',
        group: 'subscribers',
        title: 'Вышедшие',
        count: 127,
        lastUpdated: '14 фев, 18:45',
        icon: <UserMinusIcon className="w-6 h-6 text-white" />,
        bgColor: 'bg-orange-500'
    },
    
    // Группа: Активности
    {
        type: 'likes',
        group: 'activities',
        title: 'Лайкали',
        count: 1543,
        lastUpdated: '10 фев, 12:00',
        icon: <HeartIcon className="w-6 h-6 text-white" />,
        bgColor: 'bg-pink-500'
    },
    {
        type: 'comments',
        group: 'activities',
        title: 'Комментировали',
        count: 789,
        lastUpdated: '10 фев, 12:00',
        icon: <MessageIcon className="w-6 h-6 text-white" />,
        bgColor: 'bg-blue-500'
    },
    {
        type: 'reposts',
        group: 'activities',
        title: 'Репостили',
        count: 234,
        lastUpdated: '10 фев, 12:00',
        icon: <ShareIcon className="w-6 h-6 text-white" />,
        bgColor: 'bg-purple-500'
    },
    
    // Группа: Автоматизации
    {
        type: 'reviews_winners',
        group: 'automations',
        title: 'Конкурс отзывов: Победители',
        count: 45,
        lastUpdated: '12 фев, 16:30',
        icon: <StarIcon className="w-6 h-6 text-white" />,
        bgColor: 'bg-amber-500'
    },
    {
        type: 'reviews_participants',
        group: 'automations',
        title: 'Конкурс отзывов: Участники',
        count: 523,
        lastUpdated: '12 фев, 16:30',
        icon: <UsersIcon className="w-6 h-6 text-white" />,
        bgColor: 'bg-green-500'
    },
    {
        type: 'reviews_posts',
        group: 'automations',
        title: 'Конкурс отзывов: Посты',
        count: 112,
        lastUpdated: '12 фев, 16:30',
        icon: <NewspaperIcon className="w-6 h-6 text-white" />,
        bgColor: 'bg-indigo-400'
    },
    
    // Группа: Прочее
    {
        type: 'posts',
        group: 'other',
        title: 'История постов',
        count: 1000,
        vkCount: 5400,
        lastUpdated: '13 фев, 09:20',
        icon: <NewspaperIcon className="w-6 h-6 text-white" />,
        bgColor: 'bg-indigo-800'
    },
    {
        type: 'authors',
        group: 'other',
        title: 'Авторы постов',
        count: 68,
        lastUpdated: '13 фев, 09:20',
        icon: <PencilIcon className="w-6 h-6 text-white" />,
        bgColor: 'bg-violet-600'
    }
];
