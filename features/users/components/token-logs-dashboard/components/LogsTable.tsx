import React, { forwardRef } from 'react';
import { TokenLog, AiTokenLog, SystemAccount, Project, AiToken } from '../../../../../shared/types';
import { VkLogRow } from './VkLogRow';
import { AiLogRow } from './AiLogRow';
import { LoadMoreFooter } from './LoadMoreFooter';
import { EmptyState } from './EmptyState';

interface LogsTableProps {
    activeTab: 'vk' | 'ai';
    
    // VK данные
    vkLogs: TokenLog[];
    vkAccounts: SystemAccount[];
    vkProjects: Project[];
    
    // AI данные
    aiLogs: AiTokenLog[];
    aiTokens: AiToken[];
    
    // Состояния
    isLoading: boolean;
    isLoadingMore: boolean;
    isDeleting: boolean;
    hasMore: boolean;
    
    // Выбор записей
    selectedLogIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onToggleSelectAll: () => void;
    
    // Действия
    onDeleteOne: (id: string) => void;
    onLoadMore: () => void;
}

/**
 * Таблица логов с infinite scroll
 */
export const LogsTable = forwardRef<HTMLDivElement, LogsTableProps>(({
    activeTab,
    vkLogs,
    vkAccounts,
    vkProjects,
    aiLogs,
    aiTokens,
    isLoading,
    isLoadingMore,
    isDeleting,
    hasMore,
    selectedLogIds,
    onToggleSelect,
    onToggleSelectAll,
    onDeleteOne,
    onLoadMore
}, ref) => {
    const currentLogs = activeTab === 'vk' ? vkLogs : aiLogs;
    const currentLogsCount = currentLogs.length;

    return (
        <div 
            ref={ref}
            className="flex-grow overflow-auto custom-scrollbar bg-gray-50 p-4"
        >
            {isLoading && currentLogsCount === 0 ? (
                <EmptyState isLoading={true} activeTab={activeTab} />
            ) : currentLogsCount === 0 ? (
                <EmptyState isLoading={false} activeTab={activeTab} />
            ) : (
                <div className="overflow-x-auto custom-scrollbar bg-white rounded-lg shadow border border-gray-200">
                    <table className="min-w-[1100px] w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b sticky top-0 z-10">
                            <tr>
                                <th className="w-10 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={currentLogsCount > 0 && selectedLogIds.size === currentLogsCount}
                                        onChange={onToggleSelectAll}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="px-6 py-3 w-40">Дата</th>
                                <th className="px-6 py-3 w-48">{activeTab === 'vk' ? 'Аккаунт' : 'Токен'}</th>
                                <th className="px-6 py-3 w-32">{activeTab === 'vk' ? 'Метод' : 'Модель'}</th>
                                <th className="px-6 py-3 w-24">Статус</th>
                                {activeTab === 'vk' && <th className="px-6 py-3 w-64">Проект</th>}
                                <th className="px-6 py-3">Детали</th>
                                <th className="w-12 px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {activeTab === 'vk' ? (
                                vkLogs.map((log, index) => (
                                    <VkLogRow
                                        key={log.id}
                                        log={log}
                                        accounts={vkAccounts}
                                        projects={vkProjects}
                                        isSelected={selectedLogIds.has(log.id)}
                                        isDeleting={isDeleting}
                                        onToggleSelect={onToggleSelect}
                                        onDelete={onDeleteOne}
                                        index={index}
                                    />
                                ))
                            ) : (
                                aiLogs.map((log, index) => (
                                    <AiLogRow
                                        key={log.id}
                                        log={log}
                                        tokens={aiTokens}
                                        isSelected={selectedLogIds.has(log.id)}
                                        isDeleting={isDeleting}
                                        onToggleSelect={onToggleSelect}
                                        onDelete={onDeleteOne}
                                        index={index}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                    
                    <LoadMoreFooter
                        hasMore={hasMore}
                        isLoadingMore={isLoadingMore}
                        currentLogsCount={currentLogsCount}
                        onLoadMore={onLoadMore}
                    />
                </div>
            )}
        </div>
    );
});

LogsTable.displayName = 'LogsTable';
