import React, { useState } from 'react';

// =====================================================================
// Mock-компоненты сайдбара проектов
// (на основе реального Sidebar.tsx и ProjectListItem.tsx)
// =====================================================================

/** Интерфейс мок-проекта */
export interface MockProject {
    id: string;
    name: string;
    count: number;
}

/** Мок-данные проектов для песочницы */
export const MOCK_PROJECTS: MockProject[] = [
    { id: '1', name: 'Магазин электроники TECH', count: 12 },
    { id: '2', name: 'Кафе "Уютный уголок"', count: 3 },
    { id: '3', name: 'Фитнес-клуб "Энергия"', count: 0 },
    { id: '4', name: 'Салон красоты "Стиль"', count: 8 },
    { id: '5', name: 'Автосервис "Мастер"', count: 0 },
    { id: '6', name: 'Ресторан "Вкусно"', count: 15 },
    { id: '7', name: 'Книжный магазин', count: 1 },
    { id: '8', name: 'Детский центр', count: 6 },
];

// Реальная логика цветов из ProjectListItem.tsx
const getPostCountColorClasses = (count: number, isActive: boolean): string => {
    if (isActive) {
        if (count === 0) return 'bg-red-200 text-red-800';
        if (count > 0 && count < 5) return 'bg-orange-200 text-orange-800';
        if (count > 10) return 'bg-green-200 text-green-800';
        return 'bg-indigo-200 text-indigo-800';
    }
    
    if (count === 0) return 'bg-gradient-to-t from-gray-300 to-red-200 text-red-900 font-medium';
    if (count > 0 && count < 5) return 'bg-gradient-to-t from-gray-300 to-orange-200 text-orange-900 font-medium';
    if (count > 10) return 'bg-gradient-to-t from-gray-300 to-green-200 text-green-900 font-medium';
    return 'bg-gray-300 text-gray-700';
};

/** Карточка проекта в сайдбаре с выдвижными кнопками */
const MockProjectItem: React.FC<{ 
    project: MockProject; 
    isActive: boolean;
    onClick: () => void;
}> = ({ project, isActive, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="relative overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Выдвижные кнопки слева (как в реальном компоненте) */}
            <div className={`absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-gray-200 transition-transform duration-300 ease-in-out ${isHovered ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="absolute top-1/2 left-0 -translate-y-1/2 flex items-center pl-2 space-x-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); }}
                        title="Обновить данные"
                        className="p-2 text-gray-500 rounded-full hover:bg-gray-300 hover:text-gray-800"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" /></svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); }}
                        title="Настройки"
                        className="p-2 text-gray-500 rounded-full hover:bg-gray-300 hover:text-gray-800"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                </div>
            </div>
            <button
                onClick={onClick}
                className={`w-full text-left pr-4 py-3 text-sm flex justify-between items-center transition-[padding-left] duration-300 ease-in-out ${isHovered ? 'pl-24' : 'pl-4'} ${
                    isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-gray-100'
                }`}
            >
                <div className="flex items-center min-w-0">
                    <span className="truncate pr-1">{project.name}</span>
                </div>
                <div className="flex-shrink-0 w-8 h-4 flex items-center justify-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPostCountColorClasses(project.count, isActive)}`}>
                        {project.count}
                    </span>
                </div>
            </button>
        </div>
    );
};

/** Мок-сайдбар проектов с поиском и фильтрами */
export const MockProjectsSidebar: React.FC<{ 
    projects: MockProject[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}> = ({ projects, selectedId, onSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [teamFilter, setTeamFilter] = useState<'All' | 'Команда А' | 'Команда Б' | 'NoTeam'>('All');
    const [contentFilter, setContentFilter] = useState<'all' | 'empty' | 'not_empty' | 'lt5' | '5-10' | 'gt10'>('all');

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesContent = true;
        switch (contentFilter) {
            case 'empty': matchesContent = p.count === 0; break;
            case 'not_empty': matchesContent = p.count > 0; break;
            case 'lt5': matchesContent = p.count > 0 && p.count < 5; break;
            case '5-10': matchesContent = p.count >= 5 && p.count <= 10; break;
            case 'gt10': matchesContent = p.count > 10; break;
        }
        
        return matchesSearch && matchesContent;
    });

    const getTeamFilterButtonClasses = (isActive: boolean) => 
        `px-2.5 py-1 text-xs font-medium rounded-full transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 ${isActive ? 'ring-2 ring-indigo-500' : ''}`;

    const contentFilterStyles = {
        all: 'bg-gray-300 text-gray-800 hover:bg-gray-400',
        empty: 'bg-gradient-to-t from-gray-300 to-red-200 text-red-900 hover:to-red-300',
        not_empty: 'bg-gradient-to-t from-gray-300 to-blue-200 text-blue-900 hover:to-blue-300',
        lt5: 'bg-gradient-to-t from-gray-300 to-orange-200 text-orange-900 hover:to-orange-300',
        '5-10': 'bg-gray-300 text-gray-800 hover:bg-gray-400',
        gt10: 'bg-gradient-to-t from-gray-300 to-green-200 text-green-900 hover:to-green-300',
    };

    const getPostFilterButtonClasses = (filter: typeof contentFilter) => {
        const isActive = contentFilter === filter;
        return `px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${contentFilterStyles[filter]} ${isActive ? 'ring-2 ring-indigo-500' : ''}`;
    };

    return (
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-full">
            {/* Шапка с кнопками обновления */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Проекты</h2>
                <div className="flex items-center gap-1">
                    <button
                        title="Глобальное обновление всех проектов"
                        className="p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-800"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                        </svg>
                    </button>
                    <button
                        title="Обновить список проектов из базы"
                        className="p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-800"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" /></svg>
                    </button>
                </div>
            </div>

            {/* Фильтры */}
            <div className="p-3 space-y-4 border-b border-gray-200">
                <input
                    type="text"
                    placeholder="Поиск по названию..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Команды</h4>
                    <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => setTeamFilter('All')} className={getTeamFilterButtonClasses(teamFilter === 'All')}>Все</button>
                        <button onClick={() => setTeamFilter('Команда А')} className={getTeamFilterButtonClasses(teamFilter === 'Команда А')}>Команда А</button>
                        <button onClick={() => setTeamFilter('Команда Б')} className={getTeamFilterButtonClasses(teamFilter === 'Команда Б')}>Команда Б</button>
                        <button onClick={() => setTeamFilter('NoTeam')} className={getTeamFilterButtonClasses(teamFilter === 'NoTeam')}>Без команды</button>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Отложенные посты</h4>
                    <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => setContentFilter('all')} className={getPostFilterButtonClasses('all')}>Все</button>
                        <button onClick={() => setContentFilter('empty')} className={getPostFilterButtonClasses('empty')}>Нет постов</button>
                        <button onClick={() => setContentFilter('not_empty')} className={getPostFilterButtonClasses('not_empty')}>Есть посты</button>
                        <button onClick={() => setContentFilter('lt5')} className={getPostFilterButtonClasses('lt5')}>&lt; 5</button>
                        <button onClick={() => setContentFilter('5-10')} className={getPostFilterButtonClasses('5-10')}>5-10</button>
                        <button onClick={() => setContentFilter('gt10')} className={getPostFilterButtonClasses('gt10')}>&gt; 10</button>
                    </div>
                </div>
            </div>

            {/* Список проектов */}
            <nav className="flex-grow overflow-y-auto">
                {filteredProjects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        <p>Проекты не найдены</p>
                    </div>
                ) : (
                    filteredProjects.map(project => (
                        <MockProjectItem
                            key={project.id}
                            project={project}
                            isActive={selectedId === project.id}
                            onClick={() => onSelect(project.id)}
                        />
                    ))
                )}
            </nav>

            {/* Блок текущего пользователя */}
            <div className="border-t border-gray-200 p-3 bg-gray-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-600 text-sm font-medium">А</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">Анна Смирнова</p>
                        <p className="text-xs text-gray-500">Пользователь</p>
                    </div>
                    <button
                        title="Выйти"
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-[10px] text-gray-400 font-mono truncate">Backend: v1.2.3</p>
                </div>
            </div>
        </aside>
    );
};
