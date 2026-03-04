import React from 'react';
import { MockProject, TeamFilter, PostFilter, getPostCountColorClasses } from './_data';

// =====================================================================
// Sandbox: Колонка 2 — Список проектов с поиском и фильтрами
// =====================================================================

interface SandboxProjectsListProps {
    /** Поисковый запрос */
    searchQuery: string;
    /** Обновление поискового запроса */
    setSearchQuery: (q: string) => void;
    /** Текущий фильтр команды */
    teamFilter: TeamFilter;
    /** Обновление фильтра команды */
    setTeamFilter: (f: TeamFilter) => void;
    /** Текущий фильтр постов */
    postFilter: PostFilter;
    /** Обновление фильтра постов */
    setPostFilter: (f: PostFilter) => void;
    /** Отфильтрованный список проектов */
    filteredProjects: MockProject[];
    /** ID выбранного проекта */
    selectedProject: string;
    /** Обновление выбранного проекта */
    setSelectedProject: (id: string) => void;
}

export const SandboxProjectsList: React.FC<SandboxProjectsListProps> = ({
    searchQuery,
    setSearchQuery,
    teamFilter,
    setTeamFilter,
    postFilter,
    setPostFilter,
    filteredProjects,
    selectedProject,
    setSelectedProject,
}) => (
    <div className="w-72 bg-white border-r border-gray-200 rounded flex flex-col">
        {/* Заголовок Проекты */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">Проекты</h3>
            <div className="flex gap-1">
                <button className="p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-800" title="Глобальное обновление">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                </button>
                <button className="p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-800" title="Обновить список">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
        </div>

        {/* Поиск */}
        <div className="p-3">
            <input 
                type="text" 
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
        </div>

        {/* Фильтры КОМАНДЫ */}
        <div className="px-3 pb-4 space-y-4">
            <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Команды</h4>
                <div className="flex flex-wrap gap-1.5">
                    <button 
                        onClick={() => setTeamFilter('all')}
                        className={`px-2.5 py-1 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 font-medium transition-all ${teamFilter === 'all' ? 'ring-2 ring-indigo-500' : ''}`}
                    >
                        Все
                    </button>
                    <button 
                        onClick={() => setTeamFilter('В')}
                        className={`px-2.5 py-1 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 font-medium transition-all ${teamFilter === 'В' ? 'ring-2 ring-indigo-500' : ''}`}
                        aria-label="Фильтр по команде В"
                    >
                        В
                    </button>
                    <button 
                        onClick={() => setTeamFilter('С')}
                        className={`px-2.5 py-1 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 font-medium transition-all ${teamFilter === 'С' ? 'ring-2 ring-indigo-500' : ''}`}
                        aria-label="Фильтр по команде С"
                    >
                        С
                    </button>
                    <button 
                        onClick={() => setTeamFilter('А')}
                        className={`px-2.5 py-1 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 font-medium transition-all ${teamFilter === 'А' ? 'ring-2 ring-indigo-500' : ''}`}
                        aria-label="Фильтр по команде А"
                    >
                        А
                    </button>
                    <button 
                        onClick={() => setTeamFilter('none')}
                        className={`px-2.5 py-1 text-xs bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 font-medium transition-all ${teamFilter === 'none' ? 'ring-2 ring-indigo-500' : ''}`}
                    >
                        Без команды
                    </button>
                </div>
            </div>

        {/* Фильтры ОТЛОЖЕННЫЕ ПОСТЫ */}
            <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Отложенные посты</h4>
                <div className="flex flex-wrap gap-1.5">
                    <button 
                        onClick={() => setPostFilter('all')}
                        className={`px-2.5 py-1 text-xs bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 font-medium transition-all ${postFilter === 'all' ? 'ring-2 ring-indigo-500' : ''}`}
                    >
                        Все
                    </button>
                    <button 
                        onClick={() => setPostFilter('empty')}
                        className={`px-2.5 py-1 text-xs bg-gradient-to-t from-gray-300 to-red-200 text-red-900 rounded-full hover:to-red-300 font-medium transition-all ${postFilter === 'empty' ? 'ring-2 ring-indigo-500' : ''}`}
                    >
                        Нет постов
                    </button>
                    <button 
                        onClick={() => setPostFilter('not_empty')}
                        className={`px-2.5 py-1 text-xs bg-gradient-to-t from-gray-300 to-blue-200 text-blue-900 rounded-full hover:to-blue-300 font-medium transition-all ${postFilter === 'not_empty' ? 'ring-2 ring-indigo-500' : ''}`}
                    >
                        Есть посты
                    </button>
                    <button 
                        onClick={() => setPostFilter('lt5')}
                        className={`px-2.5 py-1 text-xs bg-gradient-to-t from-gray-300 to-orange-200 text-orange-900 rounded-full hover:to-orange-300 font-medium transition-all ${postFilter === 'lt5' ? 'ring-2 ring-indigo-500' : ''}`}
                    >
                        &lt; 5
                    </button>
                    <button 
                        onClick={() => setPostFilter('5-10')}
                        className={`px-2.5 py-1 text-xs bg-gray-300 text-gray-800 rounded-full hover:bg-gray-400 font-medium transition-all ${postFilter === '5-10' ? 'ring-2 ring-indigo-500' : ''}`}
                    >
                        5-10
                    </button>
                    <button 
                        onClick={() => setPostFilter('gt10')}
                        className={`px-2.5 py-1 text-xs bg-gradient-to-t from-gray-300 to-green-200 text-green-900 rounded-full hover:to-green-300 font-medium transition-all ${postFilter === 'gt10' ? 'ring-2 ring-indigo-500' : ''}`}
                    >
                        &gt; 10
                    </button>
                </div>
            </div>
        </div>

        {/* Список проектов */}
        <div className="flex-1 overflow-auto">
            <div className="p-2 space-y-1">
                {filteredProjects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        <p>Проекты не найдены</p>
                        <p className="text-xs mt-1">Попробуйте изменить фильтры</p>
                    </div>
                ) : (
                    filteredProjects.map(project => (
                        <div 
                            key={project.id}
                            onClick={() => setSelectedProject(project.id)}
                            className={`rounded p-2 flex items-center justify-between text-sm cursor-pointer transition-all ${
                                selectedProject === project.id 
                                    ? 'bg-gray-100 hover:bg-gray-200' 
                                    : 'bg-white hover:bg-gray-50'
                            }`}
                        >
                            <span className={`truncate ${selectedProject === project.id ? 'text-gray-800 font-medium' : 'text-gray-700'}`}>
                                {project.name}
                            </span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                {project.hasWarning && (
                                    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getPostCountColorClasses(project.posts)}`}>{project.posts}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
);
