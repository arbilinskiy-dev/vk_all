import React from 'react';
import { Project } from '../../../shared/types';
import { AddProjectsModal } from './modals/AddProjectsModal';
import { ConfirmationModal } from '../../../shared/components/modals/ConfirmationModal';
import { ProjectSettingsModal, AccordionSectionKey } from '../../projects/components/modals/ProjectSettingsModal';
import { BulkCallbackSetupModal } from './modals/BulkCallbackSetupModal';
import { PromoteAdminsModal } from './modals/PromoteAdminsModal';
import { plural } from '../../../shared/utils/plural';

interface DatabaseModalsProps {
    // AddProjectsModal
    isAddModalOpen: boolean;
    onAddModalClose: () => void;
    onAddProjectsSuccess: () => void;
    // ConfirmationModal (архивация)
    archiveConfirmation: { count: number; onConfirm: () => void } | null;
    onArchiveCancel: () => void;
    isSaving: boolean;
    // ProjectSettingsModal
    settingsProject: Project | null;
    settingsInitialSection: AccordionSectionKey | null;
    uniqueTeams: string[];
    onSettingsClose: () => void;
    onSettingsSave: (project: Project) => void;
    // BulkCallbackSetupModal
    isBulkCallbackOpen: boolean;
    onBulkCallbackClose: () => void;
    projects: Project[];
    onBulkCallbackComplete: () => void;
    // PromoteAdminsModal
    isPromoteAdminsOpen: boolean;
    onPromoteAdminsClose: () => void;
}

export const DatabaseModals: React.FC<DatabaseModalsProps> = ({
    isAddModalOpen, onAddModalClose, onAddProjectsSuccess,
    archiveConfirmation, onArchiveCancel, isSaving,
    settingsProject, settingsInitialSection, uniqueTeams, onSettingsClose, onSettingsSave,
    isBulkCallbackOpen, onBulkCallbackClose, projects, onBulkCallbackComplete,
    isPromoteAdminsOpen, onPromoteAdminsClose,
}) => {
    return (
        <>
            {isAddModalOpen && (
                <AddProjectsModal
                    onClose={onAddModalClose}
                    onSuccess={onAddProjectsSuccess}
                />
            )}
            {archiveConfirmation && (
                <ConfirmationModal
                    title="Перенести проекты в архив?"
                    message={`Вы уверены, что хотите перенести ${plural(archiveConfirmation.count, ['проект', 'проекта', 'проектов'])} в архив?\nДействие может отменить только администратор.`}
                    onConfirm={archiveConfirmation.onConfirm}
                    onCancel={onArchiveCancel}
                    confirmText="Да, перенести"
                    cancelText="Отмена"
                    isConfirming={isSaving}
                />
            )}
            {settingsProject && (
                <ProjectSettingsModal
                    project={settingsProject}
                    uniqueTeams={uniqueTeams}
                    onClose={onSettingsClose}
                    onSave={onSettingsSave}
                    initialOpenSection={settingsInitialSection}
                    zIndex="z-[60]"
                />
            )}
            {/* Модалка массовой настройки Callback */}
            <BulkCallbackSetupModal
                isOpen={isBulkCallbackOpen}
                onClose={onBulkCallbackClose}
                projects={projects}
                onComplete={onBulkCallbackComplete}
            />
            {/* Модалка "В админы" */}
            <PromoteAdminsModal
                isOpen={isPromoteAdminsOpen}
                onClose={onPromoteAdminsClose}
                projects={projects}
            />
        </>
    );
};
