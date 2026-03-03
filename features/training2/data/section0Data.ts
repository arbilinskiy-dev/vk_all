// Раздел 0: О Центре обучения

import type { TocItem } from './types';

export const section0: TocItem = {
    title: 'Раздел 0: О Центре обучения',
    path: '0-about-training-center',
    children: [
        { 
            title: '0.1. Что такое Центр обучения?', 
            path: '0-1-what-is-training-center',
            children: [
                { title: 'Назначение и цели', path: '0-1-1-purpose' },
                { title: 'Для кого этот раздел', path: '0-1-2-target-audience' },
                { title: 'Как устроена документация', path: '0-1-3-documentation-structure' },
            ]
        },
        { 
            title: '0.2. Как работать с Центром обучения', 
            path: '0-2-how-to-use',
            children: [
                { title: 'Навигация по оглавлению', path: '0-2-1-navigation' },
                { title: 'Интерактивные песочницы', path: '0-2-2-sandboxes' },
                { title: 'Примеры из реального интерфейса', path: '0-2-3-real-examples' },
            ]
        },
        { 
            title: '0.3. Что вы узнаете', 
            path: '0-3-what-you-will-learn',
            children: [
                { title: 'Управление контентом', path: '0-3-1-content-management' },
                { title: 'Работа с товарами', path: '0-3-2-products' },
                { title: 'Автоматизации и конкурсы', path: '0-3-3-automations' },
                { title: 'Администрирование', path: '0-3-4-administration' },
            ]
        },
    ]
};
