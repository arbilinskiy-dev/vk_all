import React from 'react';
import { useAdminToolsLogic } from '../hooks/useAdminToolsLogic';
import { TaskProgressBar } from './TaskProgressBar';
import { StatusBadge } from './StatusBadge';

/**
 * Компонент админ-инструментов для массовых операций над всеми проектами.
 * Позволяет в один клик запустить обновление подписчиков или сбор постов
 * для всех активных проектов.
 *
 * Хаб-компонент: логика — в useAdminToolsLogic, прогресс — в TaskProgressBar.
 */
export const AdminToolsSettings: React.FC = () => {
    const { state, actions } = useAdminToolsLogic();
    const { subscribersTask, postsTask, postsLimit, expandedTask } = state;
    const {
        setPostsLimit,
        setExpandedTask,
        handleRefreshAllSubscribers,
        handleRefreshAllPosts,
        handleStopSubscribers,
        handleStopPosts,
    } = actions;

    return (
        <div className="flex flex-col h-full">
            {/* Заголовок секции */}
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-800">Админ-инструменты</h2>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        Массовые операции
                    </span>
                </div>
            </div>
            
            {/* Контент */}
            <div className="flex-grow overflow-auto custom-scrollbar bg-white p-4">
                <div className="space-y-4">
                    {/* Таблица операций */}
                    <div className="overflow-x-auto custom-scrollbar border border-gray-200 rounded-lg">
                        <table className="min-w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 w-64">Операция</th>
                                    <th className="px-4 py-3">Описание</th>
                                    <th className="px-4 py-3 w-64">Параметры</th>
                                    <th className="px-4 py-3 text-center w-24">Статус</th>
                                    <th className="px-4 py-3 text-right w-48">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {/* Строка: Обновление подписчиков */}
                                <tr 
                                    className={`hover:bg-gray-50 cursor-pointer opacity-0 animate-fade-in-up ${expandedTask === 'subscribers' ? 'bg-indigo-50/50' : ''}`}
                                    style={{ animationDelay: '0ms' }}
                                    onClick={() => setExpandedTask(expandedTask === 'subscribers' ? null : 'subscribers')}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <svg 
                                                xmlns="http://www.w3.org/2000/svg" 
                                                className={`h-4 w-4 text-gray-400 transition-transform ${expandedTask === 'subscribers' ? 'rotate-90' : ''}`} 
                                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                            <div className="p-1.5 bg-indigo-100 rounded">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                            <span className="font-medium text-gray-800">Обновить подписчиков</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        Синхронизация списка подписчиков для всех проектов
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        —
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge progress={subscribersTask.progress} />
                                    </td>
                                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-2">
                                            {subscribersTask.isRunning && (
                                                <button
                                                    onClick={handleStopSubscribers}
                                                    className="inline-flex items-center justify-center w-20 px-2 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-600 bg-white hover:bg-red-50"
                                                    title="Остановить задачу"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Стоп
                                                </button>
                                            )}
                                            <button
                                                onClick={handleRefreshAllSubscribers}
                                                disabled={subscribersTask.isRunning}
                                                className={`inline-flex items-center justify-center w-24 px-3 py-1.5 border text-xs font-medium rounded-md ${
                                                    subscribersTask.isRunning 
                                                        ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed' 
                                                        : 'border-indigo-600 text-indigo-600 bg-white hover:bg-indigo-50'
                                                }`}
                                            >
                                                {subscribersTask.isRunning ? (
                                                    <>
                                                        <div className="loader border-indigo-400 border-t-transparent h-3 w-3 mr-1"></div>
                                                        Работа...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" />
                                                        </svg>
                                                        Старт
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                
                                {/* Прогресс-бар для подписчиков (раскрывается при клике) */}
                                {expandedTask === 'subscribers' && subscribersTask.progress && (
                                    <tr className="bg-indigo-50/30">
                                        <td colSpan={5} className="px-4 py-3 animate-expand-down">
                                            <TaskProgressBar progress={subscribersTask.progress} label="Проекты" />
                                        </td>
                                    </tr>
                                )}

                                {/* Строка: Сбор постов */}
                                <tr 
                                    className={`hover:bg-gray-50 cursor-pointer opacity-0 animate-fade-in-up ${expandedTask === 'posts' ? 'bg-emerald-50/50' : ''}`}
                                    style={{ animationDelay: '20ms' }}
                                    onClick={() => setExpandedTask(expandedTask === 'posts' ? null : 'posts')}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <svg 
                                                xmlns="http://www.w3.org/2000/svg" 
                                                className={`h-4 w-4 text-gray-400 transition-transform ${expandedTask === 'posts' ? 'rotate-90' : ''}`} 
                                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                            <div className="p-1.5 bg-emerald-100 rounded">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                                </svg>
                                            </div>
                                            <span className="font-medium text-gray-800">Собрать посты</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        Сбор постов со стены для всех проектов
                                    </td>
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                            {/* Кнопки выбора лимита */}
                                            <div className="flex gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setPostsLimit('100')}
                                                    disabled={postsTask.isRunning}
                                                    className={`w-10 py-0.5 text-xs rounded-md border transition-colors text-center ${
                                                        postsLimit === '100' 
                                                            ? 'bg-emerald-100 border-emerald-400 text-emerald-700' 
                                                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                                    } ${postsTask.isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    100
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPostsLimit('1000')}
                                                    disabled={postsTask.isRunning}
                                                    className={`w-12 py-0.5 text-xs rounded-md border transition-colors text-center ${
                                                        postsLimit === '1000' 
                                                            ? 'bg-emerald-100 border-emerald-400 text-emerald-700' 
                                                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                                    } ${postsTask.isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    1000
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPostsLimit('all')}
                                                    disabled={postsTask.isRunning}
                                                    className={`w-10 py-0.5 text-xs rounded-md border transition-colors text-center ${
                                                        postsLimit === 'all' 
                                                            ? 'bg-emerald-100 border-emerald-400 text-emerald-700' 
                                                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                                    } ${postsTask.isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    Все
                                                </button>
                                            </div>
                                            {/* Разделитель */}
                                            <div className="h-5 w-px bg-gray-300"></div>
                                            {/* Кнопка актуализации */}
                                            <button
                                                onClick={() => handleRefreshAllPosts('actual')}
                                                disabled={postsTask.isRunning}
                                                className={`inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-md border transition-colors ${
                                                    postsTask.isRunning 
                                                        ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed' 
                                                        : 'border-amber-400 text-amber-600 bg-amber-50 hover:bg-amber-100'
                                                }`}
                                                title="Пропустить проекты, где постов в БД >= VK"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Актуализ.
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge progress={postsTask.progress} />
                                    </td>
                                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-2">
                                            {postsTask.isRunning && (
                                                <button
                                                    onClick={handleStopPosts}
                                                    className="inline-flex items-center justify-center w-20 px-2 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-600 bg-white hover:bg-red-50"
                                                    title="Остановить задачу"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Стоп
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleRefreshAllPosts('limit')}
                                                disabled={postsTask.isRunning}
                                                className={`inline-flex items-center justify-center w-24 px-3 py-1.5 border text-xs font-medium rounded-md ${
                                                    postsTask.isRunning 
                                                        ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed' 
                                                        : 'border-emerald-600 text-emerald-600 bg-white hover:bg-emerald-50'
                                                }`}
                                                title="Скачать выбранное количество постов для каждого проекта"
                                            >
                                                {postsTask.isRunning ? (
                                                    <>
                                                        <div className="loader border-emerald-400 border-t-transparent h-3 w-3 mr-1"></div>
                                                        Работа...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" />
                                                        </svg>
                                                        Старт
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                
                                {/* Прогресс-бар для постов (раскрывается при клике) */}
                                {expandedTask === 'posts' && postsTask.progress && (
                                    <tr className="bg-emerald-50/30">
                                        <td colSpan={5} className="px-4 py-3 animate-expand-down">
                                            <TaskProgressBar progress={postsTask.progress} label="Проекты" />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
