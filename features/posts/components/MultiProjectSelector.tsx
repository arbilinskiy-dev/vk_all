import React, { useState, useMemo } from 'react';
import { Project } from '../../../../shared/types';
import { TeamFilter } from '../../../projects/types';
import { CustomDatePicker } from '../../../shared/components/pickers/CustomDatePicker';
import { CustomTimePicker } from '../../../shared/components/pickers/CustomTimePicker';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MultiProjectSelectorProps {
    allProjects: Project[];
    selectedIds: Set<string>;
    currentProjectId: string;
    onSelectionChange: (newIds: Set<string>) => void;
    // Новые пропсы для сдвига времени
    timeShiftEnabled: boolean;
    onToggleTimeShift: (value: boolean) => void;
    timeShiftDays: number;
    timeShiftHours: number;
    timeShiftMinutes: number;
    onTimeShiftDaysChange: (value: number) => void;
    onTimeShiftHoursChange: (value: number) => void;
    onTimeShiftMinutesChange: (value: number) => void;
    orderedProjectIds: string[];
    onReorderProjects: (fromIndex: number, toIndex: number) => void;
    // Индивидуальные даты/время проектов
    projectDateTimes: Record<string, { date: string; time: string }>;
    customOverrideIds: Set<string>;
    onSetProjectDateTime: (projectId: string, field: 'date' | 'time', value: string) => void;
    onResetProjectDateTime: (projectId: string) => void;
}

// Вспомогательный компонент для элемента расписания с индивидуальными датой/временем
const SortableProjectItem: React.FC<{
    project: Project;
    dateTime: { date: string; time: string };
    isCustom: boolean;
    onDateTimeChange: (field: 'date' | 'time', value: string) => void;
    onResetDateTime: () => void;
}> = ({ project, dateTime, isCustom, onDateTimeChange, onResetDateTime }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: project.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center p-2 rounded-md gap-1.5 hover:bg-gray-50 ${isDragging ? 'shadow-lg bg-white z-10' : ''}`}
        >
            {/* Drag handle */}
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
            </div>
            
            {/* Имя проекта */}
            <span className="text-sm font-medium truncate min-w-0 flex-1 text-gray-800" title={project.name}>
                {project.name}
            </span>
            
            {/* Дата и время (индивидуальные для проекта) */}
            <div className="flex items-center gap-1 flex-shrink-0">
                <CustomDatePicker
                    value={dateTime.date}
                    onChange={(val) => onDateTimeChange('date', val)}
                    className={`text-xs ${isCustom ? 'border-indigo-400 bg-indigo-50' : ''}`}
                />
                <CustomTimePicker
                    value={dateTime.time}
                    onChange={(val) => onDateTimeChange('time', val)}
                    className={`text-xs ${isCustom ? 'border-indigo-400 bg-indigo-50' : ''}`}
                />
                {/* Кнопка сброса ручной настройки */}
                {isCustom && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onResetDateTime(); }}
                        className="p-0.5 text-indigo-400 hover:text-indigo-600 flex-shrink-0"
                        title="Сбросить к автоматической дате"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export const MultiProjectSelector: React.FC<MultiProjectSelectorProps> = ({
    allProjects,
    selectedIds,
    currentProjectId,
    onSelectionChange,
    timeShiftEnabled,
    onToggleTimeShift,
    timeShiftDays,
    timeShiftHours,
    timeShiftMinutes,
    onTimeShiftDaysChange,
    onTimeShiftHoursChange,
    onTimeShiftMinutesChange,
    orderedProjectIds,
    onReorderProjects,
    projectDateTimes,
    customOverrideIds,
    onSetProjectDateTime,
    onResetProjectDateTime,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [teamFilter, setTeamFilter] = useState<TeamFilter>('All');

    // DnD сенсоры
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Обработчик завершения перетаскивания
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = orderedProjectIds.indexOf(String(active.id));
            const newIndex = orderedProjectIds.indexOf(String(over.id));
            onReorderProjects(oldIndex, newIndex);
        }
    };

    // Проекты для drag-n-drop списка (только выбранные, в правильном порядке)
    const orderedSelectedProjects = useMemo(() => {
        return orderedProjectIds
            .filter(id => selectedIds.has(id))
            .map(id => allProjects.find(p => p.id === id))
            .filter((p): p is Project => p !== undefined);
    }, [orderedProjectIds, selectedIds, allProjects]);

    const uniqueTeams = useMemo(() => {
        const teams = new Set<string>();
        allProjects.forEach(p => {
            if (p.teams && p.teams.length > 0) {
                p.teams.forEach(t => teams.add(t));
            } else if (p.team) {
                teams.add(p.team);
            }
        });
        return Array.from(teams).sort();
    }, [allProjects]);

    const filteredProjects = useMemo(() => {
        return allProjects.filter(p => {
            if (p.disabled) return false;
            if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (teamFilter !== 'All') {
                const projectTeams = p.teams && p.teams.length > 0 ? p.teams : (p.team ? [p.team] : []);
                if (teamFilter === 'NoTeam' && projectTeams.length > 0) return false;
                if (teamFilter !== 'NoTeam' && !projectTeams.includes(teamFilter)) return false;
            }
            return true;
        });
    }, [allProjects, searchQuery, teamFilter]);

    const handleToggleProject = (projectId: string) => {
        const newIds = new Set(selectedIds);
        if (newIds.has(projectId)) {
            newIds.delete(projectId);
        } else {
            newIds.add(projectId);
        }
        onSelectionChange(newIds);
    };

    const handleSelectAllVisible = () => {
        const allVisibleIds = new Set(filteredProjects.map(p => p.id));
        const newIds = new Set([...selectedIds, ...allVisibleIds]);
        onSelectionChange(newIds);
    };

    const handleDeselectAllVisible = () => {
        const visibleIdsToRemove = new Set(filteredProjects.map(p => p.id));
        const newIds = new Set(selectedIds);
        visibleIdsToRemove.forEach(id => {
            if (id !== currentProjectId) { // Нельзя снять выделение с текущего проекта
                newIds.delete(id);
            }
        });
        onSelectionChange(newIds);
    };
    
    return (
        <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg animate-fade-in-up">
            <div className="flex justify-between items-center">
                 <h3 className="text-sm font-semibold text-gray-800">Выберите проекты для публикации</h3>
                 <span className="text-sm font-medium text-gray-600">Выбрано: {selectedIds.size}</span>
            </div>
           
            <div className="flex gap-2 items-center">
                 <input
                    type="text"
                    placeholder="Поиск по названию..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setTeamFilter('All')} className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${teamFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Все</button>
                {uniqueTeams.map(team => (
                    <button key={team} onClick={() => setTeamFilter(team)} className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${teamFilter === team ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                        {team}
                    </button>
                ))}
                <button onClick={() => setTeamFilter('NoTeam')} className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${teamFilter === 'NoTeam' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Без команды</button>
            </div>
             <div className="flex items-center justify-end gap-2 text-xs font-medium">
                <button onClick={handleSelectAllVisible} className="text-indigo-600 hover:text-indigo-800">Выбрать все видимые</button>
                <span>|</span>
                <button onClick={handleDeselectAllVisible} className="text-indigo-600 hover:text-indigo-800">Снять выделение</button>
            </div>
            
            {/* Список проектов для выбора */}
            <div className="max-h-48 overflow-y-auto custom-scrollbar border rounded-md p-2 space-y-1 bg-white">
                    {filteredProjects.length > 0 ? filteredProjects.map(project => {
                        const isCurrent = project.id === currentProjectId;
                        const isChecked = selectedIds.has(project.id);
                        return (
                            <label key={project.id} className={`flex items-center p-2 rounded-md cursor-pointer ${isCurrent ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={isCurrent}
                                    onChange={() => handleToggleProject(project.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                />
                                <span className={`ml-3 text-sm font-medium ${isCurrent ? 'text-gray-500' : 'text-gray-800'}`}>{project.name}</span>
                            </label>
                        );
                    }) : (
                        <p className="text-sm text-gray-500 text-center p-4">Проекты не найдены.</p>
                    )}
                </div>

            {/* Расписание публикации — показываем если выбрано 2+ проекта */}
            {selectedIds.size >= 2 && (
                <div className="pt-3 border-t border-gray-200 space-y-3">
                    {/* Заголовок секции */}
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Расписание публикации</label>
                        <span className="text-xs text-gray-400">Перетаскивайте для изменения порядка</span>
                    </div>

                    {/* Drag-n-drop список проектов с индивидуальными датами */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={orderedSelectedProjects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                            <div className="max-h-56 overflow-y-auto custom-scrollbar border rounded-md p-2 space-y-1 bg-white">
                                {orderedSelectedProjects.map((project) => (
                                    <SortableProjectItem
                                        key={project.id}
                                        project={project}
                                        dateTime={projectDateTimes[project.id] || { date: '', time: '10:00' }}
                                        isCustom={customOverrideIds.has(project.id)}
                                        onDateTimeChange={(field, value) => onSetProjectDateTime(project.id, field, value)}
                                        onResetDateTime={() => onResetProjectDateTime(project.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {/* Тумблер "Автоматический сдвиг" — инструмент для быстрой разводки по времени */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onToggleTimeShift(!timeShiftEnabled)}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors flex-shrink-0 ${timeShiftEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                        >
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${timeShiftEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <label onClick={() => onToggleTimeShift(!timeShiftEnabled)} className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                            Автоматический сдвиг времени
                        </label>
                    </div>

                    {/* Настройки сдвига (при включении) */}
                    {timeShiftEnabled && (
                        <div className="p-3 bg-white rounded-md border border-gray-200 shadow-sm animate-fade-in-up">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">Дни:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={timeShiftDays}
                                        onChange={(e) => onTimeShiftDaysChange(Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-16 border rounded-md px-2 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">Часы:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={timeShiftHours}
                                        onChange={(e) => onTimeShiftHoursChange(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                                        className="w-16 border rounded-md px-2 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">Минуты:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={timeShiftMinutes}
                                        onChange={(e) => onTimeShiftMinutesChange(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                        className="w-16 border rounded-md px-2 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
