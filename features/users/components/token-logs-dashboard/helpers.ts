import React from 'react';
import { TokenLog, AiTokenLog, SystemAccount, Project, AiToken } from '../../../../shared/types';

/**
 * Получить имя VK аккаунта по логу
 */
export const getVkAccountName = (log: TokenLog, accounts: SystemAccount[]): string => {
    if (log.is_env_token) return "ENV TOKEN (Системный)";
    if (!log.account_id) return "Неизвестный";
    const acc = accounts.find(a => a.id === log.account_id);
    return acc ? acc.full_name : "Удаленный аккаунт";
};

/**
 * Получить имя проекта по логу
 */
export const getProjectName = (log: TokenLog, projects: Project[]): string => {
    if (!log.project_id) return '-';
    const proj = projects.find(p => p.id === log.project_id);
    return proj ? proj.name : log.project_id;
};

/**
 * Получить имя AI токена по логу
 */
export const getAiTokenName = (log: AiTokenLog, tokens: AiToken[]): string => {
    if (log.is_env_token) return "ENV TOKEN (Основной)";
    if (!log.token_id) return "Неизвестный";
    const t = tokens.find(t => t.id === log.token_id);
    return t ? (t.description || "Без названия") : "Удаленный токен";
};

/**
 * Получить JSX бейдж статуса
 */
export const getStatusBadge = (status: string): React.ReactNode => {
    return status === 'success' 
        ? React.createElement('span', { className: "px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800" }, 'Успех')
        : React.createElement('span', { className: "px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800" }, 'Ошибка');
};

/**
 * Получить текст подтверждения удаления
 */
export const getConfirmMessage = (
    confirmAction: 'deleteOne' | 'deleteSelected' | 'deleteAll' | null,
    selectedCount: number,
    activeTab: 'vk' | 'ai'
): string => {
    switch (confirmAction) {
        case 'deleteOne':
            return 'Удалить эту запись?';
        case 'deleteSelected':
            return `Удалить выбранные записи (${selectedCount} шт.)?`;
        case 'deleteAll':
            return `Удалить ВСЕ логи ${activeTab === 'vk' ? 'VK' : 'AI'}? Это действие нельзя отменить.`;
        default:
            return '';
    }
};
