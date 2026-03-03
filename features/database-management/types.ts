import { Project } from '../../shared/types';
import { AccordionSectionKey } from '../projects/components/modals/ProjectSettingsModal';

/** Описание колонки таблицы проектов */
export interface ColumnDefinition {
    key: string;
    label: string;
}

/** Props таблицы проектов */
export interface ProjectTableProps {
    projects: Project[];
    editedProjects: Record<string, Project>;
    onProjectChange: (projectId: string, field: keyof Project, value: any) => void;
    uniqueTeams: string[];
    columns: ColumnDefinition[];
    visibleColumns: Record<string, boolean>;
    onOpenSettings: (project: Project, section?: AccordionSectionKey) => void;
}
