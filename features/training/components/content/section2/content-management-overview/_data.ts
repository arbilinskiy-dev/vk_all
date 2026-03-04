// Мок-данные и утилиты для обзора модуля «Контент-менеджмент»

/** Тип проекта в списке сайдбара */
export interface MockProject {
    id: string;
    name: string;
    team: string;
    posts: number;
    hasWarning: boolean;
}

/** Тип фильтра по командам */
export type TeamFilter = 'all' | 'В' | 'С' | 'А' | 'none';

/** Тип фильтра по количеству постов */
export type PostFilter = 'all' | 'empty' | 'not_empty' | 'lt5' | '5-10' | 'gt10';

/** Тип активной вкладки контент-менеджмента */
export type ActiveTab = 'schedule' | 'suggested' | 'products';

/** Список mock-проектов для демонстрации */
export const MOCK_PROJECTS: MockProject[] = [
    { id: 'project-1', name: 'Изготовление автоключей | ...', team: 'В', posts: 0, hasWarning: true },
    { id: 'project-2', name: 'Тестовое сообщество', team: 'С', posts: 0, hasWarning: false },
    { id: 'project-3', name: 'Фиолето Суши | Доставка ро...', team: 'В', posts: 0, hasWarning: false },
];

/** Определение CSS-классов для badge счётчика постов по количеству */
export const getPostCountColorClasses = (count: number): string => {
    if (count === 0) return 'bg-gradient-to-t from-gray-300 to-red-200 text-red-900 font-medium';
    if (count > 0 && count < 5) return 'bg-gradient-to-t from-gray-300 to-orange-200 text-orange-900 font-medium';
    if (count > 10) return 'bg-gradient-to-t from-gray-300 to-green-200 text-green-900 font-medium';
    return 'bg-gray-300 text-gray-700';
};

/** Фильтрация проектов по поисковому запросу, команде и количеству постов */
export const filterProjects = (
    projects: MockProject[],
    searchQuery: string,
    teamFilter: TeamFilter,
    postFilter: PostFilter,
): MockProject[] => {
    return projects.filter(p => {
        // Поиск по названию
        if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        // Фильтр по команде
        if (teamFilter !== 'all') {
            if (teamFilter === 'none' && p.team) return false;
            if (teamFilter !== 'none' && p.team !== teamFilter) return false;
        }

        // Фильтр по количеству постов
        if (postFilter === 'empty' && p.posts !== 0) return false;
        if (postFilter === 'not_empty' && p.posts === 0) return false;
        if (postFilter === 'lt5' && !(p.posts > 0 && p.posts < 5)) return false;
        if (postFilter === '5-10' && !(p.posts >= 5 && p.posts <= 10)) return false;
        if (postFilter === 'gt10' && p.posts <= 10) return false;

        return true;
    });
};
