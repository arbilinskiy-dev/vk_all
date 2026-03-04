// Раздел 1: Введение и первые шаги
import type { TocItem } from './tocData_types';

export const tocSection1: TocItem = {
    title: 'Раздел 1: Введение в приложение',
    path: '1-intro',
    children: [
        { 
            title: '1.1. Что такое "Планировщик контента"?', 
            path: '1-1-what-is',
            children: [
                { title: 'Общая информация', path: '1-1-1-overview' },
                { title: 'Какие задачи решает приложение', path: '1-1-2-tasks' },
                { title: 'Сценарии использования', path: '1-1-3-use-cases' },
            ]
        },
        { 
            title: '1.2. Знакомство с интерфейсом', 
            path: '1-2-interface-overview',
            children: [
                { title: 'Главная навигационная панель', path: '1-2-1-primary-sidebar-intro' },
                { title: 'Сайдбар проектов', path: '1-2-2-projects-sidebar-intro' },
                { title: 'Рабочая область', path: '1-2-3-workspace-intro' },
            ]
        },
        { title: '1.3. Экран приветствия', path: '1-4-welcome-screen' },
        { title: '1.4. Ваш первый шаг: Проекты', path: '1-5-projects-first-step' },
    ]
};
