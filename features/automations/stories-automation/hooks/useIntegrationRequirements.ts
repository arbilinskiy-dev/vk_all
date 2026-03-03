/**
 * Хук проверки интеграционных требований для автоматизации историй.
 *
 * Хаб-хук: собирает useRequirementsCheck + useCallbackSetup
 * и возвращает единый публичный API.
 */
import { useProjects } from '../../../../contexts/ProjectsContext';
import { useRequirementsCheck } from './integrationRequirements/useRequirementsCheck';
import { useCallbackSetup } from './integrationRequirements/useCallbackSetup';
import { getIsLocal } from './integrationRequirements/utils';
import type { IntegrationRequirementsActions } from './integrationRequirements/types';

// ─── Реэкспорт типов (внешний контракт) ─────────────────────────

export type { TunnelMode } from './integrationRequirements/types';
export type {
    IntegrationRequirementsState,
    IntegrationRequirementsActions,
    CallbackSetupState,
    CallbackSetupActions,
} from './integrationRequirements/types';

// ─── Хаб-хук ────────────────────────────────────────────────────

export function useIntegrationRequirements(projectId?: string) {
    const { projects, handleUpdateProjectSettings } = useProjects();
    const project = projects.find(p => p.id === projectId);

    const isLocal = getIsLocal();
    const hasToken = Boolean(project?.communityToken);
    const hasGroupId = Boolean(project?.vkProjectId);

    // ─── Под-хуки ─────────────────────────────────────

    const requirements = useRequirementsCheck({
        projectId,
        project,
        handleUpdateProjectSettings,
    });

    const callbackSetup = useCallbackSetup({
        projectId,
        vkGroupName: project?.vkGroupName,
        hasToken,
        hasGroupId,
        isLocal,
        checkRequirements: requirements.checkRequirements,
        checkedRef: requirements.checkedRef,
    });

    // ─── Публичный API ───────────────────────────────

    return {
        state: requirements.state,
        actions: {
            enableWallPostNew: requirements.enableWallPostNew,
            isEnabling: requirements.isEnabling,
            saveToken: requirements.saveToken,
            isSavingToken: requirements.isSavingToken,
            recheck: requirements.checkRequirements,
            projectData: project ? {
                vkGroupShortName: project.vkGroupShortName,
                vkProjectId: project.vkProjectId,
            } : null,
        } as IntegrationRequirementsActions,
        /** Инлайн-автонастройка callback — переиспользует компоненты из IntegrationsSection */
        callbackSetup: {
            state: callbackSetup.state,
            actions: callbackSetup.actions,
        },
    };
}
