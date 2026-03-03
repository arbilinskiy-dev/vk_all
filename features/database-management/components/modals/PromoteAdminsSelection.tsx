
import React from 'react';
import { Project, SystemAccount } from '../../../../shared/types';

// ─── Типы ─────────────────────────────────────────────────────────

interface PromoteAdminsSelectionProps {
    // Данные
    filteredProjects: Project[];
    filteredAccounts: SystemAccount[];
    isLoadingAccounts: boolean;
    // Выбор
    selectedProjectIds: Set<string>;
    selectedAccountIds: Set<string>;
    selectedProjectCount: number;
    selectedAccountCount: number;
    // Роль
    role: 'administrator' | 'editor' | 'moderator';
    // Процесс
    isRunning: boolean;
    error: string | null;
    canStart: boolean;
    totalPairs: number;
    // Поиск
    projectSearch: string;
    accountSearch: string;
    // Действия
    onToggleProject: (id: string) => void;
    onToggleAccount: (id: string) => void;
    onSelectAllProjects: () => void;
    onDeselectAllProjects: () => void;
    onSelectAllAccounts: () => void;
    onDeselectAllAccounts: () => void;
    onSetRole: (role: 'administrator' | 'editor' | 'moderator') => void;
    onSetProjectSearch: (value: string) => void;
    onSetAccountSearch: (value: string) => void;
    onStart: () => void;
    onClose: () => void;
}

// ─── Компонент ────────────────────────────────────────────────────

export const PromoteAdminsSelection: React.FC<PromoteAdminsSelectionProps> = ({
    filteredProjects,
    filteredAccounts,
    isLoadingAccounts,
    selectedProjectIds,
    selectedAccountIds,
    selectedProjectCount,
    selectedAccountCount,
    role,
    isRunning,
    error,
    canStart,
    totalPairs,
    projectSearch,
    accountSearch,
    onToggleProject,
    onToggleAccount,
    onSelectAllProjects,
    onDeselectAllProjects,
    onSelectAllAccounts,
    onDeselectAllAccounts,
    onSetRole,
    onSetProjectSearch,
    onSetAccountSearch,
    onStart,
    onClose,
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-4 h-[75vh] flex flex-col animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                {/* ─── Заголовок ──────────────────────────────── */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">В админы</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Назначение системных страниц администраторами в группах VK
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* ─── Тело: два столбца ──────────────────────── */}
                <div className="flex-1 overflow-hidden flex">
                    {/* ── Левая колонка: проекты (группы) ─────── */}
                    <div className="w-1/2 border-r border-gray-200 flex flex-col">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-700">
                                    Проекты (группы VK)
                                    {selectedProjectCount > 0 && (
                                        <span className="ml-2 text-xs font-normal text-indigo-600">
                                            выбрано: {selectedProjectCount}
                                        </span>
                                    )}
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={onSelectAllProjects} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                        Все
                                    </button>
                                    <button onClick={onDeselectAllProjects} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                                        Сброс
                                    </button>
                                </div>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={projectSearch}
                                    onChange={e => onSetProjectSearch(e.target.value)}
                                    placeholder="Поиск проекта..."
                                    className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {projectSearch && (
                                    <button
                                        onClick={() => onSetProjectSearch('')}
                                        title="Сбросить поиск"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {filteredProjects.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">
                                    {projectSearch ? 'Ничего не найдено' : 'Нет проектов с привязкой к VK'}
                                </p>
                            ) : (
                                filteredProjects.map(project => (
                                    <label
                                        key={project.id}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                                            selectedProjectIds.has(project.id) 
                                                ? 'bg-indigo-50 text-indigo-800' 
                                                : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedProjectIds.has(project.id)}
                                            onChange={() => onToggleProject(project.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 flex-shrink-0"
                                        />
                                        {project.avatar_url && (
                                            <img 
                                                src={project.avatar_url} 
                                                alt="" 
                                                className="w-7 h-7 rounded-full flex-shrink-0 object-cover"
                                            />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium truncate">{project.name}</div>
                                            {project.vkGroupName && project.vkGroupName !== project.name && (
                                                <div className="text-xs text-gray-400 truncate">{project.vkGroupName}</div>
                                            )}
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── Правая колонка: системные страницы ───── */}
                    <div className="w-1/2 flex flex-col">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-700">
                                    Системные страницы
                                    {selectedAccountCount > 0 && (
                                        <span className="ml-2 text-xs font-normal text-indigo-600">
                                            выбрано: {selectedAccountCount}
                                        </span>
                                    )}
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={onSelectAllAccounts} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                                        Все
                                    </button>
                                    <button onClick={onDeselectAllAccounts} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                                        Сброс
                                    </button>
                                </div>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={accountSearch}
                                    onChange={e => onSetAccountSearch(e.target.value)}
                                    placeholder="Поиск аккаунта..."
                                    className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {accountSearch && (
                                    <button
                                        onClick={() => onSetAccountSearch('')}
                                        title="Сбросить поиск"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {isLoadingAccounts ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="loader border-indigo-500 border-t-transparent h-6 w-6"></div>
                                    <span className="ml-2 text-sm text-gray-500">Загрузка аккаунтов...</span>
                                </div>
                            ) : filteredAccounts.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">
                                    {accountSearch ? 'Ничего не найдено' : 'Нет активных системных аккаунтов'}
                                </p>
                            ) : (
                                filteredAccounts.map(account => (
                                    <label
                                        key={account.id}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                                            selectedAccountIds.has(account.id)
                                                ? 'bg-indigo-50 text-indigo-800'
                                                : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedAccountIds.has(account.id)}
                                            onChange={() => onToggleAccount(account.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 flex-shrink-0"
                                        />
                                        {account.avatar_url && (
                                            <img
                                                src={account.avatar_url}
                                                alt=""
                                                className="w-7 h-7 rounded-full flex-shrink-0 object-cover"
                                            />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium truncate">{account.full_name}</div>
                                            <div className="text-xs text-gray-400">ID: {account.vk_user_id}</div>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* ─── Ошибка ─────────────────────────────────── */}
                {error && (
                    <div className="px-6 py-2 bg-red-50 border-t border-red-100">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* ─── Футер ──────────────────────────────────── */}
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Выбор роли */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Роль:</span>
                            <select
                                value={role}
                                onChange={e => onSetRole(e.target.value as typeof role)}
                                className="border border-gray-300 rounded-md text-sm py-1 pl-2 pr-7 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="administrator">Администратор</option>
                                <option value="editor">Редактор</option>
                                <option value="moderator">Модератор</option>
                            </select>
                        </div>
                        {/* Инфо о количестве пар */}
                        {totalPairs > 0 && (
                            <span className="text-xs text-gray-400">
                                {totalPairs} операций ({selectedProjectCount} групп × {selectedAccountCount} пользов.)
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            disabled={isRunning}
                            className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={onStart}
                            disabled={!canStart}
                            className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                        >
                            {isRunning ? (
                                <>
                                    <div className="loader border-white border-t-transparent h-4 w-4 mr-2"></div>
                                    Выполняется...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    В админы
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
