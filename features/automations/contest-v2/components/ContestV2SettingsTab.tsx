/**
 * Вкладка "Настройки" для редактора Конкурс 2.0
 * Содержит: статус, активность, название, описание конкурса
 */

import React from 'react';
import { ContestV2 } from '../types';
import { Project, SystemPost } from '../../../../shared/types';

interface ContestV2SettingsTabProps {
    contest: ContestV2;
    onChange: (field: keyof ContestV2, value: any) => void;
    project: Project;
    savedPost: SystemPost | null;
}

export const ContestV2SettingsTab: React.FC<ContestV2SettingsTabProps> = ({ 
    contest, 
    onChange, 
    project,
    savedPost,
}) => {
    // Проверяем, опубликован ли конкурс
    const isPublished = contest.status === 'active' && !!contest.vk_start_post_id;
    
    return (
        <div className="space-y-8">
            {/* Секция: Основные параметры */}
            <div className="space-y-6 pb-6 last:pb-0">
                <h3 className="text-lg font-bold text-gray-800 pb-2 border-b border-gray-200 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Основные настройки
                </h3>
                
                {/* Статус механики - показываем информацию в зависимости от состояния */}
                {isPublished ? (
                    // Конкурс опубликован - показываем ссылку на пост в VK
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-green-800">Конкурс запущен!</p>
                                <p className="text-sm text-green-600">
                                    Стартовый пост опубликован в сообществе
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                            <a
                                href={`https://vk.com/wall-${project.group_id}_${contest.vk_start_post_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Открыть пост в VK
                            </a>
                            <span className="text-xs text-green-600">
                                ID поста: {contest.vk_start_post_id}
                            </span>
                        </div>
                    </div>
                ) : savedPost ? (
                    // Пост запланирован, ожидает публикации
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-emerald-800">Механика ожидает публикации</p>
                                <p className="text-sm text-emerald-600">
                                    Пост выйдет {new Date(savedPost.scheduled_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} в {new Date(savedPost.scheduled_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {!contest.is_active && (
                                    <p className="text-xs text-amber-600 mt-1 font-medium">
                                        ⚠️ Механика выключена — публикация не состоится пока не включите
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
                
                {/* Активность механики */}
                <div className="flex items-center justify-between border border-gray-200 p-3 rounded-lg bg-gray-50">
                    <div>
                        <label className="block text-sm font-medium text-gray-800">Активность механики</label>
                        <p className="text-xs text-gray-500 mt-1">Включите, чтобы запустить сбор, обработку участников и публикацию постов.</p>
                    </div>
                    <button
                        onClick={() => onChange('is_active', !contest.is_active)}
                        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none ${contest.is_active ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${contest.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
                
                {/* Название конкурса */}
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-800 mb-1">Название конкурса (внутреннее)</label>
                    <input 
                        type="text" 
                        value={contest.title} 
                        onChange={e => onChange('title', e.target.value)}
                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                        placeholder="Например: Ежемесячный розыгрыш пиццы"
                    />
                </div>
                
                {/* Описание конкурса */}
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-800 mb-1">Описание конкурса (опционально)</label>
                    <textarea
                        value={contest.description || ''}
                        onChange={e => onChange('description', e.target.value)}
                        className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px] resize-vertical transition-shadow"
                        placeholder="Краткое описание механики или приза"
                    />
                </div>
            </div>

            {/* Заглушка для будущей секции */}
            <div className="space-y-6 pb-6 last:pb-0 opacity-50">
                <h3 className="text-lg font-bold text-gray-400 pb-2 border-b border-gray-200">Шаблоны сообщений</h3>
                <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center text-gray-400 text-sm">
                    Будет реализовано на следующем этапе
                </div>
            </div>
        </div>
    );
};
