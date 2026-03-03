import React from 'react';
import { TokenLog, SystemAccount, Project } from '../../../../../shared/types';
import { getVkAccountName, getProjectName, getStatusBadge } from '../helpers';

interface VkLogRowProps {
    log: TokenLog;
    accounts: SystemAccount[];
    projects: Project[];
    isSelected: boolean;
    isDeleting: boolean;
    onToggleSelect: (id: string) => void;
    onDelete: (id: string) => void;
}

/**
 * Строка VK лога в таблице
 */
export const VkLogRow: React.FC<VkLogRowProps & { index?: number }> = ({
    log,
    accounts,
    projects,
    isSelected,
    isDeleting,
    onToggleSelect,
    onDelete,
    index = 0
}) => {
    const accountName = getVkAccountName(log, accounts);
    const projectName = getProjectName(log, projects);

    return (
        <tr
            className={`hover:bg-gray-50 transition-colors opacity-0 animate-fade-in-up ${isSelected ? 'bg-indigo-50' : ''}`}
            style={{ animationDelay: `${index * 20}ms` }}
        >
            <td className="w-10 px-4 py-4">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(log.id)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                {new Date(log.timestamp).toLocaleString('ru-RU')}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900 truncate max-w-[180px]" title={accountName}>
                    {accountName}
                </div>
            </td>
            <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-semibold whitespace-nowrap">
                {log.method}
            </td>
            <td className="px-6 py-4">
                {getStatusBadge(log.status)}
            </td>
            <td className="px-6 py-4 text-gray-500 text-xs">
                {log.project_id ? (
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-700 text-xs truncate max-w-[200px]" title={projectName}>
                            {projectName}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{log.project_id}</span>
                    </div>
                ) : '-'}
            </td>
            <td className="px-6 py-4 text-gray-600 whitespace-nowrap truncate max-w-xs" title={log.error_details || '-'}>
                {log.error_details || '-'}
            </td>
            <td className="w-12 px-4 py-4 text-right">
                <button
                    onClick={() => onDelete(log.id)}
                    disabled={isDeleting}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    title="Удалить"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </td>
        </tr>
    );
};
