
import { useState, useMemo } from 'react';
import { Project } from '../../../../../shared/types';
import { AccordionSectionKey } from '../../../../projects/components/modals/ProjectSettingsModal';

interface UseProjectSettingsParams {
    allProjects: Project[];
    projectId: string;
    showVariables: boolean;
    onUpdateProject: (updatedProject: Project) => Promise<void>;
    onReloadVariables: () => void;
}

export function useProjectSettings({
    allProjects,
    projectId,
    showVariables,
    onUpdateProject,
    onReloadVariables,
}: UseProjectSettingsParams) {
    const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
    const [settingsInitialSection, setSettingsInitialSection] = useState<AccordionSectionKey | null>(null);
    const [aiPresetsRefreshKey, setAiPresetsRefreshKey] = useState(0);

    const currentProject = allProjects.find(p => p.id === projectId) || null;
    const uniqueTeams = useMemo(() => {
        return currentProject?.teams ? [...new Set(currentProject.teams)] : [];
    }, [currentProject?.teams]);

    const handleOpenProjectSettings = (section: AccordionSectionKey | null) => {
        setSettingsInitialSection(section);
        setIsProjectSettingsOpen(true);
    };

    const handleSaveProjectSettings = async (updatedProject: Project) => {
        try {
            await onUpdateProject(updatedProject);
            setIsProjectSettingsOpen(false);
            if (showVariables) {
                onReloadVariables();
            }
            setAiPresetsRefreshKey(k => k + 1);
        } catch (error) {
            console.error('Ошибка при сохранении настроек проекта', error);
        }
    };

    return {
        isProjectSettingsOpen,
        setIsProjectSettingsOpen,
        settingsInitialSection,
        aiPresetsRefreshKey,
        currentProject,
        uniqueTeams,
        handleOpenProjectSettings,
        handleSaveProjectSettings,
    };
}
