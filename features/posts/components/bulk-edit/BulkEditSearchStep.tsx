/**
 * Шаг поиска в массовом редактировании
 * Позволяет настроить критерии поиска и выбрать проекты
 */

import React from 'react';
import { Project } from '../../../../shared/types';
import { UnifiedPost } from '../../../schedule/hooks/useScheduleData';
import { SearchFormState } from '../../hooks/useBulkEdit';
import { CustomDatePicker } from '../../../../shared/components/pickers/CustomDatePicker';

interface BulkEditSearchStepProps {
    sourcePost: UnifiedPost;
    allProjects: Project[];
    searchForm: SearchFormState;
    isLoading: boolean;
    error: string | null;
    canSearch: boolean;
    onToggleMatchCriteria: (key: keyof SearchFormState['matchCriteria']) => void;
    onTogglePostType: (key: keyof SearchFormState['targetPostTypes']) => void;
    onToggleProject: (projectId: string) => void;
    onToggleAllProjects: () => void;
    onUpdateSearchForm: (updates: Partial<SearchFormState>) => void;
    onSearch: () => void;
    onCancel: () => void;
}

export const BulkEditSearchStep: React.FC<BulkEditSearchStepProps> = ({
    sourcePost,
    allProjects,
    searchForm,
    isLoading,
    error,
    canSearch,
    onToggleMatchCriteria,
    onTogglePostType,
    onToggleProject,
    onToggleAllProjects,
    onUpdateSearchForm,
    onSearch,
    onCancel
}) => {
    // Форматирование даты исходного поста
    const sourceDate = 'date' in sourcePost 
        ? new Date(sourcePost.date) 
        : new Date((sourcePost as any).publication_date);
    const sourceDateStr = sourceDate.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Превью текста исходного поста
    const sourceTextPreview = sourcePost.text 
        ? sourcePost.text.substring(0, 150) + (sourcePost.text.length > 150 ? '...' : '')
        : '(без текста)';
    
    // Количество вложений
    const imageCount = sourcePost.images?.length || 0;
    const attachmentCount = sourcePost.attachments?.length || 0;
    
    return (
        <div className="p-6 space-y-6">
            {/* Информация об исходном посте — как в основной модалке */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Исходный пост
                </div>
                
                {/* Текст */}
                <div className="text-sm text-gray-700 whitespace-pre-line">
                    {sourceTextPreview}
                </div>
                
                {/* Изображения — если есть */}
                {imageCount > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        {sourcePost.images!.slice(0, 4).map((img, idx) => (
                            <img 
                                key={img.id} 
                                src={img.url} 
                                alt="" 
                                className="w-14 h-14 object-cover rounded-md border border-gray-200"
                            />
                        ))}
                        {imageCount > 4 && (
                            <div className="w-14 h-14 rounded-md bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                +{imageCount - 4}
                            </div>
                        )}
                    </div>
                )}
                
                {/* Дата и счётчики */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{sourceDateStr}</span>
                    {imageCount > 0 && <span>Изображений: {imageCount}</span>}
                    {attachmentCount > 0 && <span>Вложений: {attachmentCount}</span>}
                </div>
            </div>
            
            {/* Критерии совпадения с пояснениями */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-800">Искать посты, совпадающие по:</h3>
                <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={searchForm.matchCriteria.byDateTime}
                            onChange={() => onToggleMatchCriteria('byDateTime')}
                            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                            <span className="text-sm text-gray-700">Дате и времени публикации</span>
                            <p className="text-xs text-gray-500 mt-0.5">Найдёт посты с точно такой же датой как у исходного поста: {sourceDateStr}</p>
                        </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={searchForm.matchCriteria.byText}
                            onChange={() => onToggleMatchCriteria('byText')}
                            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                            <span className="text-sm text-gray-700">Тексту</span>
                            <p className="text-xs text-gray-500 mt-0.5">Найдёт посты с полностью идентичным текстом публикации</p>
                        </div>
                    </label>
                </div>
            </div>
            
            {/* Дата начала поиска */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-800">Искать начиная с даты:</h3>
                <CustomDatePicker
                    value={searchForm.searchFromDate}
                    onChange={(val) => onUpdateSearchForm({ searchFromDate: val })}
                    placeholder="Выберите дату"
                />
            </div>
            
            {/* Типы постов — единый стиль indigo */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-800">Типы постов для поиска:</h3>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onTogglePostType('published')}
                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                            searchForm.targetPostTypes.published
                                ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        Опубликованные
                    </button>
                    <button
                        type="button"
                        onClick={() => onTogglePostType('scheduled')}
                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                            searchForm.targetPostTypes.scheduled
                                ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        Отложенные VK
                    </button>
                    <button
                        type="button"
                        onClick={() => onTogglePostType('system')}
                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                            searchForm.targetPostTypes.system
                                ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        Системные
                    </button>
                </div>
            </div>
            
            {/* Выбор проектов */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-800">Проекты для поиска:</h3>
                    <button
                        type="button"
                        onClick={onToggleAllProjects}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                        {searchForm.allProjectsSelected ? 'Снять все' : 'Выбрать все'}
                    </button>
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1 custom-scrollbar">
                    {allProjects.map(project => (
                        <label 
                            key={project.id} 
                            className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={searchForm.targetProjectIds.has(project.id)}
                                onChange={() => onToggleProject(project.id)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700 truncate">{project.name}</span>
                        </label>
                    ))}
                </div>
                <div className="text-xs text-gray-500">
                    Выбрано: {searchForm.targetProjectIds.size} из {allProjects.length}
                </div>
            </div>
            
            {/* Ошибка */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}
            
            {/* Кнопки */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                    Отмена
                </button>
                <button
                    type="button"
                    onClick={onSearch}
                    disabled={!canSearch}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="loader border-white border-t-transparent h-4 w-4"></div>
                            <span>Поиск...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span>Найти совпадения</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
