
import React from 'react';
import { Project, ScheduledPost, SystemPost } from '../../../../../shared/types';
import { UnifiedPost } from '../../../../schedule/hooks/useScheduleData';
import { ConfirmUnsavedChangesModal } from '../../../../../shared/components/modals/ConfirmUnsavedChangesModal';
import { ConfirmationModal } from '../../../../../shared/components/modals/ConfirmationModal';
import { BulkEditModal } from '../../bulk-edit';
import { ProjectSettingsModal, AccordionSectionKey } from '../../../../projects/components/modals/ProjectSettingsModal';
import { RefreshType } from '../PostDetailsModal';

interface PostDetailsModalsProps {
    // ConfirmUnsavedChangesModal
    showUnsavedChangesConfirm: boolean;
    onConfirmClose: () => void;
    onCancelClose: () => void;
    // ConfirmationModal (retry перезагрузки медиа)
    reuploadRetryInfo: {
        failedProjects: { project_id: string; error: string }[];
        successProjectIds: string[];
    } | null;
    isRetrying: boolean;
    onRetryReupload: () => void;
    onSkipFailedReupload: () => void;
    // BulkEditModal
    showBulkEditModal: boolean;
    onCloseBulkEdit: () => void;
    sourcePost: UnifiedPost;
    allProjects: Project[];
    onSaveComplete: (affectedProjectIds: string[], refreshType: RefreshType) => void;
    // ProjectSettingsModal
    isProjectSettingsOpen: boolean;
    onCloseProjectSettings: () => void;
    currentProject: Project | null;
    uniqueTeams: string[];
    onSaveProjectSettings: (updatedProject: Project) => Promise<void>;
    settingsInitialSection: AccordionSectionKey | null;
}

export const PostDetailsModals: React.FC<PostDetailsModalsProps> = ({
    showUnsavedChangesConfirm, onConfirmClose, onCancelClose,
    reuploadRetryInfo, isRetrying, onRetryReupload, onSkipFailedReupload,
    showBulkEditModal, onCloseBulkEdit, sourcePost, allProjects, onSaveComplete,
    isProjectSettingsOpen, onCloseProjectSettings, currentProject, uniqueTeams, onSaveProjectSettings, settingsInitialSection,
}) => {
    return (
        <>
            {showUnsavedChangesConfirm && (
                <ConfirmUnsavedChangesModal onConfirm={onConfirmClose} onCancel={onCancelClose} zIndex="z-[60]" />
            )}
            {/* Модалка повторной перезагрузки медиа (при частичном провале) */}
            {reuploadRetryInfo && (
                <ConfirmationModal
                    title="Ошибка перезагрузки медиа"
                    message={`Не удалось перезагрузить медиа для ${reuploadRetryInfo.failedProjects.length} проектов.\n\nОшибки:\n${reuploadRetryInfo.failedProjects.map(f => `\u2022 ${f.error}`).join('\n')}\n\nУспешно сохранено: ${reuploadRetryInfo.successProjectIds.length} проектов. Повторить загрузку для оставшихся?`}
                    onConfirm={onRetryReupload}
                    onCancel={onSkipFailedReupload}
                    confirmText="Повторить"
                    cancelText="Пропустить"
                    isConfirming={isRetrying}
                    confirmButtonVariant="primary"
                    zIndex="z-[60]"
                />
            )}
            {/* Модалка массового редактирования */}
            {showBulkEditModal && (
                <BulkEditModal
                    sourcePost={sourcePost}
                    allProjects={allProjects}
                    onComplete={(affectedProjectIds) => {
                        onCloseBulkEdit();
                        // Уведомляем родителя об изменениях для обновления расписания
                        if (affectedProjectIds.length > 0) {
                            onSaveComplete(affectedProjectIds, 'system');
                        }
                    }}
                    onClose={onCloseBulkEdit}
                />
            )}
            {/* Модалка настроек проекта (переиспользуется для переменных и AI-пресетов) */}
            {isProjectSettingsOpen && currentProject && (
                <ProjectSettingsModal
                    project={currentProject}
                    uniqueTeams={uniqueTeams}
                    onSave={onSaveProjectSettings}
                    onClose={onCloseProjectSettings}
                    zIndex="z-[60]"
                    initialOpenSection={settingsInitialSection}
                />
            )}
        </>
    );
};
