/**
 * Компонент прогресс-бара задачи.
 * Отображает основной прогресс, детализацию по воркерам (старый формат)
 * и таблицу проектов (новый формат v2).
 */
import React, { useState } from 'react';
import type { RefreshProgress } from '../../../services/api/lists.api';
import type { ProjectFilter } from '../types';
import { formatDuration, parseWorkersData, parseProjectsData } from '../utils/adminToolsUtils';

interface TaskProgressBarProps {
    /** Объект прогресса задачи */
    progress: RefreshProgress;
    /** Подпись основного прогресс-бара */
    label: string;
}

/**
 * Визуализация полного прогресса задачи:
 * — Время выполнения
 * — Основной прогресс-бар (проекты)
 * — Вложенный прогресс (старый формат)
 * — Параллельные воркеры (старый формат)
 * — Таблица проектов (формат v2)
 * — Блок ошибок
 */
export const TaskProgressBar: React.FC<TaskProgressBarProps> = ({ progress, label }) => {
    // Локальное состояние раскрытия списка проектов
    const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
    // Фильтр проектов
    const [projectFilter, setProjectFilter] = useState<ProjectFilter>('all');

    const percent = progress.total && progress.total > 0 
        ? Math.round((progress.loaded || 0) / progress.total * 100) 
        : 0;
    
    // Пробуем распарсить данные о проектах (новый формат v2)
    const projectsData = parseProjectsData(progress.sub_message);
    const hasProjects = projectsData && projectsData.length > 0;
    
    // Пробуем распарсить данные о воркерах из sub_message (старый формат)
    const workersData = !hasProjects ? parseWorkersData(progress.sub_message) : null;
    const hasWorkers = workersData && workersData.length > 0;
    
    // Старая логика для sub-progress (если нет воркеров и проектов)
    const subPercent = !hasWorkers && !hasProjects && progress.sub_total && progress.sub_total > 0 
        ? Math.round((progress.sub_loaded || 0) / progress.sub_total * 100) 
        : 0;
    
    // Показываем старый sub-progress только если нет воркеров и проектов
    const hasOldSubProgress = !hasWorkers && !hasProjects && ((progress.sub_total && progress.sub_total > 0) || (progress.sub_message && !workersData && !projectsData));
    
    // Рассчитываем время выполнения
    const now = Date.now() / 1000;
    const elapsed = progress.created_at ? now - progress.created_at : 0;
    const totalDuration = progress.finished_at && progress.created_at 
        ? progress.finished_at - progress.created_at 
        : elapsed;
    
    // Фильтруем проекты
    const filteredProjects = hasProjects && projectsData ? projectsData.filter(p => {
        if (projectFilter === 'all') return true;
        if (projectFilter === 'processing') return ['processing', 'fetching', 'saving', 'pending', 'reassigned'].includes(p.status);
        if (projectFilter === 'done') return p.status === 'done';
        if (projectFilter === 'error') return p.status === 'error';
        if (projectFilter === 'skipped') return p.status === 'skipped';
        return true;
    }) : [];
    
    // Считаем статистику по проектам
    const projectStats = hasProjects && projectsData ? {
        total: projectsData.length,
        done: projectsData.filter(p => p.status === 'done').length,
        error: projectsData.filter(p => p.status === 'error').length,
        processing: projectsData.filter(p => ['processing', 'fetching', 'saving'].includes(p.status)).length,
        pending: projectsData.filter(p => ['pending', 'reassigned'].includes(p.status)).length,
        skipped: projectsData.filter(p => p.status === 'skipped').length
    } : null;
    
    return (
        <div className="mt-4 space-y-3">
            {/* Время выполнения */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                    {progress.status === 'done' || progress.status === 'error' 
                        ? `Завершено за ${formatDuration(totalDuration)}`
                        : `Выполняется: ${formatDuration(elapsed)}`
                    }
                </span>
            </div>
            
            {/* Основной прогресс-бар (проекты) */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                    <span className="font-medium">{label}</span>
                    <span>
                        {progress.loaded !== undefined && progress.total !== undefined 
                            ? `${progress.loaded} / ${progress.total}` 
                            : progress.message || 'Обработка...'}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                            progress.status === 'error' ? 'bg-red-500' : 
                            progress.status === 'done' ? 'bg-green-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${percent}%` }}
                    ></div>
                </div>
            </div>
            
            {/* Вложенный прогресс-бар (подписчики/посты внутри текущего проекта) - старый формат */}
            {hasOldSubProgress && (
                <div className="space-y-1 pl-4 border-l-2 border-gray-200">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>{progress.sub_message || 'Детализация'}</span>
                        <span>{progress.sub_loaded} / {progress.sub_total}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                            className="h-2 rounded-full transition-all duration-300 bg-indigo-400"
                            style={{ width: `${subPercent}%` }}
                        ></div>
                    </div>
                </div>
            )}
            
            {/* Сообщение (название текущего проекта) - только для старого формата */}
            {progress.message && !hasOldSubProgress && !hasWorkers && (
                <p className="text-sm text-gray-500 truncate" title={progress.message}>
                    {progress.message}
                </p>
            )}
            
            {/* Сообщение о текущем проекте когда есть sub-progress - старый формат */}
            {progress.message && hasOldSubProgress && (
                <p className="text-xs text-gray-400 truncate pl-4 flex items-center gap-1" title={progress.message}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    {progress.message}
                </p>
            )}
            
            {/* Прогресс воркеров (параллельная обработка) - старый формат */}
            {hasWorkers && workersData && (
                <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                        Параллельная обработка ({workersData.length} потоков)
                    </div>
                    <div className="grid gap-2">
                        {workersData.map((worker) => {
                            const workerPercent = worker.total > 0 
                                ? Math.round((worker.processed / worker.total) * 100) 
                                : 0;
                            const statusColors = {
                                'pending': 'bg-gray-400',
                                'processing': 'bg-blue-500',
                                'done': 'bg-green-500',
                                'error': 'bg-red-500',
                                'cancelled': 'bg-yellow-500'
                            };
                            return (
                                <div key={worker.id} className="bg-gray-50 rounded-md p-2 border border-gray-100">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${statusColors[worker.status] || 'bg-gray-400'}`}></div>
                                            <span className="font-medium text-gray-700 truncate max-w-[150px]" title={worker.name}>
                                                {worker.name}
                                            </span>
                                        </div>
                                        <span className="text-gray-500">
                                            {worker.processed}/{worker.total}
                                            {worker.errors > 0 && (
                                                <span className="text-red-500 ml-1">({worker.errors} ош.)</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div 
                                            className={`h-1.5 rounded-full transition-all duration-300 ${statusColors[worker.status] || 'bg-gray-400'}`}
                                            style={{ width: `${workerPercent}%` }}
                                        ></div>
                                    </div>
                                    {worker.current && worker.status === 'processing' && (
                                        <p className="text-[10px] text-gray-400 mt-1 truncate" title={worker.current}>
                                            → {worker.current}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* Таблица проектов с прогрессом (формат v2) */}
            {hasProjects && projectsData && projectStats && (
                <div className="mt-4 space-y-2">
                    {/* Заголовок с кнопкой сворачивания и фильтрами */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                            className="flex items-center gap-2 text-xs text-gray-600 font-medium hover:text-gray-800 transition-colors"
                        >
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className={`h-4 w-4 transition-transform ${isProjectsExpanded ? 'rotate-90' : ''}`} 
                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                            <span>Проекты - {projectStats.done}/{projectStats.total}</span>
                            {projectStats.processing > 0 && (
                                <span className="text-blue-500">• {projectStats.processing} в работе</span>
                            )}
                            {projectStats.error > 0 && (
                                <span className="text-red-500">• {projectStats.error} ошибок</span>
                            )}
                        </button>
                        
                        {/* Мини-фильтры */}
                        {isProjectsExpanded && (
                            <div className="flex gap-1">
                                {(['all', 'processing', 'done', 'error', 'skipped'] as const).map(filter => {
                                    const counts = {
                                        all: projectStats.total,
                                        processing: projectStats.processing + projectStats.pending,
                                        done: projectStats.done,
                                        error: projectStats.error,
                                        skipped: projectStats.skipped
                                    };
                                    const labels = {
                                        all: 'Все',
                                        processing: 'В работе',
                                        done: 'Готово',
                                        error: 'Ошибки',
                                        skipped: 'Пропущено'
                                    };
                                    return (
                                        <button
                                            key={filter}
                                            onClick={() => setProjectFilter(filter)}
                                            className={`px-2 py-0.5 text-[10px] rounded-md transition-colors ${
                                                projectFilter === filter 
                                                    ? 'bg-indigo-100 text-indigo-700' 
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                            }`}
                                        >
                                            {labels[filter]} - {counts[filter]}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    
                    {/* Раскрывающийся список проектов */}
                    {isProjectsExpanded && (
                        <div className="max-h-80 overflow-y-auto custom-scrollbar border border-gray-200 rounded-md animate-expand-down">
                            <table className="w-full text-xs table-fixed">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="text-left p-2 font-medium text-gray-600 w-[40%]">Проект</th>
                                        <th className="text-left p-2 font-medium text-gray-600 w-[25%]">Токен</th>
                                        <th className="text-center p-2 font-medium text-gray-600 w-[15%]">Статус</th>
                                        <th className="text-right p-2 font-medium text-gray-600 w-[20%]">Прогресс</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProjects.map((project) => {
                                        const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
                                            'pending': { label: 'Ожидание', color: 'text-gray-500', bg: 'bg-gray-100' },
                                            'processing': { label: 'Запуск', color: 'text-blue-600', bg: 'bg-blue-100' },
                                            'fetching': { label: 'Скачивание', color: 'text-indigo-600', bg: 'bg-indigo-100' },
                                            'saving': { label: 'Сохранение', color: 'text-purple-600', bg: 'bg-purple-100' },
                                            'done': { label: 'Готово', color: 'text-green-600', bg: 'bg-green-100' },
                                            'error': { label: 'Ошибка', color: 'text-red-600', bg: 'bg-red-100' },
                                            'reassigned': { label: 'Переназначен', color: 'text-yellow-600', bg: 'bg-yellow-100' },
                                            'skipped': { label: 'Пропущен', color: 'text-orange-600', bg: 'bg-orange-100' }
                                        };
                                        const status = statusConfig[project.status] || statusConfig['pending'];
                                        const projectPercent = project.total > 0 ? Math.round((project.loaded / project.total) * 100) : 0;
                                        
                                        return (
                                            <tr key={project.project_id} className="border-t border-gray-100 hover:bg-gray-50">
                                                <td className="p-2">
                                                    <div className="flex items-center gap-1.5">
                                                        {project.is_admin && (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" title="Токен — админ">
                                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                            </svg>
                                                        )}
                                                        <span className="truncate" title={project.project_name}>
                                                            {project.project_name}
                                                        </span>
                                                    </div>
                                                    {project.status === 'done' && (project.added > 0 || project.left > 0) && (
                                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                                            {project.added > 0 && <span className="text-green-600">+{project.added}</span>}
                                                            {project.added > 0 && project.left > 0 && ' / '}
                                                            {project.left > 0 && <span className="text-red-500">-{project.left}</span>}
                                                        </div>
                                                    )}
                                                    {project.status === 'error' && project.error && (
                                                        <div className="text-[10px] text-red-500 mt-0.5 truncate" title={project.error}>
                                                            {project.error}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    <span className="truncate block text-gray-500" title={project.token_name}>
                                                        {project.token_name || '—'}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-center">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${status.bg} ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="p-2">
                                                    {project.status === 'fetching' || project.status === 'saving' ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                                                <div 
                                                                    className="h-1.5 rounded-full bg-indigo-500 transition-all duration-300"
                                                                    style={{ width: `${projectPercent}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-gray-500 text-right text-[10px] whitespace-nowrap">
                                                                {project.loaded.toLocaleString()}/{project.total.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ) : project.status === 'done' ? (
                                                        <span className="text-green-600 text-right block">
                                                            {project.loaded > 0 ? project.loaded.toLocaleString() : (project.total > 0 ? project.total.toLocaleString() : '—')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-right block">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredProjects.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-4 text-center text-gray-400">
                                                Нет проектов по выбранному фильтру
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            
            {/* Обработка ошибок: пробуем распарсить JSON с деталями */}
            {progress.error && (() => {
                try {
                    const errorData = JSON.parse(progress.error);
                    if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                        return (
                            <details className="text-sm bg-red-50 border border-red-200 rounded-md p-3">
                                <summary className="cursor-pointer text-red-700 font-medium flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Ошибки при обработке - {errorData.errors.length} проектов
                                </summary>
                                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                    {errorData.errors.map((err: any, idx: number) => (
                                        <div key={idx} className="bg-white rounded p-2 border border-red-100">
                                            <div className="font-medium text-red-800 text-xs">
                                                {idx + 1}. {err.project_name} <span className="text-gray-500 font-normal">(ID: {err.project_id})</span>
                                            </div>
                                            <div className="text-red-600 text-xs mt-1 break-words">
                                                {err.error}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        );
                    }
                } catch {
                    // Если не удалось распарсить, показываем как обычный текст
                    return (
                        <p className="text-sm text-red-600">
                            Ошибка: {progress.error}
                        </p>
                    );
                }
                // Если JSON пустой или без errors, показываем как обычный текст
                return (
                    <p className="text-sm text-red-600">
                        Ошибка: {progress.error}
                    </p>
                );
            })()}
        </div>
    );
};
