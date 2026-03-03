import React from 'react';
import { ProjectPublishStatus } from '../../hooks/useStoryCreator';

interface StoryPublishButtonProps {
    /** Можно ли публиковать (файл выбран, нет ошибок валидации, не в процессе) */
    canPublish: boolean;
    /** Выбраны ли проекты (или режим одиночного проекта) */
    hasSelectedProjects: boolean;
    /** Идёт ли публикация сейчас */
    isPublishing: boolean;
    /** Включён ли мультипроектный режим */
    isMultiProjectMode: boolean;
    /** Количество выбранных проектов */
    selectedProjectCount: number;
    /** Обработчик нажатия «Опубликовать» */
    onPublish: () => void;
    /** Обработчик нажатия «Создать ещё» (сброс формы) */
    onReset: () => void;
    /** Статусы публикации (для отображения кнопки «Создать ещё») */
    publishStatuses: ProjectPublishStatus[];
}

export const StoryPublishButton: React.FC<StoryPublishButtonProps> = ({
    canPublish,
    hasSelectedProjects,
    isPublishing,
    isMultiProjectMode,
    selectedProjectCount,
    onPublish,
    onReset,
    publishStatuses,
}) => {
    return (
        <div className="flex items-center gap-3">
            <button
                onClick={onPublish}
                disabled={!canPublish || !hasSelectedProjects}
                className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all shadow-sm flex items-center gap-2
                    ${canPublish && hasSelectedProjects
                        ? 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
            >
                {isPublishing ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Публикация...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        {isMultiProjectMode && selectedProjectCount > 1
                            ? `Опубликовать в ${selectedProjectCount} проектов`
                            : 'Опубликовать историю'
                        }
                    </>
                )}
            </button>

            {publishStatuses.length > 0 && !isPublishing && (
                <button
                    onClick={onReset}
                    className="px-4 py-2.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                >
                    Создать ещё
                </button>
            )}
        </div>
    );
};
