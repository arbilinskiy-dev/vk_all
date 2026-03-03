/**
 * Карточка конкурса 2.0
 * Копия структуры GeneralContestCard
 */

import React from 'react';
import { ContestV2 } from '../types';

interface ContestV2CardProps {
    contest: ContestV2;
    onDelete?: (id: string) => void;
    onEdit: (id: string) => void;
}

export const ContestV2Card: React.FC<ContestV2CardProps> = ({ contest, onDelete, onEdit }) => {
    const isActive = contest.is_active;

    // Определяем статус
    let statusLabel = 'Черновик';
    let statusColor = 'bg-gray-200 text-gray-600 border-gray-300';
    
    switch (contest.status) {
        case 'draft':
            statusLabel = 'Черновик';
            statusColor = 'bg-gray-100 text-gray-500 border-gray-200';
            break;
        case 'scheduled':
            statusLabel = 'Запланирован';
            statusColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
            break;
        case 'active':
            statusLabel = 'Активен';
            statusColor = 'bg-green-100 text-green-700 border-green-200 animate-pulse';
            break;
        case 'finished':
            statusLabel = 'Завершен';
            statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
            break;
        case 'archived':
            statusLabel = 'В архиве';
            statusColor = 'bg-gray-200 text-gray-500 border-gray-300';
            break;
    }

    // Форматирование даты старта
    const startStr = contest.start_post_date 
        ? new Date(contest.start_post_date).toLocaleDateString('ru-RU', {
            day: '2-digit', month: '2-digit', year: '2-digit'
        }) + ' ' + (contest.start_post_time || '12:00')
        : 'Не указано';

    return (
        <div className={`bg-white rounded-lg shadow-sm border flex flex-col h-full transition-all hover:shadow-md ${isActive ? 'border-indigo-100' : 'border-gray-200 bg-gray-50/50'}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className={`text-base font-bold truncate ${isActive ? 'text-gray-900' : 'text-gray-500'}`} title={contest.title}>
                            {contest.title || "Без названия"}
                        </h3>
                        {contest.description ? (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{contest.description}</p>
                        ) : (
                            <p className="text-xs text-gray-400 italic mt-1">Нет описания</p>
                        )}
                    </div>
                    
                    <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusColor}`}>
                            {statusLabel}
                        </span>
                    </div>
                </div>

                {/* Info Bar */}
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 bg-gray-50 p-2 rounded-md border border-gray-100">
                    <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span><span className="font-medium text-gray-700">Старт:</span> {startStr}</span>
                    </div>
                    {contest.start_type === 'existing_post' && (
                        <>
                            <div className="h-3 w-px bg-gray-300"></div>
                            <div className="flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                <span>Существующий пост</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Статус публикации */}
            {contest.status === 'active' && contest.vk_start_post_id ? (
                // Конкурс запущен
                <div className="mx-4 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-green-800">Конкурс запущен!</p>
                            <p className="text-[10px] text-green-600 truncate">
                                Пост ID: {contest.vk_start_post_id}
                            </p>
                        </div>
                    </div>
                </div>
            ) : contest.start_type === 'new_post' && contest.start_post_date && contest.is_active ? (
                // Ожидает публикации
                <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-emerald-800">Ожидает публикации</p>
                            <p className="text-[10px] text-emerald-600 truncate">
                                Пост выйдет {new Date(contest.start_post_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {contest.start_post_time || '12:00'}
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="px-4 py-3 space-y-3 bg-white">
                    {/* Тип старта */}
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Тип старта:</span>
                        <span className="font-medium text-gray-900">
                            {contest.start_type === 'new_post' ? 'Новый пост' : 'Существующий пост'}
                        </span>
                    </div>
                    
                    {/* Активность */}
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Активность:</span>
                        <span className={`font-medium ${contest.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                            {contest.is_active ? 'Включен' : 'Выключен'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-between items-center gap-2">
                <button 
                    onClick={() => onEdit(contest.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Редактировать
                </button>
                {onDelete && (
                    <button 
                        onClick={() => onDelete(contest.id)}
                        className="flex items-center justify-center p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Удалить"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
};
