import React from 'react';
import { createPortal } from 'react-dom';
import { AuthUser } from '../../../shared/types';
import { ColumnDefinition } from './ProjectTable';
import { ViewMode } from '../constants';

interface ActionToolbarProps {
    // Dropdown колонок
    columnsButtonRef: React.RefObject<HTMLButtonElement>;
    columnsDropdownRef: React.RefObject<HTMLDivElement>;
    toggleColumnsDropdown: () => void;
    isVisibilityDropdownOpen: boolean;
    columnsDropdownPosition: { top: number; left: number; width: number };
    columnsSearchQuery: string;
    onColumnsSearchQueryChange: (value: string) => void;
    filteredColumns: ColumnDefinition[];
    visibleColumns: Record<string, boolean>;
    onToggleColumnVisibility: (key: string) => void;
    onShowAllColumns: () => void;
    onHideAllColumns: () => void;
    // Кнопки действий
    isSaving: boolean;
    isDirty: boolean;
    onAutoNumbering: () => void;
    onBulkCallbackOpen: () => void;
    onPromoteAdminsOpen: () => void;
    onViewModeChange: (mode: ViewMode) => void;
    onAddProject: () => void;
    onSaveChanges: () => void;
    user: AuthUser | null;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
    columnsButtonRef, columnsDropdownRef, toggleColumnsDropdown,
    isVisibilityDropdownOpen, columnsDropdownPosition,
    columnsSearchQuery, onColumnsSearchQueryChange,
    filteredColumns, visibleColumns,
    onToggleColumnVisibility, onShowAllColumns, onHideAllColumns,
    isSaving, isDirty,
    onAutoNumbering, onBulkCallbackOpen, onPromoteAdminsOpen,
    onViewModeChange, onAddProject, onSaveChanges,
    user,
}) => {
    return (
        <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-2">
                {/* Кнопка выбора колонок + dropdown */}
                <div className="relative">
                    <button
                        ref={columnsButtonRef}
                        onClick={toggleColumnsDropdown}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm whitespace-nowrap transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        Колонки
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 ml-1.5 text-gray-400 transition-transform duration-200 ${isVisibilityDropdownOpen ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {isVisibilityDropdownOpen && createPortal(
                        <div
                            ref={columnsDropdownRef}
                            className="fixed z-[100] bg-white rounded-md shadow-lg border border-gray-200 animate-fade-in-up flex flex-col"
                            style={{
                                top: columnsDropdownPosition.top,
                                left: columnsDropdownPosition.left,
                                width: columnsDropdownPosition.width,
                                maxHeight: 340,
                            }}
                        >
                            <div className="px-3 py-2 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                                <button onClick={onShowAllColumns} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap">Показать все</button>
                                <button onClick={onHideAllColumns} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap">Скрыть все</button>
                            </div>
                            <div className="p-2 border-b border-gray-100 flex-shrink-0">
                                <input
                                    type="text"
                                    placeholder="Поиск..."
                                    value={columnsSearchQuery}
                                    onChange={(e) => onColumnsSearchQueryChange(e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                />
                            </div>
                            <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
                                {filteredColumns.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-4">Ничего не найдено</p>
                                ) : (
                                    filteredColumns.map(col => (
                                        <label key={col.key} className="flex items-center px-2 py-1.5 rounded-md text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={!!visibleColumns[col.key]}
                                                onChange={() => onToggleColumnVisibility(col.key)}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                                            />
                                            <span className="ml-3 select-none">{col.label}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>,
                        document.body
                    )}
                </div>

                {/* Auto-нумерация */}
                <button
                    onClick={onAutoNumbering}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm disabled:opacity-50 whitespace-nowrap"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20V4l4 4" />
                    </svg>
                    Auto №
                </button>

                {/* Массовая настройка Callback */}
                <button
                    onClick={onBulkCallbackOpen}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 shadow-sm disabled:opacity-50 whitespace-nowrap transition-colors"
                    title="Массовая автонастройка Callback-серверов VK для всех проектов с токеном"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Настроить колбэки
                </button>

                {/* Кнопка "В админы" */}
                <button
                    onClick={onPromoteAdminsOpen}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center px-4 py-2 border border-amber-300 text-sm font-medium rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 shadow-sm disabled:opacity-50 whitespace-nowrap transition-colors"
                    title="Назначить системные страницы администраторами в группах VK"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    В админы
                </button>

                {/* Administered Groups Button */}
                <button
                    onClick={() => onViewModeChange('administered')}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm whitespace-nowrap"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Администрируемые
                </button>

                {/* Архив */}
                <button
                    onClick={() => onViewModeChange('archive')}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm whitespace-nowrap"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Архив
                </button>

                {/* Кнопки только для админов */}
                {user?.role === 'admin' && (
                    <>
                        <button
                            onClick={() => onViewModeChange('global-variables')}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm whitespace-nowrap"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.705 4.5l.395 3.951a.5.5 0 00.495.448h5.81a.5.5 0 00.495-.448l.395-3.951M5.23 11h13.54M4.21 15h15.58" />
                            </svg>
                            Глобальные переменные
                        </button>
                        <button
                            onClick={() => onViewModeChange('project-context')}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm whitespace-nowrap"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                               <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Контекст проекта
                        </button>
                    </>
                )}
            </div>

            {/* Правая часть: добавить + сохранить */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onAddProject}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 disabled:opacity-50 whitespace-nowrap"
                >
                    + Добавить проекты
                </button>
                <button
                    onClick={onSaveChanges}
                    disabled={!isDirty || isSaving}
                    title="Сохранить все изменения"
                    className="whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
                >
                    {isSaving ? <div className="loader border-white border-t-transparent h-4 w-4"></div> : 'Сохранить'}
                </button>
            </div>
        </div>
    );
};
