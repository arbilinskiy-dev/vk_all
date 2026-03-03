
import React from 'react';
import { Project } from '../../../../shared/types';
import { usePromoteAdminsLogic } from '../../hooks/usePromoteAdminsLogic';
import { PromoteAdminsResults } from './PromoteAdminsResults';
import { PromoteAdminsSelection } from './PromoteAdminsSelection';

// ─── Типы ─────────────────────────────────────────────────────────

interface PromoteAdminsModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
}

// ─── Компонент (хаб) ──────────────────────────────────────────────

export const PromoteAdminsModal: React.FC<PromoteAdminsModalProps> = ({
    isOpen,
    onClose,
    projects,
}) => {
    const { state, actions } = usePromoteAdminsLogic({ isOpen, onClose, projects });

    if (!isOpen) return null;

    // ─── Фаза результатов ────────────────────────────────────────
    if (state.response && state.groupedResults) {
        return (
            <PromoteAdminsResults
                response={state.response}
                groupedResults={state.groupedResults}
                onBack={actions.handleBack}
                onClose={actions.handleClose}
            />
        );
    }

    // ─── Фаза выбора ─────────────────────────────────────────────
    return (
        <PromoteAdminsSelection
            filteredProjects={state.filteredProjects}
            filteredAccounts={state.filteredAccounts}
            isLoadingAccounts={state.isLoadingAccounts}
            selectedProjectIds={state.selectedProjectIds}
            selectedAccountIds={state.selectedAccountIds}
            selectedProjectCount={state.selectedProjectCount}
            selectedAccountCount={state.selectedAccountCount}
            role={state.role}
            isRunning={state.isRunning}
            error={state.error}
            canStart={state.canStart}
            totalPairs={state.totalPairs}
            projectSearch={state.projectSearch}
            accountSearch={state.accountSearch}
            onToggleProject={actions.toggleProject}
            onToggleAccount={actions.toggleAccount}
            onSelectAllProjects={actions.selectAllProjects}
            onDeselectAllProjects={actions.deselectAllProjects}
            onSelectAllAccounts={actions.selectAllAccounts}
            onDeselectAllAccounts={actions.deselectAllAccounts}
            onSetRole={actions.setRole}
            onSetProjectSearch={actions.setProjectSearch}
            onSetAccountSearch={actions.setAccountSearch}
            onStart={actions.handleStart}
            onClose={actions.handleClose}
        />
    );
};
