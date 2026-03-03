import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Project } from '../../../shared/types';
import * as api from '../../../services/api';
import { useLocalStorage } from '../../../shared/hooks/useLocalStorage';
import { AccordionSectionKey } from '../../projects/components/modals/ProjectSettingsModal';
import { COLUMNS, ViewMode } from '../constants';

interface UseDatabaseManagementLogicProps {
    onProjectsUpdate: () => void;
}

export function useDatabaseManagementLogic({ onProjectsUpdate }: UseDatabaseManagementLogicProps) {
    // === Данные и состояние ===
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('main');

    const [editedProjects, setEditedProjects] = useState<Record<string, Project>>({});
    const isDirty = Object.keys(editedProjects).length > 0;
    
    const [visibleColumns, setVisibleColumns] = useLocalStorage<Record<string, boolean>>(
        'db-management-visible-columns',
        COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
    );

    // Обратная совместимость: если в localStorage было team, а теперь teams
    useEffect(() => {
        if (visibleColumns && 'team' in visibleColumns && !('teams' in visibleColumns)) {
            setVisibleColumns(prev => {
                const { team, ...rest } = prev;
                return { ...rest, teams: team };
            });
        }
    }, []);
    
    // === Dropdown колонок ===
    const [isVisibilityDropdownOpen, setIsVisibilityDropdownOpen] = useState(false);
    const [columnsSearchQuery, setColumnsSearchQuery] = useState('');
    const [columnsDropdownPosition, setColumnsDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const columnsButtonRef = useRef<HTMLButtonElement>(null);
    const columnsDropdownRef = useRef<HTMLDivElement>(null);

    // === Подтверждение архивации ===
    const [archiveConfirmation, setArchiveConfirmation] = useState<{ count: number; onConfirm: () => void } | null>(null);

    // === Модальное окно настроек ===
    const [settingsProject, setSettingsProject] = useState<Project | null>(null);
    const [settingsInitialSection, setSettingsInitialSection] = useState<AccordionSectionKey | null>(null);

    // === Массовая настройка Callback ===
    const [isBulkCallbackOpen, setIsBulkCallbackOpen] = useState(false);

    // === Модалка "В админы" ===
    const [isPromoteAdminsOpen, setIsPromoteAdminsOpen] = useState(false);

    // === Фильтрация ===
    const [searchQuery, setSearchQuery] = useState('');
    const [teamFilter, setTeamFilter] = useState<string>('All');

    // Кастомный dropdown для фильтра команд
    const [isTeamFilterOpen, setIsTeamFilterOpen] = useState(false);
    const [teamFilterPosition, setTeamFilterPosition] = useState({ top: 0, left: 0, width: 0 });
    const teamFilterButtonRef = useRef<HTMLButtonElement>(null);
    const teamFilterDropdownRef = useRef<HTMLDivElement>(null);

    // === Вычисляемые данные ===
    const uniqueTeams = useMemo(() => {
        const teams = new Set<string>();
        const allCombinedProjects = [...projects, ...Object.values(editedProjects)];
        allCombinedProjects.forEach(p => {
            // Поддержка нового поля teams и старого team
            if (p.teams && p.teams.length > 0) {
                p.teams.forEach(t => teams.add(t));
            } else if (p.team) {
                teams.add(p.team);
            }
        });
        return Array.from(teams).sort();
    }, [projects, editedProjects]);

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            if (teamFilter !== 'All') {
                const projectTeams = p.teams && p.teams.length > 0 ? p.teams : (p.team ? [p.team] : []);
                if (teamFilter === 'NoTeam') {
                    if (projectTeams.length > 0) return false;
                } else {
                    if (!projectTeams.includes(teamFilter)) return false;
                }
            }
            return true;
        });
    }, [projects, searchQuery, teamFilter]);

    // Фильтрация колонок по поиску
    const filteredColumns = useMemo(() => {
        if (!columnsSearchQuery) return COLUMNS;
        const lower = columnsSearchQuery.toLowerCase();
        return COLUMNS.filter(col => col.label.toLowerCase().includes(lower));
    }, [columnsSearchQuery]);

    // Текст для кнопки фильтра команд
    const teamFilterDisplayText = useMemo(() => {
        if (teamFilter === 'All') return 'Все';
        if (teamFilter === 'NoTeam') return 'Без команды';
        return teamFilter;
    }, [teamFilter]);

    // === Загрузка данных ===
    const fetchProjects = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        try {
            console.log("DB_PAGE: Загружаем все проекты для управления...");
            const allProjects = await api.getAllProjectsForManagement();
            setProjects(allProjects);
            console.log(`DB_PAGE: Загружено ${allProjects.length} проектов.`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Не удалось загрузить проекты.';
            setError(errorMessage);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (viewMode === 'main') {
            fetchProjects();
        }
    }, [fetchProjects, viewMode]);

    // === Эффекты для dropdown'ов ===
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Закрытие dropdown колонок (портал)
            if (
                isVisibilityDropdownOpen &&
                columnsButtonRef.current && !columnsButtonRef.current.contains(event.target as Node) &&
                columnsDropdownRef.current && !columnsDropdownRef.current.contains(event.target as Node)
            ) {
                setIsVisibilityDropdownOpen(false);
                setColumnsSearchQuery('');
            }
            // Закрытие dropdown фильтра команд
            if (
                isTeamFilterOpen &&
                teamFilterButtonRef.current && !teamFilterButtonRef.current.contains(event.target as Node) &&
                teamFilterDropdownRef.current && !teamFilterDropdownRef.current.contains(event.target as Node)
            ) {
                setIsTeamFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isTeamFilterOpen, isVisibilityDropdownOpen]);

    // Переключение dropdown колонок
    const toggleColumnsDropdown = useCallback(() => {
        if (!isVisibilityDropdownOpen) {
            if (columnsButtonRef.current) {
                const rect = columnsButtonRef.current.getBoundingClientRect();
                setColumnsDropdownPosition({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: Math.max(rect.width, 220),
                });
            }
            setColumnsSearchQuery('');
        }
        setIsVisibilityDropdownOpen(prev => !prev);
    }, [isVisibilityDropdownOpen]);

    // Обработка scroll/resize для dropdown колонок
    useEffect(() => {
        const handleScrollOrResize = () => {
            if (isVisibilityDropdownOpen && columnsButtonRef.current) {
                const rect = columnsButtonRef.current.getBoundingClientRect();
                setColumnsDropdownPosition({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: Math.max(rect.width, 220),
                });
            }
        };
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isVisibilityDropdownOpen]);

    // Переключение dropdown фильтра команд
    const toggleTeamFilter = useCallback(() => {
        if (!isTeamFilterOpen) {
            if (teamFilterButtonRef.current) {
                const rect = teamFilterButtonRef.current.getBoundingClientRect();
                setTeamFilterPosition({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: Math.max(rect.width, 180),
                });
            }
        }
        setIsTeamFilterOpen(prev => !prev);
    }, [isTeamFilterOpen]);

    // Обработка scroll/resize для фильтра команд
    useEffect(() => {
        const handleScrollOrResize = () => {
            if (isTeamFilterOpen && teamFilterButtonRef.current) {
                const rect = teamFilterButtonRef.current.getBoundingClientRect();
                setTeamFilterPosition({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: Math.max(rect.width, 180),
                });
            }
        };
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isTeamFilterOpen]);

    // Выбор команды в фильтре
    const handleTeamFilterSelect = useCallback((value: string) => {
        setTeamFilter(value);
        setIsTeamFilterOpen(false);
    }, []);

    // === Обработчики проектов ===
    const handleProjectChange = useCallback((projectId: string, field: keyof Project, value: any) => {
        const originalProject = projects.find(p => p.id === projectId);
        if (!originalProject) return;

        const projectBeforeChange = editedProjects[projectId] || originalProject;
        const newEdits = { ...editedProjects };
        
        newEdits[projectId] = { ...projectBeforeChange, [field]: value };

        if (field === 'sort_order') {
            const oldValue = projectBeforeChange.sort_order;
            const newValue = value === null || isNaN(value) ? null : Number(value);
            
            if (newValue !== null && oldValue !== null && newValue !== oldValue) {
                const allCurrentData = projects.map(p => newEdits[p.id] || p);
                
                if (newValue < oldValue) {
                    allCurrentData.forEach(p => {
                        if (p.id !== projectId && p.sort_order != null && p.sort_order >= newValue && p.sort_order < oldValue) {
                            const shiftedProject = { ...(newEdits[p.id] || p), sort_order: p.sort_order + 1 };
                            newEdits[p.id] = shiftedProject;
                        }
                    });
                } 
                else {
                    allCurrentData.forEach(p => {
                        if (p.id !== projectId && p.sort_order != null && p.sort_order > oldValue && p.sort_order <= newValue) {
                            const shiftedProject = { ...(newEdits[p.id] || p), sort_order: p.sort_order - 1 };
                            newEdits[p.id] = shiftedProject;
                        }
                    });
                }
            }
        }
        
        setEditedProjects(newEdits);
    }, [projects, editedProjects]);
    
    const executeSave = async () => {
        setArchiveConfirmation(null);
        setIsSaving(true);
        try {
            console.log(`DB_PAGE: Сохраняем изменения для ${Object.keys(editedProjects).length} проектов...`);
            await api.updateProjects(Object.values(editedProjects));
            setEditedProjects({});
            window.showAppToast?.("Изменения успешно сохранены!", 'success');
            await fetchProjects();
            onProjectsUpdate();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при сохранении.';
            window.showAppToast?.(`Не удалось сохранить изменения: ${errorMessage}`, 'error');
            console.error("Bulk project update failed:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!isDirty) return;

        const projectsToArchive = Object.values(editedProjects).filter((p: Project) => {
            const original = projects.find(orig => orig.id === p.id);
            return p.archived && (!original || !original.archived);
        });

        if (projectsToArchive.length > 0) {
            setArchiveConfirmation({
                count: projectsToArchive.length,
                onConfirm: executeSave,
            });
        } else {
            await executeSave();
        }
    };

    const handleAddProjectsSuccess = () => {
        setIsAddModalOpen(false);
        fetchProjects();
        onProjectsUpdate();
    };

    const handleToggleColumnVisibility = (key: string) => {
        setVisibleColumns(prev => ({...prev, [key]: !prev[key]}));
    };

    const handleShowAllColumns = () => {
        setVisibleColumns(COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: true }), {}));
    };

    const handleHideAllColumns = () => {
        setVisibleColumns(COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: false }), {}));
    };

    const handleAutoNumbering = useCallback(() => {
        const allProjectData = projects.map(p => editedProjects[p.id] || p);
        
        const existingNumbers = allProjectData
            .map(p => p.sort_order)
            .filter((num): num is number => num != null && !isNaN(num));

        let currentNumber = (existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0) + 1;

        const newEdits = { ...editedProjects };
        
        projects.forEach(p => {
            const currentData = newEdits[p.id] || p;
            if (currentData.sort_order == null) {
                newEdits[p.id] = { ...currentData, sort_order: currentNumber };
                currentNumber++;
            }
        });

        setEditedProjects(newEdits);
    }, [projects, editedProjects]);

    const handleOpenSettings = (project: Project, section?: AccordionSectionKey) => {
        setSettingsProject(project);
        setSettingsInitialSection(section || null);
    };

    const handleSettingsSave = async (updatedProject: Project) => {
        try {
            await api.updateProjectSettings(updatedProject);
            // Обновляем данные в списке проектов без перезагрузки страницы
            setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
            setSettingsProject(null);
        } catch (error) {
            console.error("Failed to save settings from DB page:", error);
            window.showAppToast?.("Не удалось сохранить настройки проекта.", 'error');
        }
    };

    // === Возвращаемый объект ===
    return {
        state: {
            // Данные
            projects,
            isLoading,
            error,
            isSaving,
            isDirty,
            viewMode,
            editedProjects,
            filteredProjects,
            filteredColumns,
            uniqueTeams,
            visibleColumns,
            // Модалки
            isAddModalOpen,
            archiveConfirmation,
            settingsProject,
            settingsInitialSection,
            isBulkCallbackOpen,
            isPromoteAdminsOpen,
            // Dropdown колонок
            isVisibilityDropdownOpen,
            columnsSearchQuery,
            columnsDropdownPosition,
            // Фильтрация
            searchQuery,
            teamFilter,
            isTeamFilterOpen,
            teamFilterPosition,
            teamFilterDisplayText,
        },
        actions: {
            setViewMode,
            fetchProjects,
            // Редактирование проектов
            handleProjectChange,
            handleSaveChanges,
            handleAutoNumbering,
            // Модалки
            setIsAddModalOpen,
            handleAddProjectsSuccess,
            setArchiveConfirmation,
            handleOpenSettings,
            handleSettingsSave,
            setSettingsProject,
            setIsBulkCallbackOpen,
            setIsPromoteAdminsOpen,
            // Dropdown колонок
            toggleColumnsDropdown,
            setColumnsSearchQuery,
            handleToggleColumnVisibility,
            handleShowAllColumns,
            handleHideAllColumns,
            // Фильтрация
            setSearchQuery,
            toggleTeamFilter,
            handleTeamFilterSelect,
        },
        refs: {
            columnsButtonRef,
            columnsDropdownRef,
            teamFilterButtonRef,
            teamFilterDropdownRef,
        },
    };
}
