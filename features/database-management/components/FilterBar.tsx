import React from 'react';
import { createPortal } from 'react-dom';

interface FilterBarProps {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    teamFilterButtonRef: React.RefObject<HTMLButtonElement>;
    toggleTeamFilter: () => void;
    isTeamFilterOpen: boolean;
    teamFilterPosition: { top: number; left: number; width: number };
    teamFilterDropdownRef: React.RefObject<HTMLDivElement>;
    teamFilterDisplayText: string;
    teamFilter: string;
    uniqueTeams: string[];
    onTeamFilterSelect: (value: string) => void;
    filteredProjectsCount: number;
    totalProjectsCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    searchQuery, onSearchQueryChange,
    teamFilterButtonRef, toggleTeamFilter, isTeamFilterOpen,
    teamFilterPosition, teamFilterDropdownRef,
    teamFilterDisplayText, teamFilter, uniqueTeams,
    onTeamFilterSelect,
    filteredProjectsCount, totalProjectsCount,
}) => {
    return (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50 flex items-center gap-4">
            {/* Поиск по названию */}
            <div className="relative w-64">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange(e.target.value)}
                    placeholder="Поиск по названию..."
                    className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {searchQuery && (
                    <button
                        onClick={() => onSearchQueryChange('')}
                        title="Сбросить поиск"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Фильтр по команде */}
            <div className="flex items-center gap-2 relative">
                <span className="text-sm text-gray-500 whitespace-nowrap">Команда:</span>
                <button
                    ref={teamFilterButtonRef}
                    onClick={toggleTeamFilter}
                    className="inline-flex items-center gap-1.5 border border-gray-300 rounded-md text-sm py-1.5 px-3 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors cursor-pointer"
                >
                    <span className="truncate max-w-[120px]">{teamFilterDisplayText}</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isTeamFilterOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isTeamFilterOpen && createPortal(
                    <div
                        ref={teamFilterDropdownRef}
                        className="fixed z-[100] bg-white border border-gray-200 rounded-md shadow-lg py-1 animate-fade-in-up"
                        style={{
                            top: teamFilterPosition.top,
                            left: teamFilterPosition.left,
                            width: teamFilterPosition.width,
                            maxHeight: 240,
                            overflowY: 'auto',
                        }}
                    >
                        <button
                            onClick={() => onTeamFilterSelect('All')}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-100 ${teamFilter === 'All' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}`}
                        >
                            Все
                        </button>
                        {uniqueTeams.map(t => (
                            <button
                                key={t}
                                onClick={() => onTeamFilterSelect(t)}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-100 ${teamFilter === t ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}`}
                            >
                                {t}
                            </button>
                        ))}
                        <button
                            onClick={() => onTeamFilterSelect('NoTeam')}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-100 ${teamFilter === 'NoTeam' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}`}
                        >
                            Без команды
                        </button>
                    </div>,
                    document.body
                )}
            </div>

            {/* Счётчик */}
            <span className="text-xs text-gray-500 ml-auto">
                Показано: <strong>{filteredProjectsCount}</strong> из {totalProjectsCount}
            </span>
        </div>
    );
};
