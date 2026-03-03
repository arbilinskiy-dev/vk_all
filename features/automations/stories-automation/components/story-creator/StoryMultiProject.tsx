import React from 'react';
import { Project } from '../../../../../shared/types';

interface StoryMultiProjectProps {
    /** Включён ли мультипроектный режим */
    isMultiProjectMode: boolean;
    /** Переключить мультипроектный режим */
    setIsMultiProjectMode: (val: boolean) => void;
    /** Набор выбранных ID проектов */
    selectedProjectIds: Set<string>;
    /** Установить набор выбранных ID проектов */
    setSelectedProjectIds: (ids: Set<string>) => void;
    /** Список активных (не отключённых) проектов */
    activeProjects: Project[];
    /** ID текущего проекта */
    currentProjectId: string;
}

export const StoryMultiProject: React.FC<StoryMultiProjectProps> = ({
    isMultiProjectMode,
    setIsMultiProjectMode,
    selectedProjectIds,
    setSelectedProjectIds,
    activeProjects,
    currentProjectId,
}) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Мультипроектная публикация
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                            type="checkbox"
                            checked={isMultiProjectMode}
                            onChange={(e) => {
                                setIsMultiProjectMode(e.target.checked);
                                if (!e.target.checked) setSelectedProjectIds(new Set());
                            }}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:shadow-sm after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
            </div>

            {isMultiProjectMode && (
                <div className="p-5">
                    <StoryProjectSelector
                        allProjects={activeProjects}
                        selectedIds={selectedProjectIds}
                        currentProjectId={currentProjectId}
                        onSelectionChange={setSelectedProjectIds}
                    />
                </div>
            )}
        </div>
    );
};


// ============================================================
// Селектор проектов (список с поиском и чекбоксами)
// ============================================================

const StoryProjectSelector: React.FC<{
    allProjects: Project[];
    selectedIds: Set<string>;
    currentProjectId: string;
    onSelectionChange: (ids: Set<string>) => void;
}> = ({ allProjects, selectedIds, currentProjectId, onSelectionChange }) => {
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredProjects = React.useMemo(() => {
        return allProjects.filter(p => {
            if (p.disabled) return false;
            if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [allProjects, searchQuery]);

    const handleToggle = (id: string) => {
        const newIds = new Set(selectedIds);
        if (newIds.has(id)) {
            newIds.delete(id);
        } else {
            newIds.add(id);
        }
        onSelectionChange(newIds);
    };

    const handleSelectAll = () => {
        const allIds = new Set(filteredProjects.map(p => p.id));
        onSelectionChange(new Set([...selectedIds, ...allIds]));
    };

    const handleDeselectAll = () => {
        const visibleIds = new Set(filteredProjects.map(p => p.id));
        const newIds = new Set(selectedIds);
        visibleIds.forEach(id => {
            if (id !== currentProjectId) newIds.delete(id);
        });
        onSelectionChange(newIds);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Поиск проектов..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-gray-500 whitespace-nowrap">
                    Выбрано: {selectedIds.size}
                </span>
            </div>

            <div className="flex items-center justify-end gap-2 text-xs font-medium">
                <button onClick={handleSelectAll} className="text-indigo-600 hover:text-indigo-800">Выбрать все</button>
                <span className="text-gray-300">|</span>
                <button onClick={handleDeselectAll} className="text-indigo-600 hover:text-indigo-800">Снять все</button>
            </div>

            <div className="max-h-48 overflow-y-auto custom-scrollbar border rounded-md p-2 space-y-1 bg-white">
                {filteredProjects.map(project => {
                    const isCurrent = project.id === currentProjectId;
                    const isChecked = selectedIds.has(project.id);
                    return (
                        <label
                            key={project.id}
                            className={`flex items-center p-2 rounded-md cursor-pointer ${isCurrent ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                        >
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggle(project.id)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className={`ml-3 text-sm font-medium ${isCurrent ? 'text-indigo-700' : 'text-gray-800'}`}>
                                {project.name}
                            </span>
                            {isCurrent && (
                                <span className="ml-auto text-xs text-indigo-500 font-medium">текущий</span>
                            )}
                        </label>
                    );
                })}
                {filteredProjects.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Проекты не найдены</p>
                )}
            </div>
        </div>
    );
};
