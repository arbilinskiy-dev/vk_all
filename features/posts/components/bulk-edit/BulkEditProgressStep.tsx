/**
 * Шаг прогресса выполнения массового редактирования
 * Показывает статус задачи и результат
 */

import React from 'react';
import { BulkEditTaskStatus } from '../../../../services/api/bulk_edit.api';

interface BulkEditProgressStepProps {
    taskStatus: BulkEditTaskStatus | null;
    isComplete: boolean;
    onClose: () => void;
}

export const BulkEditProgressStep: React.FC<BulkEditProgressStepProps> = ({
    taskStatus,
    isComplete,
    onClose
}) => {
    if (!taskStatus) {
        return (
            <div className="p-8 text-center">
                <div className="loader border-indigo-600 border-t-transparent h-12 w-12 mx-auto mb-4"></div>
                <p className="text-gray-600">Запуск задачи...</p>
            </div>
        );
    }
    
    const { progress, status, errors } = taskStatus;
    const total = progress.total;
    const completed = progress.completed;
    const failed = progress.failed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Определяем иконку и цвет в зависимости от статуса
    const getStatusIcon = () => {
        if (status === 'done' && failed === 0) {
            return (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            );
        } else if (status === 'done' && failed > 0) {
            return (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            );
        } else if (status === 'error') {
            return (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
            );
        }
        return null;
    };
    
    const getStatusText = () => {
        if (status === 'done' && failed === 0) {
            return 'Все посты успешно отредактированы!';
        } else if (status === 'done' && failed > 0) {
            return `Отредактировано ${completed} постов. Ошибок: ${failed}`;
        } else if (status === 'error') {
            return 'Произошла ошибка при выполнении';
        } else if (status === 'running') {
            return 'Редактирование постов...';
        }
        return 'Подготовка...';
    };
    
    return (
        <div className="p-8">
            {/* Статус выполнения */}
            {!isComplete ? (
                <div className="text-center">
                    <div className="loader border-indigo-600 border-t-transparent h-12 w-12 mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-gray-800 mb-2">{getStatusText()}</p>
                    <p className="text-sm text-gray-500 mb-6">
                        {completed} из {total} ({percent}%)
                    </p>
                    
                    {/* Прогресс-бар */}
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                            style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-4">
                        Не закрывайте окно до завершения
                    </p>
                </div>
            ) : (
                <div className="text-center">
                    {getStatusIcon()}
                    <p className="text-lg font-medium text-gray-800 mb-2">{getStatusText()}</p>
                    
                    {/* Статистика */}
                    <div className="flex justify-center gap-6 my-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{completed}</div>
                            <div className="text-xs text-gray-500">Успешно</div>
                        </div>
                        {failed > 0 && (
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{failed}</div>
                                <div className="text-xs text-gray-500">Ошибок</div>
                            </div>
                        )}
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-600">{total}</div>
                            <div className="text-xs text-gray-500">Всего</div>
                        </div>
                    </div>
                    
                    {/* Список ошибок */}
                    {errors && errors.length > 0 && (
                        <div className="mt-6 text-left">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Ошибки:</h4>
                            <div className="max-h-48 overflow-y-auto bg-red-50 border border-red-200 rounded-lg p-3 space-y-3 custom-scrollbar">
                                {errors.map((err, idx) => {
                                    // Формируем ссылку на VK пост из postId (формат: "-173525155_1369")
                                    const vkPostUrl = err.postId ? `https://vk.com/wall${err.postId}` : null;
                                    // Извлекаем ID группы для ссылки на проект
                                    const groupId = err.postId ? Math.abs(Number(err.postId.split('_')[0])) : null;
                                    const vkGroupUrl = groupId ? `https://vk.com/club${groupId}` : null;
                                    
                                    return (
                                        <div key={idx} className="text-sm text-red-700 border-b border-red-100 pb-2 last:border-0 last:pb-0">
                                            <div className="flex items-start gap-1.5">
                                                <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                                                <div className="min-w-0">
                                                    {/* Проект */}
                                                    {err.projectName && (
                                                        <div className="font-medium text-red-800 truncate">
                                                            {vkGroupUrl ? (
                                                                <a href={vkGroupUrl} target="_blank" rel="noopener noreferrer"
                                                                   className="hover:underline">
                                                                    {err.projectName}
                                                                </a>
                                                            ) : err.projectName}
                                                        </div>
                                                    )}
                                                    {/* Ссылка на пост */}
                                                    {vkPostUrl && (
                                                        <a href={vkPostUrl} target="_blank" rel="noopener noreferrer"
                                                           className="text-xs text-red-500 hover:underline hover:text-red-700">
                                                            vk.com/wall{err.postId}
                                                        </a>
                                                    )}
                                                    {/* Текст ошибки */}
                                                    {err.error && (
                                                        <div className="text-xs text-red-500 mt-0.5">
                                                            {err.error}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    {/* Кнопка закрытия */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-6 px-6 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        Закрыть
                    </button>
                </div>
            )}
        </div>
    );
};
