import React, { useState, useRef } from 'react';
import { useColumnResize } from '../hooks/useColumnResize';
import { CustomSelect } from './CustomSelect';
import { maskToken } from '../utils/projectTableUtils';

// Реэкспорт типов для обратной совместимости
export type { ColumnDefinition, ProjectTableProps } from '../types';
import type { ProjectTableProps } from '../types';

export const ProjectTable: React.FC<ProjectTableProps> = ({ projects, editedProjects, onProjectChange, uniqueTeams, columns, visibleColumns, onOpenSettings }) => {
    const tableRef = useRef<HTMLTableElement>(null);
    const [editingTokenId, setEditingTokenId] = useState<string | null>(null);

    const { state: { columnWidths, isInitialized }, actions: { handleMouseDown } } = useColumnResize({
        tableRef: tableRef as React.RefObject<HTMLTableElement>,
        projectsCount: projects.length,
        visibleColumns,
    });

    // Ресайзер колонки
    const Resizer = ({ columnKey }: { columnKey: string }) => (
        <div
            className="absolute top-0 right-0 h-full w-2 cursor-col-resize select-none"
            onMouseDown={(e) => handleMouseDown(columnKey, e)}
        >
            <div className="w-px h-full bg-gray-300 group-hover:bg-indigo-500 transition-colors"></div>
        </div>
    );
    
    const inputClasses = "p-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white";

    const visibleCols = columns.filter(col => visibleColumns[col.key]);

    return (
        <>
            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200 custom-scrollbar">
                <table 
                    ref={tableRef} 
                    className="w-full"
                    style={{ tableLayout: isInitialized ? 'fixed' : 'auto' }}
                >
                     {isInitialized && (
                        <colgroup>
                            {visibleCols.map(col => (
                                <col key={col.key} style={{ width: `${columnWidths[col.key]}px` }} />
                            ))}
                        </colgroup>
                     )}
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            {visibleCols.map((col, index) => (
                                <th 
                                    key={col.key}
                                    data-key={col.key}
                                    scope="col" 
                                    className="group relative px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis"
                                >
                                    {col.label}
                                    {isInitialized && <Resizer columnKey={col.key} />}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {projects.map((project, index) => {
                            const currentData = editedProjects[project.id] || project;
                            const isEdited = !!editedProjects[project.id];
                            
                            return (
                                <tr 
                                    key={project.id} 
                                    className={`border-b border-white last:border-b-0 ${isEdited ? 'bg-amber-50' : ''} opacity-0 animate-fade-in-up`}
                                    style={{ animationDelay: `${index * 20}ms` }}
                                >
                                    {visibleColumns.sort_order && <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            value={currentData.sort_order ?? ''}
                                            onChange={(e) => onProjectChange(project.id, 'sort_order', e.target.value === '' ? null : e.target.valueAsNumber)}
                                            className={`${inputClasses} w-16 text-center`}
                                        />
                                    </td>}
                                    {visibleColumns.name && <td className="px-4 py-2">
                                        <input
                                            type="text"
                                            value={currentData.name}
                                            onChange={(e) => onProjectChange(project.id, 'name', e.target.value)}
                                            className={`${inputClasses} w-full`}
                                        />
                                    </td>}
                                    {visibleColumns.teams && <td className="px-4 py-2">
                                         <CustomSelect
                                            value={currentData.teams && currentData.teams.length > 0 ? currentData.teams : (currentData.team ? [currentData.team] : [])}
                                            options={uniqueTeams}
                                            onChange={(value) => onProjectChange(project.id, 'teams', value)}
                                        />
                                    </td>}
                                    {visibleColumns.disabled && <td className="px-4 py-2">
                                        <div className="flex items-center">
                                            <button
                                                type="button"
                                                onClick={() => onProjectChange(project.id, 'disabled', !currentData.disabled)}
                                                className={`relative inline-flex items-center h-6 w-11 shrink-0 p-0 border-0 rounded-full cursor-pointer transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-100 ${!currentData.disabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                            >
                                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-sm ${!currentData.disabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </td>}
                                    {visibleColumns.archived && <td className="px-4 py-2">
                                        <div className="flex items-center">
                                            <button
                                                type="button"
                                                onClick={() => onProjectChange(project.id, 'archived', !currentData.archived)}
                                                className={`relative inline-flex items-center h-6 w-11 shrink-0 p-0 border-0 rounded-full cursor-pointer transition-colors focus:outline-none focus:ring-4 focus:ring-indigo-100 ${currentData.archived ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                            >
                                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-sm ${currentData.archived ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </td>}
                                    {visibleColumns.communityToken && <td className="px-4 py-2">
                                        {editingTokenId === project.id ? (
                                            <input
                                                type="text"
                                                value={currentData.communityToken || ''}
                                                onChange={(e) => onProjectChange(project.id, 'communityToken', e.target.value)}
                                                onBlur={() => setEditingTokenId(null)}
                                                className={`${inputClasses} w-full`}
                                                autoFocus
                                            />
                                        ) : (
                                            <div
                                                onClick={() => setEditingTokenId(project.id)}
                                                className={`w-full rounded-md p-1.5 text-sm cursor-pointer border border-transparent hover:border-gray-300 transition-colors ${
                                                    currentData.communityToken 
                                                    ? 'bg-gray-50 text-gray-600 font-mono overflow-hidden truncate' 
                                                    : 'bg-red-50 text-red-600 flex items-center gap-2'
                                                }`}
                                                title={currentData.communityToken 
                                                    ? "Нажмите, чтобы редактировать" 
                                                    : "Критично: Токен необходим для работы с сообщениями, комментариями от имени группы и получения списков рассылки."
                                                }
                                            >
                                                {currentData.communityToken ? (
                                                    maskToken(currentData.communityToken)
                                                ) : (
                                                    <>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="font-medium text-xs">Не задан</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </td>}
                                    {visibleColumns.additional_community_tokens && <td className="px-4 py-2 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div 
                                                className="text-xs cursor-help" 
                                                title={currentData.additional_community_tokens?.length 
                                                    ? currentData.additional_community_tokens.map(t => maskToken(t)).join('\n') 
                                                    : 'Рекомендуется: Дополнительные токены ускоряют загрузку данных (подписчики, диалоги) и помогают избегать лимитов VK API.'}
                                            >
                                                {currentData.additional_community_tokens?.length 
                                                    ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">{currentData.additional_community_tokens.length} шт.</span> 
                                                    : (
                                                        <div className="flex items-center justify-center gap-1 text-amber-500">
                                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            <span className="text-xs">0 шт.</span>
                                                        </div>
                                                    )}
                                            </div>
                                            <button 
                                                onClick={() => onOpenSettings(project, 'integrations')}
                                                className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
                                                title="Редактировать токены в настройках"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>}
                                    {visibleColumns.notes && <td className="px-4 py-2">
                                        <input
                                            type="text"
                                            value={currentData.notes || ''}
                                            onChange={(e) => onProjectChange(project.id, 'notes', e.target.value)}
                                            className={`${inputClasses} w-full`}
                                            placeholder="Внутренний комментарий"
                                        />
                                    </td>}
                                    {visibleColumns.vk_confirmation_code && <td className="px-4 py-2">
                                        <input
                                            type="text"
                                            value={currentData.vk_confirmation_code || ''}
                                            onChange={(e) => onProjectChange(project.id, 'vk_confirmation_code', e.target.value)}
                                            className={`${inputClasses} w-full`}
                                            placeholder="Код подтверждения"
                                        />
                                    </td>}
                                    {visibleColumns.vkGroupName && <td className="px-4 py-2 text-sm text-gray-800 truncate">
                                        {project.vkGroupName}
                                    </td>}
                                    {visibleColumns.vkLink && <td className="px-4 py-2 text-sm text-gray-500">
                                        <a href={project.vkLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900 truncate flex items-center">
                                            <span className="truncate">{project.vkLink}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        </a>
                                    </td>}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};
