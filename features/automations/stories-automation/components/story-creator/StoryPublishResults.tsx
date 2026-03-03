import React from 'react';
import { ProjectPublishStatus } from '../../hooks/useStoryCreator';

interface StoryPublishResultsProps {
    /** Массив статусов публикации по проектам */
    publishStatuses: ProjectPublishStatus[];
}

export const StoryPublishResults: React.FC<StoryPublishResultsProps> = ({ publishStatuses }) => {
    if (publishStatuses.length === 0) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">Результаты публикации</h3>
            </div>
            <div className="p-5 space-y-2">
                {publishStatuses.map((ps) => (
                    <PublishStatusRow key={ps.projectId} status={ps} />
                ))}
            </div>
        </div>
    );
};


// ============================================================
// Строка статуса публикации для одного проекта
// ============================================================

const PublishStatusRow: React.FC<{ status: ProjectPublishStatus }> = ({ status: ps }) => {
    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg border transition-colors
            ${ps.status === 'success' ? 'bg-green-50 border-green-200' : ''}
            ${ps.status === 'error' ? 'bg-red-50 border-red-200' : ''}
            ${ps.status === 'publishing' ? 'bg-indigo-50 border-indigo-200' : ''}
            ${ps.status === 'pending' ? 'bg-gray-50 border-gray-200' : ''}
        `}>
            {/* Иконка статуса */}
            <div className="flex-shrink-0">
                {ps.status === 'pending' && (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                )}
                {ps.status === 'publishing' && (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
                )}
                {ps.status === 'success' && (
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                )}
                {ps.status === 'error' && (
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )}
            </div>

            {/* Название проекта */}
            <span className="text-sm font-medium text-gray-800 flex-1 truncate">{ps.projectName}</span>

            {/* Ссылка на историю */}
            {ps.status === 'success' && ps.result?.story_link && (
                <a
                    href={ps.result.story_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap"
                >
                    Открыть →
                </a>
            )}

            {/* Ошибка */}
            {ps.status === 'error' && ps.error && (
                <span className="text-xs text-red-600 max-w-[200px] truncate" title={ps.error}>
                    {ps.error}
                </span>
            )}
        </div>
    );
};
