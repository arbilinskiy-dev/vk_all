import React from 'react';
import { AuthUser } from '../../../shared/types';
import { ProjectTable } from './ProjectTable';
import { ProjectTableSkeleton } from './ProjectTableSkeleton';
import { ArchivePage } from './ArchivePage';
import { GlobalVariablesManagement } from './GlobalVariablesManagement';
import { ProjectContextManagement } from './ProjectContextManagement';
import { AdministeredGroupsPage } from './AdministeredGroupsPage';
import { COLUMNS } from '../constants';
import { useDatabaseManagementLogic } from '../hooks/useDatabaseManagementLogic';
import { ActionToolbar } from './ActionToolbar';
import { FilterBar } from './FilterBar';
import { DatabaseModals } from './DatabaseModals';

export const DatabaseManagementPage: React.FC<{
    onProjectsUpdate: () => void;
    user: AuthUser | null;
}> = ({ onProjectsUpdate, user }) => {
    const { state, actions, refs } = useDatabaseManagementLogic({ onProjectsUpdate });

    // === Альтернативные режимы просмотра ===
    if (state.viewMode === 'archive') {
        return <ArchivePage user={user} onGoBack={() => actions.setViewMode('main')} onDataUpdated={onProjectsUpdate} />;
    }
    
    if (state.viewMode === 'global-variables') {
        return <GlobalVariablesManagement onGoBack={() => actions.setViewMode('main')} />;
    }

    if (state.viewMode === 'project-context') {
        return <ProjectContextManagement onGoBack={() => actions.setViewMode('main')} />;
    }

    if (state.viewMode === 'administered') {
        return <AdministeredGroupsPage onGoBack={() => actions.setViewMode('main')} />;
    }

    // === Основной режим ===
    return (
        <div className="flex flex-col h-full bg-gray-50">
            <header className="flex-shrink-0 bg-white shadow-sm z-10">
                <div className="p-4 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-800">Управление базой проектов</h1>
                    <p className="text-sm text-gray-500">Массовое редактирование и добавление проектов.</p>
                </div>

                {/* Панель действий */}
                <ActionToolbar
                    columnsButtonRef={refs.columnsButtonRef}
                    columnsDropdownRef={refs.columnsDropdownRef}
                    toggleColumnsDropdown={actions.toggleColumnsDropdown}
                    isVisibilityDropdownOpen={state.isVisibilityDropdownOpen}
                    columnsDropdownPosition={state.columnsDropdownPosition}
                    columnsSearchQuery={state.columnsSearchQuery}
                    onColumnsSearchQueryChange={actions.setColumnsSearchQuery}
                    filteredColumns={state.filteredColumns}
                    visibleColumns={state.visibleColumns}
                    onToggleColumnVisibility={actions.handleToggleColumnVisibility}
                    onShowAllColumns={actions.handleShowAllColumns}
                    onHideAllColumns={actions.handleHideAllColumns}
                    isSaving={state.isSaving}
                    isDirty={state.isDirty}
                    onAutoNumbering={actions.handleAutoNumbering}
                    onBulkCallbackOpen={() => actions.setIsBulkCallbackOpen(true)}
                    onPromoteAdminsOpen={() => actions.setIsPromoteAdminsOpen(true)}
                    onViewModeChange={actions.setViewMode}
                    onAddProject={() => actions.setIsAddModalOpen(true)}
                    onSaveChanges={actions.handleSaveChanges}
                    user={user}
                />

                {/* Панель фильтрации */}
                <FilterBar
                    searchQuery={state.searchQuery}
                    onSearchQueryChange={actions.setSearchQuery}
                    teamFilterButtonRef={refs.teamFilterButtonRef}
                    toggleTeamFilter={actions.toggleTeamFilter}
                    isTeamFilterOpen={state.isTeamFilterOpen}
                    teamFilterPosition={state.teamFilterPosition}
                    teamFilterDropdownRef={refs.teamFilterDropdownRef}
                    teamFilterDisplayText={state.teamFilterDisplayText}
                    teamFilter={state.teamFilter}
                    uniqueTeams={state.uniqueTeams}
                    onTeamFilterSelect={actions.handleTeamFilterSelect}
                    filteredProjectsCount={state.filteredProjects.length}
                    totalProjectsCount={state.projects.length}
                />
            </header>

            {/* Основной контент: таблица */}
            <main className="flex-grow p-4 overflow-auto custom-scrollbar">
                {state.error ? (
                    <div className="text-center text-red-600 p-8 bg-red-50 rounded-lg">{state.error}</div>
                ) : state.isLoading ? (
                    <ProjectTableSkeleton columns={COLUMNS} visibleColumns={state.visibleColumns} />
                ) : (
                    <ProjectTable 
                        projects={state.filteredProjects}
                        editedProjects={state.editedProjects}
                        onProjectChange={actions.handleProjectChange}
                        uniqueTeams={state.uniqueTeams}
                        columns={COLUMNS}
                        visibleColumns={state.visibleColumns}
                        onOpenSettings={actions.handleOpenSettings}
                    />
                )}
            </main>

            {/* Модальные окна */}
            <DatabaseModals
                isAddModalOpen={state.isAddModalOpen}
                onAddModalClose={() => actions.setIsAddModalOpen(false)}
                onAddProjectsSuccess={actions.handleAddProjectsSuccess}
                archiveConfirmation={state.archiveConfirmation}
                onArchiveCancel={() => actions.setArchiveConfirmation(null)}
                isSaving={state.isSaving}
                settingsProject={state.settingsProject}
                settingsInitialSection={state.settingsInitialSection}
                uniqueTeams={state.uniqueTeams}
                onSettingsClose={() => actions.setSettingsProject(null)}
                onSettingsSave={actions.handleSettingsSave}
                isBulkCallbackOpen={state.isBulkCallbackOpen}
                onBulkCallbackClose={() => actions.setIsBulkCallbackOpen(false)}
                projects={state.projects}
                onBulkCallbackComplete={actions.fetchProjects}
                isPromoteAdminsOpen={state.isPromoteAdminsOpen}
                onPromoteAdminsClose={() => actions.setIsPromoteAdminsOpen(false)}
            />
        </div>
    );
};
