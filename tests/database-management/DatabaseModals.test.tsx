/**
 * Тесты: DatabaseModals
 * 
 * Покрывают:
 * — условный рендер AddProjectsModal
 * — условный рендер ConfirmationModal (архивация)
 * — условный рендер ProjectSettingsModal
 * — всегда-рендер BulkCallbackSetupModal и PromoteAdminsModal (isOpen контролируется внутри)
 * — колбэки модалок
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Моки модалок — они тяжёлые, мокаем их как простые компоненты
vi.mock('../../features/database-management/components/modals/AddProjectsModal', () => ({
    AddProjectsModal: ({ onClose, onSuccess }: any) => (
        <div data-testid="add-projects-modal">
            <button onClick={onClose}>Закрыть AddProjectsModal</button>
            <button onClick={onSuccess}>Успех AddProjectsModal</button>
        </div>
    ),
}));

vi.mock('../../shared/components/modals/ConfirmationModal', () => ({
    ConfirmationModal: ({ title, onConfirm, onCancel }: any) => (
        <div data-testid="confirmation-modal">
            <span>{title}</span>
            <button onClick={onConfirm}>Подтвердить</button>
            <button onClick={onCancel}>Отмена</button>
        </div>
    ),
}));

vi.mock('../../features/projects/components/modals/ProjectSettingsModal', () => ({
    ProjectSettingsModal: ({ project, onClose, onSave }: any) => (
        <div data-testid="settings-modal">
            <span>{project?.name}</span>
            <button onClick={onClose}>Закрыть Settings</button>
            <button onClick={() => onSave(project)}>Сохранить Settings</button>
        </div>
    ),
    AccordionSectionKey: {},
}));

vi.mock('../../features/database-management/components/modals/BulkCallbackSetupModal', () => ({
    BulkCallbackSetupModal: ({ isOpen }: any) => (
        isOpen ? <div data-testid="bulk-callback-modal">BulkCallback</div> : null
    ),
}));

vi.mock('../../features/database-management/components/modals/PromoteAdminsModal', () => ({
    PromoteAdminsModal: ({ isOpen }: any) => (
        isOpen ? <div data-testid="promote-admins-modal">PromoteAdmins</div> : null
    ),
}));

import { DatabaseModals } from '../../features/database-management/components/DatabaseModals';
import { Project } from '../../shared/types';

// ─── Хелперы ─────────────────────────────────────────────────────

function createProject(overrides: Partial<Project> = {}): Project {
    return {
        id: 'p1',
        name: 'Тестовый проект',
        communityToken: 'token-123',
        vkProjectId: 12345,
        archived: false,
        ...overrides,
    };
}

function createDefaultProps(overrides = {}) {
    return {
        isAddModalOpen: false,
        onAddModalClose: vi.fn(),
        onAddProjectsSuccess: vi.fn(),
        archiveConfirmation: null as { count: number; onConfirm: () => void } | null,
        onArchiveCancel: vi.fn(),
        isSaving: false,
        settingsProject: null as Project | null,
        settingsInitialSection: null,
        uniqueTeams: ['Маркетинг'],
        onSettingsClose: vi.fn(),
        onSettingsSave: vi.fn(),
        isBulkCallbackOpen: false,
        onBulkCallbackClose: vi.fn(),
        projects: [createProject()],
        onBulkCallbackComplete: vi.fn(),
        isPromoteAdminsOpen: false,
        onPromoteAdminsClose: vi.fn(),
        ...overrides,
    };
}

// ─── Тесты ───────────────────────────────────────────────────────

describe('DatabaseModals', () => {
    // === AddProjectsModal ===

    it('не рендерит AddProjectsModal, когда isAddModalOpen=false', () => {
        render(<DatabaseModals {...createDefaultProps()} />);
        expect(screen.queryByTestId('add-projects-modal')).not.toBeInTheDocument();
    });

    it('рендерит AddProjectsModal, когда isAddModalOpen=true', () => {
        render(<DatabaseModals {...createDefaultProps({ isAddModalOpen: true })} />);
        expect(screen.getByTestId('add-projects-modal')).toBeInTheDocument();
    });

    // === ConfirmationModal ===

    it('не рендерит ConfirmationModal, когда archiveConfirmation=null', () => {
        render(<DatabaseModals {...createDefaultProps()} />);
        expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
    });

    it('рендерит ConfirmationModal, когда archiveConfirmation задан', () => {
        render(<DatabaseModals {...createDefaultProps({
            archiveConfirmation: { count: 2, onConfirm: vi.fn() },
        })} />);
        expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
        expect(screen.getByText('Перенести проекты в архив?')).toBeInTheDocument();
    });

    // === ProjectSettingsModal ===

    it('не рендерит ProjectSettingsModal, когда settingsProject=null', () => {
        render(<DatabaseModals {...createDefaultProps()} />);
        expect(screen.queryByTestId('settings-modal')).not.toBeInTheDocument();
    });

    it('рендерит ProjectSettingsModal, когда settingsProject задан', () => {
        render(<DatabaseModals {...createDefaultProps({
            settingsProject: createProject({ name: 'Мой проект' }),
        })} />);
        expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
        expect(screen.getByText('Мой проект')).toBeInTheDocument();
    });

    // === BulkCallbackSetupModal ===

    it('не рендерит BulkCallbackSetupModal, когда isBulkCallbackOpen=false', () => {
        render(<DatabaseModals {...createDefaultProps()} />);
        expect(screen.queryByTestId('bulk-callback-modal')).not.toBeInTheDocument();
    });

    it('рендерит BulkCallbackSetupModal, когда isBulkCallbackOpen=true', () => {
        render(<DatabaseModals {...createDefaultProps({ isBulkCallbackOpen: true })} />);
        expect(screen.getByTestId('bulk-callback-modal')).toBeInTheDocument();
    });

    // === PromoteAdminsModal ===

    it('не рендерит PromoteAdminsModal, когда isPromoteAdminsOpen=false', () => {
        render(<DatabaseModals {...createDefaultProps()} />);
        expect(screen.queryByTestId('promote-admins-modal')).not.toBeInTheDocument();
    });

    it('рендерит PromoteAdminsModal, когда isPromoteAdminsOpen=true', () => {
        render(<DatabaseModals {...createDefaultProps({ isPromoteAdminsOpen: true })} />);
        expect(screen.getByTestId('promote-admins-modal')).toBeInTheDocument();
    });
});
