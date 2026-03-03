import React from 'react';
import { useStoryCreator } from '../hooks/useStoryCreator';
import { useProjects } from '../../../../contexts/ProjectsContext';
import { StoryFileUpload } from './story-creator/StoryFileUpload';
import { StoryLinkParams } from './story-creator/StoryLinkParams';
import { StoryMultiProject } from './story-creator/StoryMultiProject';
import { StoryPublishResults } from './story-creator/StoryPublishResults';
import { StoryPublishButton } from './story-creator/StoryPublishButton';

interface StoryCreatorViewProps {
    projectId: string;
}

/**
 * Хаб-компонент «Создание истории».
 * Собирает подкомпоненты: загрузка файла, параметры ссылки,
 * мультипроектный режим, результаты публикации, кнопка публикации.
 */
export const StoryCreatorView: React.FC<StoryCreatorViewProps> = ({ projectId }) => {
    const { projects } = useProjects();

    const {
        selectedFile,
        filePreviewUrl,
        fileType,
        validationError,
        isValidating,
        handleFileSelect,
        linkText,
        setLinkText,
        linkUrl,
        setLinkUrl,
        isMultiProjectMode,
        setIsMultiProjectMode,
        selectedProjectIds,
        setSelectedProjectIds,
        isPublishing,
        publishStatuses,
        handlePublish,
        resetForm,
    } = useStoryCreator();

    // Фильтруем только активные проекты
    const activeProjects = projects.filter(p => !p.disabled && !p.archived);

    const getProjectName = (id: string) => {
        return projects.find(p => p.id === id)?.name || id;
    };

    const canPublish = !!selectedFile && !isPublishing && !validationError && !isValidating;

    // Если мультипроект включен, нужно чтобы хотя бы 1 проект был выбран
    const hasSelectedProjects = !isMultiProjectMode || selectedProjectIds.size > 0;

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Загрузка файла */}
            <StoryFileUpload
                selectedFile={selectedFile}
                filePreviewUrl={filePreviewUrl}
                fileType={fileType}
                validationError={validationError}
                isValidating={isValidating}
                onFileSelect={handleFileSelect}
            />

            {/* Параметры ссылки */}
            <StoryLinkParams
                linkText={linkText}
                setLinkText={setLinkText}
                linkUrl={linkUrl}
                setLinkUrl={setLinkUrl}
            />

            {/* Мультипроектный режим */}
            <StoryMultiProject
                isMultiProjectMode={isMultiProjectMode}
                setIsMultiProjectMode={setIsMultiProjectMode}
                selectedProjectIds={selectedProjectIds}
                setSelectedProjectIds={setSelectedProjectIds}
                activeProjects={activeProjects}
                currentProjectId={projectId}
            />

            {/* Статусы публикации */}
            <StoryPublishResults publishStatuses={publishStatuses} />

            {/* Кнопка публикации */}
            <StoryPublishButton
                canPublish={canPublish}
                hasSelectedProjects={hasSelectedProjects}
                isPublishing={isPublishing}
                isMultiProjectMode={isMultiProjectMode}
                selectedProjectCount={selectedProjectIds.size}
                onPublish={() => handlePublish(projectId, getProjectName)}
                onReset={resetForm}
                publishStatuses={publishStatuses}
            />
        </div>
    );
};
